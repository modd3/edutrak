import { PrismaClient, User, Role } from '@prisma/client';
import { comparePasswords, hashPassword } from '../utils/hash';
import { generateToken, verifyToken } from '../utils/jwt';
import prisma from '../database/client';
import logger from '../utils/logger';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<{
    user: Omit<User, 'password'>;
    token: string;
    refreshToken?: string;
  }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
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
        guardian: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    // Optionally generate refresh token
    const refreshToken = generateToken(
      {
        userId: user.id,
        type: 'refresh',
      },
      '7d' // Refresh token valid for 7 days
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
    };
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    idNumber?: string;
    role?: Role;
    schoolId?: string;
  }): Promise<{
    user: Omit<User, 'password'>;
    token: string;
  }> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if ID number already exists (if provided)
    if (data.idNumber) {
      const existingIdNumber = await this.prisma.user.findUnique({
        where: { idNumber: data.idNumber },
      });

      if (existingIdNumber) {
        throw new Error('User with this ID number already exists');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || 'STUDENT', // Default role
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      });

      const newRefreshToken = generateToken(
        {
          userId: user.id,
          type: 'refresh',
        },
        '7d'
      );

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed successfully', { userId });
  }

  /**
   * Request password reset (generates reset token)
   */
  async requestPasswordReset(email: string): Promise<string> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      throw new Error('If this email exists, a reset link will be sent');
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        type: 'password-reset',
      },
      '1h'
    );

    logger.info('Password reset requested', { userId: user.id, email });

    // In production, send email with reset link
    // await emailService.sendPasswordResetEmail(email, resetToken);

    return resetToken;
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const decoded = verifyToken(resetToken) as {
        userId: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      logger.info('Password reset successfully', { userId: decoded.userId });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Verify user session/token
   */
  async verifySession(token: string): Promise<{
    user: Omit<User, 'password'>;
  }> {
    try {
      // Verify token
      const decoded = verifyToken(token) as {
        userId: string;
        email: string;
        role: Role;
      };

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
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
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Logout user (in a real app, you might blacklist the token)
   */
  async logout(userId: string): Promise<void> {
    logger.info('User logged out', { userId });
    // In production with Redis, you would blacklist the token here
  }

  /**
   * Get user profile with full details
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
              },
            },
            classTeacherOf: {
              include: {
                school: true,
                academicYear: true,
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

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}