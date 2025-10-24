import { PrismaClient, User, Role } from '@prisma/client';
import { hashPassword, comparePasswords, validatePasswordStrength } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../database/client';
import logger from '../utils/logger';
import emailService from '../utils/email';

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
    tscNumber?: string;
    role: Role;
    schoolId?: string;
  }, createdBy: { userId: string; role: Role }): Promise<{ user: User; token: string }> {
    
    this.validateUserCreation(data.role, createdBy.role);

    if (!validatePasswordStrength(data.password)) {
      throw new Error('Password does not meet strength requirements');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        ...data,
        password: hashedPassword,
      },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
    } catch (error) {
      logger.warn('Failed to send welcome email', { userId: user.id, error });
    }

    logger.info('User created successfully', { userId: user.id, role: user.role, createdBy: createdBy.userId });

    return { user, token };
  }

  private validateUserCreation(targetRole: Role, creatorRole: Role): void {
    const creationRules = {
      SUPER_ADMIN: ['SUPER_ADMIN'],
      ADMIN: ['SUPER_ADMIN'],
      TEACHER: ['SUPER_ADMIN', 'ADMIN'],
      STUDENT: ['SUPER_ADMIN', 'ADMIN'],
      PARENT: ['SUPER_ADMIN', 'ADMIN'],
      SUPPORT_STAFF: ['SUPER_ADMIN', 'ADMIN'],
    };

    const allowedCreators = creationRules[targetRole];
    if (!allowedCreators || !allowedCreators.includes(creatorRole)) {
      throw new Error(`Insufficient permissions to create user with role: ${targetRole}`);
    }
  }

  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: true,
        student: true,
        teacher: true,
        guardian: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or inactive account');
    }

    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const completeProfile = await this.getCompleteUserProfile(user.id);

    const token = generateToken({
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId
    });

    logger.info('User logged in successfully', { userId: user.id, role: user.role });

    return { user: completeProfile, token };
  }

  async getUsers(filters?: {
    role?: Role;
    schoolId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const where: any = {
      ...(filters?.role && { role: filters.role }),
      ...(filters?.schoolId && { schoolId: filters.schoolId }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    };

    // Add search functionality
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          school: {
            select: { name: true },
          },
          student: true,
          teacher: true,
          guardian: true,
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

  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        school: true,
        student: {
          include: {
            enrollments: {
              include: {
                class: true,
                stream: true,
                academicYear: true,
              },
            },
          },
        },
        teacher: {
          include: {
            classSubjects: {
              include: {
                class: true,
                subject: true,
                academicYear: true,
                term: true,
              },
            },
          },
        },
        guardian: {
          include: {
            students: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (data.password) {
      if (!validatePasswordStrength(data.password)) {
        throw new Error('Password does not meet strength requirements');
      }
      data.password = await hashPassword(data.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    logger.info('User updated successfully', { userId: id });

    return user;
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await comparePasswords(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    if (!validatePasswordStrength(newPassword)) {
      throw new Error('New password does not meet strength requirements');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    logger.info('Password updated successfully', { userId: id });

    return updatedUser;
  }

  async setUserActiveStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });

    logger.info('User status updated', { userId: id, isActive });

    return user;
  }

  async getCompleteUserProfile(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        student: {
          include: {
            enrollments: {
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
        },
        teacher: {
          include: {
            classSubjects: {
              include: {
                class: true,
                subject: true,
                academicYear: true,
                term: true,
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
                    enrollments: {
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
        classTeacherOf: true,
        streamTeacherOf: true,
        teachingSubjects: true,
      },
    });
  }

  async searchUsers(query: string, schoolId?: string) {
    return await this.prisma.user.findMany({
      where: {
        ...(schoolId && { schoolId }),
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        school: { select: { name: true } },
      },
    });
  }

  async getUserStats(schoolId?: string) {
    const where = schoolId ? { schoolId } : {};

    const stats = await this.prisma.user.groupBy({
      by: ['role'],
      where,
      _count: {
        id: true,
      },
    });

    const total = await this.prisma.user.count({ where });

    return {
      total,
      byRole: stats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}