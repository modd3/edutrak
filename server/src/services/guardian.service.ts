import { Guardian } from '@prisma/client';
import logger from '../utils/logger';
import { BaseService } from './base.service';
import { RequestWithUser } from '../middleware/school-context';

export class GuardianService extends BaseService {
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

  // NOTE: guardian creation (with or without a new user account) is handled
  // exclusively by UserCreationService.createUserWithProfile - see
  // GuardianController.createGuardianWithUser. Do not re-add a create
  // method here.

  async getGuardians(filters?: {
    schoolId?: string;
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

    if (filters?.search) {
      where.OR = [
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { user: { phone: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [guardians, total] = await Promise.all([
      this.prisma.guardian.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              email: true,
              phone: true,
              idNumber: true,
            },
          },
          students: {
            select: {
              relationship: true,
              isPrimary: true,
              isVerified: true,
              student: {
                select: {
                  id: true,
                  school: {
                    select: {
                      name: true,
                      id: true,
                    }
                  },
                  admissionNo: true,
                  user: {
                    select: {
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      email: true,
                      idNumber: true,
                      isActive: true
                    }
                  },
                  enrollments: {
                    where: { status: 'ACTIVE' },
                    select: {
                      class: {
                        select: {
                          name: true,
                          level: true, 
                          curriculum: true,
                          pathway: true, 
                          isFinal: true
                        }
                      },
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guardian.count({ where })
    ]);

    return {
      guardians,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async getGuardianById(id: string): Promise<Guardian | null> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = { id };

    if (!isSuperAdmin) {
      if (!schoolId) {
        return null;
      }
      where.user = { schoolId };
    }

    return await this.prisma.guardian.findFirst({
      where,
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: { status: 'ACTIVE' },
                  include: {
                    class: true,
                    stream: true,
                    academicYear: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getGuardianByUserId(userId: string): Promise<Guardian | null> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();
    const where: any = { userId };

    if (!isSuperAdmin) {
      if (!schoolId) {
        return null;
      }
      where.user = { schoolId };
    }

    return await this.prisma.guardian.findFirst({
      where,
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: {
                user: true,
                enrollments: {
                  where: { status: 'ACTIVE' },
                  include: {
                    class: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateGuardian(id: string, data: Partial<Guardian>): Promise<Guardian> {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    if (!isSuperAdmin) {
      const existing = await this.prisma.guardian.findFirst({
        where: { id, user: { schoolId } },
        select: { id: true },
      });
      if (!existing) {
        throw new Error('Guardian not found or access denied');
      }
    }

    const guardian = await this.prisma.guardian.update({
      where: { id },
      data,
    });

    logger.info('Guardian updated successfully', { guardianId: id, schoolId });
    return guardian;
  }

  async getGuardianStudents(guardianId: string) {
    return await this.prisma.studentGuardian.findMany({
      where: { guardianId },
      include: {
        student: {
          include: {
            user: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: true,
                stream: true,
                academicYear: true,
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
              take: 5, // Latest 5 assessments
            },
          },
        },
      },
    });
  }

  async getStudentGuardians(studentId: string) {
    return await this.prisma.studentGuardian.findMany({
      where: { studentId },
      include: {
        guardian: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { isPrimary: 'desc' },
    });
  }

  async setPrimaryGuardian(data: {
    studentId: string;
    guardianId: string;
  }) {
    const transaction = await this.prisma.$transaction([
      // Remove primary status from all guardians for this student
      this.prisma.studentGuardian.updateMany({
        where: {
          studentId: data.studentId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      }),
      // Set the specified guardian as primary
      this.prisma.studentGuardian.update({
        where: {
          studentId_guardianId: {
            studentId: data.studentId,
            guardianId: data.guardianId,
          },
        },
        data: { isPrimary: true },
      }),
    ]);

    logger.info('Primary guardian set successfully', { 
      studentId: data.studentId, 
      guardianId: data.guardianId 
    });

    return transaction[1];
  }

  async removeGuardianFromStudent(studentId: string, guardianId: string) {
    const relationship = await this.prisma.studentGuardian.delete({
      where: {
        studentId_guardianId: {
          studentId,
          guardianId,
        },
      },
    });

    logger.info('Guardian removed from student successfully', { studentId, guardianId });
    return relationship;
  }

  async getGuardianNotifications(guardianId: string) {
    // This would integrate with a notification system
    // For now, return basic student performance updates
    const guardianStudents = await this.getGuardianStudents(guardianId);
    
    const notifications = guardianStudents.flatMap(relationship => {
      const student = relationship.student;
      // Filter for assessments with a date and take the latest 3
      const recentAssessments = student.assessmentResults
        .filter(assessment => assessment.createdAt !== null).slice(0, 3);
      
      return recentAssessments.map(assessment => ({
        type: 'ASSESSMENT_UPDATE',
        title: `New Assessment: ${assessment.assessmentDef.name}`,
        message: `${student.user?.firstName} scored ${assessment.numericValue ? assessment.grade : assessment.competencyLevel} in ${assessment.assessmentDef.classSubject.subject.name}`,
        studentId: student.id,
        studentName: `${student.user?.firstName} ${student.user?.lastName}`,
        date: assessment.createdAt!, // We can use non-null assertion as we've filtered out nulls
        priority: 'MEDIUM',
      }));
    });

    return {
      guardianId,
      notifications: notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      unreadCount: notifications.length,
    };
  }

  // ── Static factory ────────────────────────────────────────────────────────

  static withRequest(req: RequestWithUser): GuardianService {
    return new GuardianService(req);
  }
}