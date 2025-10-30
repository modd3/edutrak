import { PrismaClient, Teacher, EmploymentType, Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';
import emailService from '../utils/email';

export class TeacherService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createTeacher(data: {
    userId: string;
    tscNumber: string;
    employmentType: EmploymentType;
    qualification?: string;
    specialization?: string;
    dateJoined?: Date;
  }): Promise<Teacher> {
    const teacher = await this.prisma.teacher.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Teacher created successfully', { teacherId: teacher.id, tscNumber: teacher.tscNumber });
    return teacher;
  }

  async createTeacherWithUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    idNumber?: string;
    tscNumber: string;
    employmentType: EmploymentType;
    qualification?: string;
    specialization?: string;
    dateJoined?: Date;
    schoolId?: string;
  }, createdBy: { userId: string; role: Role }) {
    
    const { email, password, firstName, lastName, middleName, phone, idNumber, ...teacherData } = data;

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: uuidv4(),
          email,
          password: await hashPassword(password),
          firstName,
          lastName,
          middleName,
          phone,
          idNumber,
          role: 'TEACHER',
          schoolId: data.schoolId,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          ...teacherData,
        },
        include: {
          user: true,
        },
      });

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
      } catch (error) {
        logger.warn('Failed to send welcome email to teacher', { email, error });
      }

      logger.info('Teacher with user account created successfully', { 
        teacherId: teacher.id, 
        tscNumber: teacher.tscNumber,
        createdBy: createdBy.userId 
      });

      return teacher;
    });
  }

  async getTeachers(filters?: {
    schoolId?: string;
    employmentType?: EmploymentType;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.schoolId) {
      where.user = {
        schoolId: filters.schoolId,
      };
    }
    if (filters?.employmentType) where.employmentType = filters.employmentType;

    if (filters?.search) {
      where.OR = [
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { tscNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: {
            include: {
              school: {
                select: { name: true },
              },
            },
          },
          classSubjects: {
            include: {
              class: true,
              subject: true,
              academicYear: true,
              term: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.teacher.count({ where })
    ]);

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    return await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            school: true,
          },
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
            academicYear: true,
            term: true,
            assessments: {
              include: {
                student: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getTeacherByUserId(userId: string): Promise<Teacher | null> {
    return await this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: true,
        classSubjects: {
          include: {
            class: true,
            subject: true,
            academicYear: true,
          },
        },
      },
    });
  }

  async getTeacherByTscNumber(tscNumber: string): Promise<Teacher | null> {
    return await this.prisma.teacher.findUnique({
      where: { tscNumber },
      include: {
        user: {
          include: {
            school: true,
          },
        },
      },
    });
  }

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
    const teacher = await this.prisma.teacher.update({
      where: { id },
      data,
    });

    logger.info('Teacher updated successfully', { teacherId: id });
    return teacher;
  }

  async assignSubjectToTeacher(data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    termId: string;
    academicYearId: string;
    strands?: string;
  }) {
    const assignment = await this.prisma.classSubject.create({
      data: {
        id: uuidv4(),
        ...data,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
        term: true,
        academicYear: true,
      },
    });

    logger.info('Subject assigned to teacher successfully', { 
      teacherId: data.teacherId,
      subjectId: data.subjectId,
      classId: data.classId
    });

    return assignment;
  }

  async getTeacherWorkload(teacherId: string, academicYearId?: string) {
    const where: any = { teacherId };
    if (academicYearId) where.academicYearId = academicYearId;

    const workload = await this.prisma.classSubject.findMany({
      where,
      include: {
        class: true,
        subject: true,
        academicYear: true,
        term: true,
        _count: {
          select: {
            assessments: true,
          },
        },
      },
    });

    // Calculate workload statistics
    const totalSubjects = workload.length;
    const totalAssessments = workload.reduce((sum, item) => sum + item._count.assessments, 0);

    return {
      workload,
      statistics: {
        totalSubjects,
        totalAssessments,
        averageAssessmentsPerSubject: totalSubjects > 0 ? totalAssessments / totalSubjects : 0,
      },
    };
  }

  async getTeacherTimetable(teacherId: string, termId: string) {
    // This would integrate with a timetable module
    // For now, return the teacher's class subjects for the term
    const timetable = await this.prisma.classSubject.findMany({
      where: {
        teacherId,
        termId,
      },
      include: {
        class: true,
        subject: true,
        term: true,
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });

    return {
      teacherId,
      termId,
      timetable,
      totalPeriods: timetable.length,
    };
  }

  async getTeacherPerformance(teacherId: string, academicYearId?: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        classSubject: {
          teacherId,
          ...(academicYearId && { academicYearId }),
        },
        marksObtained: { not: null },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            class: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const performanceBySubject = assessments.reduce((acc, assessment) => {
      const subjectName = assessment.classSubject.subject.name;
      const className = assessment.classSubject.class.name;
      
      const key = `${subjectName}-${className}`;
      if (!acc[key]) {
        acc[key] = {
          subject: subjectName,
          class: className,
          totalMarks: 0,
          count: 0,
          average: 0,
        };
      }
      
      if (assessment.marksObtained) {
        acc[key].totalMarks += assessment.marksObtained;
        acc[key].count += 1;
        acc[key].average = acc[key].totalMarks / acc[key].count;
      }

      return acc;
    }, {} as any);

    return {
      teacherId,
      performanceBySubject: Object.values(performanceBySubject),
      totalAssessments: assessments.length,
      averagePerformance: Object.values(performanceBySubject).reduce((total: number, subject: any) => total + subject.average, 0) / Object.keys(performanceBySubject).length,
    };
  }
}