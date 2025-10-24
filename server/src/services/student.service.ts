import { PrismaClient, Student, Gender, EnrollmentStatus, Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';
import emailService from '../utils/email';

export class StudentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createStudent(data: {
    admissionNo: string;
    upiNumber?: string;
    nemisUpi?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: Gender;
    dob?: Date;
    birthCertNo?: string;
    nationality?: string;
    county?: string;
    subCounty?: string;
    hasSpecialNeeds?: boolean;
    specialNeedsType?: string;
    medicalCondition?: string;
    allergies?: string;
    schoolId?: string;
    userId?: string;
  }): Promise<Student> {
    const student = await this.prisma.student.create({
      data: {
        id: uuidv4(),
        ...data,
      },
    });

    logger.info('Student created successfully', { studentId: student.id, admissionNo: student.admissionNo });
    return student;
  }

  async createStudentWithUser(data: {
    admissionNo: string;
    upiNumber?: string;
    nemisUpi?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: Gender;
    dob?: Date;
    birthCertNo?: string;
    nationality?: string;
    county?: string;
    subCounty?: string;
    hasSpecialNeeds?: boolean;
    specialNeedsType?: string;
    medicalCondition?: string;
    allergies?: string;
    schoolId?: string;
    email?: string;
    phone?: string;
  }, createdBy: { userId: string; role: Role }) {
    
    const { email, phone, ...studentData } = data;

    return await this.prisma.$transaction(async (tx) => {
      let userId: string | undefined;

      if (email) {
        const temporaryPassword = this.generateTemporaryPassword();
        const user = await tx.user.create({
          data: {
            id: uuidv4(),
            email,
            password: await hashPassword(temporaryPassword),
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            middleName: studentData.middleName,
            phone,
            role: 'STUDENT',
            schoolId: studentData.schoolId,
          },
        });
        userId = user.id;

        // Send welcome email with temporary password
        try {
          await emailService.sendWelcomeEmail(
            email, 
            `${studentData.firstName} ${studentData.lastName}`,
            temporaryPassword
          );
        } catch (error) {
          logger.warn('Failed to send welcome email to student', { email, error });
        }
      }

      const student = await tx.student.create({
        data: {
          id: uuidv4(),
          ...studentData,
          userId,
        },
        include: {
          user: true,
        },
      });

      logger.info('Student with user account created successfully', { 
        studentId: student.id, 
        admissionNo: student.admissionNo,
        createdBy: createdBy.userId 
      });

      return student;
    });
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + 'A1!';
  }

  async getStudents(filters?: {
    schoolId?: string;
    gender?: Gender;
    hasSpecialNeeds?: boolean;
    classId?: string;
    streamId?: string;
    status?: EnrollmentStatus;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.gender) where.gender = filters.gender;
    if (filters?.hasSpecialNeeds !== undefined) where.hasSpecialNeeds = filters.hasSpecialNeeds;

    if (filters?.classId || filters?.streamId || filters?.status) {
      where.enrollments = {
        some: {
          ...(filters.classId && { classId: filters.classId }),
          ...(filters.streamId && { streamId: filters.streamId }),
          ...(filters.status && { status: filters.status }),
        },
      };
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { middleName: { contains: filters.search, mode: 'insensitive' } },
        { admissionNo: { contains: filters.search, mode: 'insensitive' } },
        { upiNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          school: {
            select: { name: true },
          },
          user: {
            select: { email: true, phone: true, isActive: true },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              class: true,
              stream: true,
              academicYear: true,
            },
          },
          guardians: {
            include: {
              guardian: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true, phone: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { admissionNo: 'asc' },
      }),
      this.prisma.student.count({ where })
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getStudentById(id: string): Promise<Student | null> {
    return await this.prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
        user: true,
        enrollments: {
          include: {
            class: true,
            stream: true,
            academicYear: true,
            promotedTo: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        guardians: {
          include: {
            guardian: {
              include: {
                user: true,
              },
            },
          },
        },
        assessments: {
          include: {
            classSubject: {
              include: {
                subject: true,
                class: true,
              },
            },
            term: true,
          },
          orderBy: { assessedDate: 'desc' },
        },
      },
    });
  }

  async getStudentByAdmissionNo(admissionNo: string): Promise<Student | null> {
    return await this.prisma.student.findUnique({
      where: { admissionNo },
      include: {
        school: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            stream: true,
            academicYear: true,
          },
        },
        guardians: {
          include: {
            guardian: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStudent(id: string, data: Partial<Student>): Promise<Student> {
    const student = await this.prisma.student.update({
      where: { id },
      data,
    });

    logger.info('Student updated successfully', { studentId: id });
    return student;
  }

  async enrollStudent(data: {
    studentId: string;
    classId: string;
    streamId?: string;
    academicYearId: string;
    selectedSubjects?: string[];
  }) {
    const enrollment = await this.prisma.studentClass.create({
      data: {
        id: uuidv4(),
        ...data,
        selectedSubjects: data.selectedSubjects || [],
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        class: true,
        stream: true,
        academicYear: true,
      },
    });

    logger.info('Student enrolled successfully', { 
      studentId: data.studentId, 
      classId: data.classId,
      enrollmentId: enrollment.id 
    });

    return enrollment;
  }

  async updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus) {
    const enrollment = await this.prisma.studentClass.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        student: true,
        class: true,
      },
    });

    logger.info('Enrollment status updated', { enrollmentId, status });
    return enrollment;
  }

  async promoteStudent(data: {
    studentId: string;
    currentClassId: string;
    newClassId: string;
    academicYearId: string;
    streamId?: string;
    selectedSubjects?: string[];
  }) {
    const transaction = await this.prisma.$transaction([
      // Update current enrollment status to PROMOTED
      this.prisma.studentClass.updateMany({
        where: {
          studentId: data.studentId,
          classId: data.currentClassId,
          status: 'ACTIVE',
        },
        data: {
          status: 'PROMOTED',
          promotedToId: data.newClassId,
          promotionDate: new Date(),
        },
      }),
      // Create new enrollment
      this.prisma.studentClass.create({
        data: {
          id: uuidv4(),
          studentId: data.studentId,
          classId: data.newClassId,
          streamId: data.streamId,
          academicYearId: data.academicYearId,
          selectedSubjects: data.selectedSubjects || [],
          status: 'ACTIVE',
        },
        include: {
          student: true,
          class: true,
          stream: true,
          academicYear: true,
        },
      }),
    ]);

    logger.info('Student promoted successfully', { 
      studentId: data.studentId, 
      fromClass: data.currentClassId,
      toClass: data.newClassId 
    });

    return transaction[1];
  }

  async transferStudent(data: {
    studentId: string;
    newSchoolId: string;
    transferReason: string;
    transferDate: Date;
  }) {
    const student = await this.prisma.student.update({
      where: { id: data.studentId },
      data: {
        schoolId: data.newSchoolId,
        enrollments: {
          updateMany: {
            where: { status: 'ACTIVE' },
            data: {
              status: 'TRANSFERRED',
              transferredFrom: data.transferReason,
              transferDate: data.transferDate,
            },
          },
        },
      },
      include: {
        school: true,
        enrollments: {
          where: { status: 'TRANSFERRED' },
          take: 1,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    logger.info('Student transferred successfully', { 
      studentId: data.studentId, 
      newSchoolId: data.newSchoolId 
    });

    return student;
  }

  async addGuardianToStudent(data: {
    studentId: string;
    guardianId: string;
    isPrimary?: boolean;
  }) {
    // If setting as primary, remove primary status from other guardians
    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: {
          studentId: data.studentId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const relationship = await this.prisma.studentGuardian.create({
      data: {
        id: uuidv4(),
        ...data,
      },
      include: {
        student: true,
        guardian: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.info('Guardian added to student successfully', { 
      studentId: data.studentId, 
      guardianId: data.guardianId 
    });

    return relationship;
  }

  async getStudentsByClass(classId: string) {
    return await this.prisma.studentClass.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
            guardians: {
              include: {
                guardian: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        class: true,
        stream: true,
        academicYear: true,
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });
  }

  async getStudentPerformance(studentId: string, academicYearId?: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        studentId,
        ...(academicYearId && {
          classSubject: {
            academicYearId: academicYearId,
          },
        }),
        marksObtained: { not: null },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
    });

    const performanceBySubject = assessments.reduce((acc, assessment) => {
      const subjectName = assessment.classSubject.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalMarks: 0,
          count: 0,
          assessments: [],
        };
      }
      
      if (assessment.marksObtained) {
        acc[subjectName].totalMarks += assessment.marksObtained;
        acc[subjectName].count += 1;
      }
      
      acc[subjectName].assessments.push({
        name: assessment.name,
        marks: assessment.marksObtained,
        maxMarks: assessment.maxMarks,
        grade: assessment.grade,
        date: assessment.assessedDate,
      });

      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(performanceBySubject).forEach(subject => {
      const subjectData = performanceBySubject[subject];
      subjectData.average = subjectData.count > 0 ? subjectData.totalMarks / subjectData.count : 0;
    });

    return {
      studentId,
      performanceBySubject,
      overallAverage: Object.values(performanceBySubject).reduce((total: number, subject: any) => total + subject.average, 0) / Object.keys(performanceBySubject).length,
      totalAssessments: assessments.length,
    };
  }

  async bulkCreateStudents(students: any[], schoolId: string, createdBy: string) {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const studentData of students) {
      try {
        const student = await this.createStudent({
          ...studentData,
          schoolId,
        });
        results.successful.push(student);
      } catch (error: any) {
        results.failed.push({
          data: studentData,
          error: error.message,
        });
      }
    }

    logger.info('Bulk student creation completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      createdBy,
    });

    return results;
  }
}