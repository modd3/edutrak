import { PrismaClient, Student, Gender, EnrollmentStatus, Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';
import emailService from '../utils/email';
import { BaseService } from './base.service'

export class StudentService extends BaseService {

  /*
  ** Get all students
  */ 

  async getStudents(filters?: {
    schoolId?: string;
    gender?: Gender;
    isSuperAdmin?: boolean;
    hasSpecialNeeds?: boolean;
    classId?: string;
    streamId?: string;
    status?: EnrollmentStatus;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const {
      schoolId,
      gender,
      isSuperAdmin,
      hasSpecialNeeds,
      classId,
      streamId,
      status,
      search,
    } = filters;

    const where: any = {};

    if (schoolId) where.schoolId = schoolId;
    if (filters?.gender) where.gender = filters.gender;
    if (filters?.hasSpecialNeeds !== undefined) where.hasSpecialNeeds = filters.hasSpecialNeeds;

    if (filters?.classId || filters?.streamId || filters?.status) {
      where.enrollments = {
        some: {
          ...(filters.classId && { classId: filters.classId }),
          ...(filters.streamId && { streamId: filters.streamId }),
          ...(status && { status: filters.status }),
        },
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { middleName: { contains: filters.search, mode: 'insensitive' } },
        { admissionNo: { contains: filters.search, mode: 'insensitive' } },
        { upiNumber: { contains: filters.search, mode: 'insensitive' } },
        { kemisUpi: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    return this.getPaginated('student', {
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
        orderBy: { admissionNo: 'asc',
          createdAt: 'desc'
         },
         page,
         limit,
         schoolId,
         isSuperAdmin
      });
  }

  async getStudentById(
    studentId: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const where = this.buildWhereClause({id: studentId}, schoolId, isSuperAdmin);

    const student =  await this.prisma.student.findFirst({
      where,
      include: {
        school: {
          select: {
            name: true,
            county: true,
            gender: true,
            boardingStatus: true
          }
        },
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
        assessmentResults: {
          include: {
            assessmentDef: {
              include: {
                classSubject: {
                  include: {
                    subject: true,
                  },
                },
                term: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    return student;
  }

  async getStudentByAdmissionNo(
    admissionNo: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const where = this.buildWhereClause({admissionNo: admissionNo}, schoolId, isSuperAdmin);

    return await this.prisma.student.findUnique({
      where,
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

  async updateStudent(
    studentId: string,
    data: Partial<Student>,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<Student> {

    const hasAccess = await this.validateSchoolAccess(
      studentId,
      'student',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('Student not found or access denied!')
    }
    const student = await this.prisma.student.update({
      where: { id: studentId },
      data,
      include: {
        user: true,
        school: true
      }
    });

    logger.info('Student updated successfully', { studentId: studentId });
    return student;
  }

  async deleteStudent(
    studentId: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const hasAccess = await this.validateSchoolAccess(
      studentId,
      'student',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('Student not found or access denied');
    }

    // This should cascade delete the user as well
    return await this.prisma.student.delete({
      where: { id: studentId },
    });
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
        student: true,
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
    const where: any = {
      studentId,
      numericValue: { not: null },
    };

    if (academicYearId) {
      where.assessmentDef = {
        classSubject: {
          academicYearId: academicYearId,
        },
      };
    }

    const results = await this.prisma.assessmentResult.findMany({
      where,
      include: {
        assessmentDef: {
          include: {
            classSubject: {
              include: {
                subject: true,
              },
            },
            term: true,
          },
        },
      },
    });

    const performanceBySubject = results.reduce((acc, result) => {
      const subjectName = result.assessmentDef.classSubject.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          subject: subjectName,
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          results: [],
        };
      }
      
      if (result.numericValue && result.assessmentDef.maxMarks) {
        acc[subjectName].totalMarks += result.numericValue;
        acc[subjectName].totalMaxMarks += result.assessmentDef.maxMarks;
        acc[subjectName].count += 1;
      }
      
      acc[subjectName].results.push({
        name: result.assessmentDef.name,
        marks: result.numericValue,
        maxMarks: result.assessmentDef.maxMarks,
        grade: result.grade,
        competencyLevel: result.competencyLevel,
        date: result.createdAt,
      });

      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(performanceBySubject).forEach(subject => {
      const subjectData = performanceBySubject[subject];
      subjectData.average = subjectData.count > 0 
        ? (subjectData.totalMarks / subjectData.totalMaxMarks) * 100 
        : 0;
    });

    const subjectsArray = Object.values(performanceBySubject);
    const overallAverage = subjectsArray.length > 0
      ? subjectsArray.reduce((total: number, subject: any) => total + subject.average, 0) / subjectsArray.length
      : 0;

    return {
      studentId,
      performanceBySubject,
      overallAverage,
      totalAssessments: results.length,
    };
  }
  async getStudentStatistics(schoolId?: string, isSuperAdmin: boolean = false) {
    const where = this.buildWhereClause({}, schoolId, isSuperAdmin);

    return {
      total: await this.prisma.student.count({ where }),
      byGender: await this.prisma.student.groupBy({
        by: ['gender'],
        where,
        _count: true,
      }),
      byClass: await this.prisma.studentClass.groupBy({
        by: ['classId'],
        where: {
          student: where,
          status: 'ACTIVE',
        },
        _count: true,
      }),
    };
  }
}