import { Student, Gender, EnrollmentStatus, Role } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import emailService from '../utils/email';
import { BaseService } from './base.service';
import { RequestWithUser } from '../middleware/school-context';
import { StudentClassSubjectService } from './student-class-subject.service';

export class StudentService extends BaseService {
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
          schoolId: schoolId, // Add schoolId filter for multi-tenancy safety
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
            where: { 
              status: 'ACTIVE',
              schoolId: schoolId, // Add schoolId filter
            },
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
        orderBy: [
          { admissionNo: 'asc' },
          { createdAt: 'desc' }
          ],
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
    status?: EnrollmentStatus;
    selectedSubjects?: string[]; // Deprecated: will be moved to StudentClassSubject
    schoolId: string;
  }) {
    // Validate student exists and belongs to school
    const student = await this.prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId: data.schoolId,
      },
    });

    if (!student) {
      throw new Error('Student not found in this school');
    }

    // Validate class exists and belongs to school
    const classRecord = await this.prisma.class.findFirst({
      where: {
        id: data.classId,
        schoolId: data.schoolId,
      },
    });

    if (!classRecord) {
      throw new Error('Class not found in this school');
    }

    // Validate academic year exists and belongs to school
    const academicYear = await this.prisma.academicYear.findFirst({
      where: {
        id: data.academicYearId,
        schoolId: data.schoolId,
      },
    });

    if (!academicYear) {
      throw new Error('Academic year not found in this school');
    }

    // Validate stream if provided
    if (data.streamId) {
      const stream = await this.prisma.stream.findFirst({
        where: {
          id: data.streamId,
          classId: data.classId,
          schoolId: data.schoolId,
        },
      });

      if (!stream) {
        throw new Error('Stream not found in this class');
      }
    }

    // Create the enrollment
    const enrollment = await this.prisma.studentClass.create({
      data: {
        id: uuidv4(),
        studentId: data.studentId,
        classId: data.classId,
        streamId: data.streamId || null,
        academicYearId: data.academicYearId,
        schoolId: data.schoolId,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        class: true,
        stream: true,
        academicYear: true,
      },
    });

    // Auto-enroll student in all core subjects
    const subjectService = new StudentClassSubjectService();
    try {
      await subjectService.autoEnrollCoreSubjects(
        enrollment.id,
        data.classId,
        data.schoolId,
        data.studentId
      );
    } catch (error: any) {
      logger.warn('Failed to auto-enroll core subjects', {
        enrollmentId: enrollment.id,
        error: error.message,
      });
      // Don't fail the enrollment if subject auto-enrollment fails
    }

    // Handle selected subjects for electives/optionals if provided
    if (data.selectedSubjects && data.selectedSubjects.length > 0) {
      try {
        const electiveSubjects = await this.prisma.classSubject.findMany({
          where: {
            classId: data.classId,
            subjectId: { in: data.selectedSubjects },
            schoolId: data.schoolId,
            subjectCategory: { in: ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'] },
          },
        });

        for (const subject of electiveSubjects) {
          await subjectService.enrollStudentInSubject({
            studentId: data.studentId,
            classSubjectId: subject.id,
            enrollmentId: enrollment.id,
            schoolId: data.schoolId,
          });
        }
      } catch (error: any) {
        logger.warn('Failed to enroll in selected subjects', {
          enrollmentId: enrollment.id,
          error: error.message,
        });
      }
    }

    logger.info('Student enrolled successfully', { 
      studentId: data.studentId, 
      classId: data.classId,
      enrollmentId: enrollment.id 
    });

    return enrollment;
  }

async updateEnrollment(
  enrollmentId: string,
  data: {
    streamId?: string;
    classId?: string;
    selectedSubjects?: string[]; // Deprecated: use StudentClassSubjectService instead
  },
  schoolId?: string,
  isSuperAdmin: boolean = false
) {
  // Validate access
  const hasAccess = await this.validateSchoolAccess(
    enrollmentId,
    'studentClass',
    schoolId,
    isSuperAdmin
  );

  if (!hasAccess) {
    throw new Error('Enrollment not found or access denied');
  }

  // Get existing enrollment to validate
  const enrollment = await this.prisma.studentClass.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Prepare update data (exclude selectedSubjects from StudentClass)
  const updateData: any = {};
  if (data.streamId !== undefined) updateData.streamId = data.streamId;
  if (data.classId !== undefined) updateData.classId = data.classId;

  const updated = await this.prisma.studentClass.update({
    where: { id: enrollmentId },
    data: updateData,
    include: {
      student: true,
      class: true,
      stream: true,
      academicYear: true,
    },
  });

  // Handle selected subjects separately via StudentClassSubjectService
  if (data.selectedSubjects && data.selectedSubjects.length > 0) {
    try {
      const subjectService = new StudentClassSubjectService();
      
      // Get all elective/optional subjects for the class
      const electiveSubjects = await this.prisma.classSubject.findMany({
        where: {
          classId: updated.classId,
          subjectId: { in: data.selectedSubjects },
          schoolId: schoolId || enrollment.schoolId || '',
          subjectCategory: { in: ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'] },
        },
      });

      // Enroll in elective/optional subjects
      for (const subject of electiveSubjects) {
        try {
          await subjectService.enrollStudentInSubject({
            studentId: updated.studentId,
            classSubjectId: subject.id,
            enrollmentId: updated.id,
            schoolId: schoolId || enrollment.schoolId || '',
          });
        } catch (error: any) {
          // Skip if already enrolled
          if (!error.message.includes('already enrolled')) {
            logger.warn('Failed to enroll in elective subject', {
              error: error.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.warn('Failed to update selected subjects', {
        enrollmentId,
        error: error.message,
      });
    }
  }

  logger.info('Enrollment updated successfully', { enrollmentId });
  return updated;
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
      // Create new enrollment (without selectedSubjects - handled via StudentClassSubjectService)
      this.prisma.studentClass.create({
        data: {
          id: uuidv4(),
          studentId: data.studentId,
          classId: data.newClassId,
          streamId: data.streamId,
          academicYearId: data.academicYearId,
          schoolId: data.studentId, // Will be populated from context
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

    // Handle subject enrollment separately via StudentClassSubjectService
    if (data.selectedSubjects && data.selectedSubjects.length > 0) {
      try {
        const subjectService = new StudentClassSubjectService();
        const newEnrollment = transaction[1];
        
        // Get elective/optional subjects for the new class
        const electiveSubjects = await this.prisma.classSubject.findMany({
          where: {
            classId: data.newClassId,
            subjectId: { in: data.selectedSubjects },
            subjectCategory: { in: ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'] },
          },
        });

        // Enroll student in selected subjects
        for (const subject of electiveSubjects) {
          await subjectService.enrollStudentInSubject({
            studentId: data.studentId,
            classSubjectId: subject.id,
            enrollmentId: newEnrollment.id,
            schoolId: newEnrollment.schoolId || '',
          });
        }
      } catch (error: any) {
        logger.warn('Failed to enroll promoted student in selected subjects', {
          studentId: data.studentId,
          error: error.message,
        });
      }
    }

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
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Verify class access first
    if (!isSuperAdmin) {
      const hasAccess = await this.validateSchoolAccess(classId, 'class', schoolId, isSuperAdmin);
      if (!hasAccess) {
        throw new Error('Class not found or access denied');
      }
    }

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
