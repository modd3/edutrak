import { Teacher, EmploymentType, Role, SubjectCategory } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import emailService from '../utils/email';
import { sequenceGenerator } from './sequence-generator.service';
import { BaseService } from './base.service';
import { RequestWithUser } from '../middleware/school-context';

export class TeacherService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  // Helper to get school context from request
  private getSchoolContext() {
    return {
      schoolId: this.req?.schoolId,
      isSuperAdmin: this.req?.isSuperAdmin || false,
      userId: this.req?.user?.userId,
      role: this.req?.user?.role,
    };
  }

  async createTeacher(data: {
    userId: string;
    tscNumber: string;
    employmentType: EmploymentType;
    qualification?: string;
    specialization?: string;
    dateJoined?: Date;
  }): Promise<Teacher> {
    const { userId, ...rest } = data;
    const employeeNumber = await sequenceGenerator.generateEmployeeNumber();

    const teacher = await this.prisma.teacher.create({
      data: {
        id: uuidv4(),
        employeeNumber,
        ...rest,
        user: { connect: { id: userId } },
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
    role?: string; // Added optional role type
  }, createdBy: { userId: string; role: Role }) {
    
    // FIX: Destructure 'role' here to remove it from teacherData
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      idNumber, 
      schoolId, 
      role, // Extracted so it is NOT in teacherData
      ...teacherData 
    } = data as any; // Cast to any to handle extra properties safely

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
          schoolId,
        },
      });

      const employeeNumber = await sequenceGenerator.generateEmployeeNumber(schoolId);
      
      const teacher = await tx.teacher.create({
        data: {
          id: uuidv4(),
          employeeNumber,
          ...teacherData, // Now this is clean and contains only teacher fields
          user: { connect: { id: user.id } },
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = {};

    // Enforce school isolation for non-super admins
    if (!isSuperAdmin) {
      if (!schoolId) {
        where.user = { schoolId: 'NONE' }; // Force no results
      } else {
        where.user = { schoolId };
      }
    } else if (filters?.schoolId) {
      // Super admin can filter by specific school
      where.user = { schoolId: filters.schoolId };
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
          teachingSubjects: {
            include: {
              class: true,
              subject: true,
              academicYear: true,
              term: true,
            },
          },
          classTeacherOf: {
            include: {
              school: true,
              academicYear: true,
            },
          },
          streamTeacherOf: {
            include: {
              class: true,
              school: true,
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = { id };

    if (!isSuperAdmin) {
      if (!schoolId) {
        return null;
      }
      where.user = { schoolId };
    }

    return await this.prisma.teacher.findFirst({
      where,
      include: {
        user: {
          include: {
            school: true,
          },
        },
        teachingSubjects: {
          include: {
            class: true,
            subject: true,
            academicYear: true,
            term: true,
            assessments: {
              include: {
                results: {
                  include: {
                    student: true,
                  },
                  take: 5,
                },
              },
              take: 10,
            },
          },
        },
        classTeacherOf: {
          include: {
            school: true,
            academicYear: true,
            students: {
              where: { status: 'ACTIVE' },
              take: 10,
            },
          },
        },
        streamTeacherOf: {
          include: {
            class: true,
            school: true,
            students: {
              where: { status: 'ACTIVE' },
              take: 10,
            },
          },
        },
      },
    });
  }

  async getTeacherByUserId(userId: string): Promise<Teacher | null> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = { userId };

    if (!isSuperAdmin) {
      if (!schoolId) {
        return null;
      }
      where.user = { schoolId };
    }

    return await this.prisma.teacher.findFirst({
      where,
      include: {
        user: true,
        teachingSubjects: {
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = { tscNumber };

    if (!isSuperAdmin) {
      if (!schoolId) {
        return null;
      }
      where.user = { schoolId };
    }

    return await this.prisma.teacher.findFirst({
      where,
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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin) {
      const existing = await this.prisma.teacher.findFirst({
        where: { id, user: { schoolId } },
        select: { id: true },
      });
      if (!existing) {
        throw new Error('Teacher not found or access denied');
      }
    }

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data,
    });

    logger.info('Teacher updated successfully', { teacherId: id, schoolId });
    return teacher;
  }

  async assignSubjectToTeacher(data: {
    classId: string;
    subjectId: string;
    teacherId: string;
    termId: string;
    academicYearId: string;
    subjectCategory: SubjectCategory;
    strandIds?: string[];
  }) {
    const assignment = await this.prisma.classSubject.create({
      data: {
        id: uuidv4(),
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        termId: data.termId,
        academicYearId: data.academicYearId,
        subjectCategory: data.subjectCategory,
        ...(data.strandIds && data.strandIds.length > 0 && {
          strands: {
            create: data.strandIds.map(strandId => ({
              id: uuidv4(),
              strandId,
            })),
          },
        }),
      },
      include: {
        class: true,
        subject: true,
        teacherProfile: {
          include: {
            user: true,
          },
        },
        term: true,
        academicYear: true,
        strands: {
          include: {
            strand: true,
          },
        },
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
        class: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
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
    const totalStudents = workload.reduce((sum, item) => sum + item.class._count.students, 0);

    return {
      workload,
      statistics: {
        totalSubjects,
        totalAssessments,
        totalStudents,
        averageAssessmentsPerSubject: totalSubjects > 0 ? totalAssessments / totalSubjects : 0,
        averageStudentsPerSubject: totalSubjects > 0 ? totalStudents / totalSubjects : 0,
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
        strands: {
          include: {
            strand: true,
          },
        },
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
    const where: any = {
      assessmentDef: {
        classSubject: {
          teacherId,
          ...(academicYearId && { academicYearId }),
        },
      },
      numericValue: { not: null },
    };

    const results = await this.prisma.assessmentResult.findMany({
      where,
      include: {
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
        student: true,
      },
    });

    const performanceBySubject = results.reduce((acc, result) => {
      const subjectName = result.assessmentDef.classSubject.subject.name;
      const className = result.assessmentDef.classSubject.class.name;
      
      const key = `${subjectName}-${className}`;
      if (!acc[key]) {
        acc[key] = {
          subject: subjectName,
          class: className,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          average: 0,
        };
      }
      
      if (result.numericValue && result.assessmentDef.maxMarks) {
        acc[key].totalMarks += result.numericValue;
        acc[key].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[key].count += 1;
        acc[key].average = (acc[key].totalMarks / acc[key].totalMaxMarks) * 100;
      }

      return acc;
    }, {} as any);

    const performanceArray = Object.values(performanceBySubject);
    const averagePerformance = performanceArray.length > 0
      ? performanceArray.reduce((total: number, subject: any) => total + subject.average, 0) / performanceArray.length
      : 0;

    return {
      teacherId,
      performanceBySubject: performanceArray,
      totalAssessments: results.length,
      averagePerformance,
    };
  }

  async getTeacherClasses(teacherId: string, academicYearId?: string) {
    const where: any = { teacherId };
    if (academicYearId) where.academicYearId = academicYearId;

    const classSubjects = await this.prisma.classSubject.findMany({
      where,
      include: {
        class: {
          include: {
            school: true,
            streams: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        subject: true,
        term: true,
      },
      orderBy: {
        class: {
          name: 'asc',
        },
      },
    });

    // Group by class
    const classesByClass = classSubjects.reduce((acc, cs) => {
      const classId = cs.classId;
      if (!acc[classId]) {
        acc[classId] = {
          class: cs.class,
          subjects: [],
        };
      }
      acc[classId].subjects.push({
        subject: cs.subject,
        term: cs.term,
        classSubjectId: cs.id,
      });
      return acc;
    }, {} as any);

    return {
      teacherId,
      classes: Object.values(classesByClass),
      totalClasses: Object.keys(classesByClass).length,
      totalSubjects: classSubjects.length,
    };
  }
}