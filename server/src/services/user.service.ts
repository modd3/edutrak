import { PrismaClient, User, Role, Teacher, Student } from '@prisma/client';
import { hashPassword, comparePasswords } from '../utils/hash';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    idNumber?: string;
    role: Role;
    schoolId?: string;
  }): Promise<User> {
    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        ...data,
        password: hashedPassword,
      },
    });

    logger.info('User created successfully', { userId: user.id, email: user.email, role: user.role });
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        school: true,
        student: {
          include: {
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
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teacher: {
          include: {
            teachingSubjects: {
              include: {
                class: true,
                subject: true,
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
        },
        guardian: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    school: true,
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
        },
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: true,
        student: true,
        teacher: true,
        guardian: true,
      },
    });
  }

  async getUserByIdNumber(idNumber: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { idNumber },
      include: {
        school: true,
      },
    });
  }

  async getUsers(filters?: {
    role?: Role;
    schoolId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { idNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          phone: true,
          idNumber: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  async updateUser(id: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phone?: string;
    idNumber?: string;
    isActive?: boolean;
  }): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    logger.info('User updated successfully', { userId: id });
    return user;
  }

  async updateUserPassword(id: string, newPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(newPassword);

    const user = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    logger.info('User password updated successfully', { userId: id });
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePasswords(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed successfully', { userId });
    return true;
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User deactivated', { userId: id });
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('User activated', { userId: id });
    return user;
  }

  async deleteUser(id: string): Promise<User> {
    // This should be used carefully - consider soft delete instead
    const user = await this.prisma.user.delete({
      where: { id },
    });

    logger.info('User deleted', { userId: id });
    return user;
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        student: {
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
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                      },
                    },
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
              take: 10,
            },
          },
        },
        teacher: {
          include: {
            teachingSubjects: {
              include: {
                class: true,
                subject: true,
                term: true,
                academicYear: true,
              },
            },
            classTeacherOf: {
              include: {
                school: true,
                academicYear: true,
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
            streamTeacherOf: {
              include: {
                class: true,
                school: true,
                _count: {
                  select: {
                    students: true,
                  },
                },
              },
            },
          },
        },
        guardian: {
          include: {
            students: {
              include: {
                student: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getUsersBySchool(schoolId: string, role?: Role) {
    const where: any = { schoolId };
    if (role) where.role = role;

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            admissionNo: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tscNumber: true,
            employmentType: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return users;
  }

  async getUserStatistics(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: {
          id: true,
        },
      }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.id,
      })),
      recentUsers,
    };
  }

  async verifyUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    logger.info('User credentials verified', { userId: user.id, email: user.email });
    return user;
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(newPassword);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('User password reset', { userId });
    return user;
  }

  async bulkCreateUsers(users: any[], createdBy: string) {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
    };

    for (const userData of users) {
      try {
        const hashedPassword = await hashPassword(userData.password || 'TempPass123!');
        
        const user = await this.prisma.user.create({
          data: {
            id: uuidv4(),
            ...userData,
            password: hashedPassword,
          },
        });
        
        results.successful.push(user);
      } catch (error: any) {
        results.failed.push({
          data: userData,
          error: error.message,
        });
      }
    }

    logger.info('Bulk user creation completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      createdBy,
    });

    return results;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  async checkIdNumberExists(idNumber: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { idNumber },
      select: { id: true },
    });

    return !!user;
  }
}