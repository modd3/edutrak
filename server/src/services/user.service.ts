// src/services/user.service.ts
import { PrismaClient, User, Role } from '@prisma/client';
import { hashPassword, comparePasswords } from '../utils/hash';
import prisma from '../database/client';
import logger from '../utils/logger';
import { BaseService } from './base.service';

export class UserService extends BaseService {
  /**
   * Get user by ID with school filtering
   */
  async getUserById(
    id: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<User | null> {
    const where = this.buildWhereClause({ id }, schoolId, isSuperAdmin);

    const user = await this.prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
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
                        id: true,
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
                        stream: true,
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

    return user;
  }

  /**
   * Get user by email with school filtering
   */
  async getUserByEmail(
    email: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<User | null> {
    const where = this.buildWhereClause({ email }, schoolId, isSuperAdmin);

    return await this.prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        student: true,
        teacher: true,
        guardian: true,
      },
    });
  }

  /**
   * Get user by ID number with school filtering
   */
  async getUserByIdNumber(
    idNumber: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<User | null> {
    const where = this.buildWhereClause({ idNumber }, schoolId, isSuperAdmin);

    return await this.prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get users with school filtering
   */
  async getUsers(filters?: {
    role?: Role;
    schoolId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    requestingUserRole?: string;
  }) {
    const where: any = {};
    console.log('🔍 UserService.getUsers - Input filters:', filters);

    // Apply school filter (critical for multi-tenancy)
    if (filters?.schoolId) {
      where.schoolId = filters.schoolId;
      console.log('✅ School filter applied:', filters.schoolId);
    } else if (filters?.requestingUserRole !== 'SUPER_ADMIN') {
      // Force no results if no school context for non-super-admin
      where.schoolId = 'NONE';
      console.log('❌ No school context for non-super-admin');
    }

    // Apply other filters
    if (filters?.role) where.role = filters.role;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    // Search filter
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
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;
    console.log('📊 Final query params:', {
      where,
      skip,
      take: limit,
    });

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
          student: {
            select: {
              id: true,
              admissionNo: true,
              gender: true,
            },
          },
          teacher: {
            select: {
              id: true,
              tscNumber: true,
              employmentType: true,
              specialization: true,
            },
          },
          guardian: {
            select: {
              id: true,
              relationship: true,
              _count: {
                select: {
                  students: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    console.log('✅ Query results:', {
      usersFound: users.length,
      totalCount: total,
    });
   
    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user password
   */
  async updateUserPassword(id: string, newPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(newPassword);

    const user = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    logger.info('User password updated successfully', { userId: id });
    return user;
  }

  /**
   * Change password with validation
   */
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

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User deactivated', { userId: id });
    return user;
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('User activated', { userId: id });
    return user;
  }

  /**
   * Delete user with school validation
   */
  async deleteUser(
    id: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<User> {
    // Validate school access
    const hasAccess = await this.validateSchoolAccess(
      id,
      'user',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('User not found or access denied');
    }

    // Delete user (cascades to profiles)
    const user = await this.prisma.user.delete({
      where: { id },
    });

    logger.info('User deleted', { userId: id });
    return user;
  }

  /**
   * Get user profile (no school filtering - users can see their own profile)
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            type: true,
            county: true,
          },
        },
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
                        id: true,
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

  /**
   * Get users by school (with optional role filter)
   */
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
            gender: true,
          },
        },
        teacher: {
          select: {
            id: true,
            tscNumber: true,
            employmentType: true,
          },
        },
        guardian: {
          select: {
            id: true,
            relationship: true,
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

  /**
   * Get user statistics (school-filtered)
   */
  async getUserStatistics(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
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
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.id,
      })),
      recentUsers,
    };
  }

  /**
   * Verify user credentials (for login - no school filtering)
   */
  async verifyUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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

    logger.info('User credentials verified', { 
      userId: user.id, 
      email: user.email,
      schoolId: user.schoolId,
    });
    
    return user;
  }

  /**
   * Reset user password (admin function)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(newPassword);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('User password reset', { userId });
    return user;
  }

  /**
   * Check if email exists (school-filtered for non-super-admins)
   */
  async checkEmailExists(
    email: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<boolean> {
    const where = this.buildWhereClause({ email }, schoolId, isSuperAdmin);

    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Check if ID number exists (school-filtered for non-super-admins)
   */
  async checkIdNumberExists(
    idNumber: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<boolean> {
    const where = this.buildWhereClause({ idNumber }, schoolId, isSuperAdmin);

    const user = await this.prisma.user.findFirst({
      where,
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Update user details (not password)
   */
  async updateUser(
    userId: string,
    data: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      middleName: string;
      phone: string;
      idNumber: string;
      schoolId: string;
    }>,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<User> {
    // Validate school access
    const hasAccess = await this.validateSchoolAccess(
      userId,
      'user',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('User not found or access denied');
    }

    // Prevent school changes unless super admin
    if (!isSuperAdmin && data.schoolId) {
      delete data.schoolId;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info('User updated', { userId });
    return user;
  }

  /**
   * Bulk update users (school-validated)
   */
  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<User>,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ userId: string; error: string }>,
    };

    for (const userId of userIds) {
      try {
        // Validate each user belongs to school
        const hasAccess = await this.validateSchoolAccess(
          userId,
          'user',
          schoolId,
          isSuperAdmin
        );

        if (!hasAccess) {
          results.failed.push({
            userId,
            error: 'User not found or access denied',
          });
          continue;
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: updates,
        });

        results.successful.push(userId);
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error.message,
        });
      }
    }

    logger.info('Bulk user update completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      schoolId,
    });

    return results;
  }

  /**
   * Search users across schools (super admin only)
   */
  async searchUsersGlobally(search: string, limit: number = 20) {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { idNumber: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
    });
  }
}