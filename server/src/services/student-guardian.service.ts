// src/services/student-guardian.service.ts
// Centralized service for managing student-guardian relationships
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/hash';
import logger from '../utils/logger';
import emailService from '../utils/email';
import { BaseService } from './base.service';
import { RequestWithUser } from '../middleware/school-context';

export class StudentGuardianService extends BaseService {
  private req?: RequestWithUser;

  constructor(req?: RequestWithUser) {
    super();
    this.req = req;
  }

  private getSchoolContext() {
    return {
      schoolId: this.req?.schoolId,
      isSuperAdmin: this.req?.isSuperAdmin || false,
      userId: this.req?.user?.userId,
      role: this.req?.user?.role,
    };
  }

  /**
   * Link an existing guardian to an existing student
   */
  async linkGuardianToStudent(data: {
    studentId: string;
    guardianId: string;
    relationship?: string;
    isPrimary?: boolean;
  }) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Validate student belongs to school
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId },
      select: { id: true, schoolId: true },
    });
    if (!student) throw new Error('Student not found');
    if (!isSuperAdmin && schoolId && student.schoolId !== schoolId) {
      throw new Error('Access denied: Student does not belong to your school');
    }

    // Validate guardian belongs to school
    const guardian = await this.prisma.guardian.findFirst({
      where: { id: data.guardianId },
      include: { user: { select: { schoolId: true } } },
    });
    if (!guardian) throw new Error('Guardian not found');
    if (!isSuperAdmin && schoolId && guardian.user.schoolId !== schoolId) {
      throw new Error('Access denied: Guardian does not belong to your school');
    }

    // Check if relationship already exists
    const existing = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: data.studentId,
          guardianId: data.guardianId,
        },
      },
    });
    if (existing) throw new Error('This guardian is already linked to the student');

    // If setting as primary, unset other primaries
    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId: data.studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const relationship = await this.prisma.studentGuardian.create({
      data: {
        id: uuidv4(),
        studentId: data.studentId,
        guardianId: data.guardianId,
        relationship: data.relationship || guardian.relationship,
        isPrimary: data.isPrimary || false,
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        guardian: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    logger.info('Guardian linked to student', {
      studentId: data.studentId,
      guardianId: data.guardianId,
      schoolId,
    });

    return relationship;
  }

  /**
   * Create a new guardian user and link them to a student in one step
   */
  async createGuardianAndLink(data: {
    studentId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone?: string;
    idNumber?: string;
    relationship: string;
    occupation?: string;
    employer?: string;
    workPhone?: string;
    isPrimary?: boolean;
  }) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Validate student
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId },
      select: { id: true, schoolId: true },
    });
    if (!student) throw new Error('Student not found');
    if (!isSuperAdmin && schoolId && student.schoolId !== schoolId) {
      throw new Error('Access denied');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create guardian user
      const guardianUser = await tx.user.create({
        data: {
          id: uuidv4(),
          email: data.email,
          password: await hashPassword(data.password),
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          phone: data.phone,
          idNumber: data.idNumber,
          role: 'PARENT',
          schoolId: student.schoolId,
        },
      });

      // Create guardian profile
      const guardian = await tx.guardian.create({
        data: {
          id: uuidv4(),
          userId: guardianUser.id,
          relationship: data.relationship,
          occupation: data.occupation,
          employer: data.employer,
          workPhone: data.workPhone,
        },
      });

      // If setting as primary, unset other primaries
      if (data.isPrimary) {
        await tx.studentGuardian.updateMany({
          where: { studentId: data.studentId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Link to student
      const link = await tx.studentGuardian.create({
        data: {
          id: uuidv4(),
          studentId: data.studentId,
          guardianId: guardian.id,
          relationship: data.relationship,
          isPrimary: data.isPrimary || false,
        },
      });

      logger.info('Guardian created and linked to student', {
        studentId: data.studentId,
        guardianId: guardian.id,
      });

      return {
        guardian: {
          ...guardian,
          user: guardianUser,
        },
        link,
      };
    });
  }

  /**
   * Update a student-guardian relationship
   */
  async updateRelationship(data: {
    studentId: string;
    guardianId: string;
    relationship?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
  }) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Validate access
    if (!isSuperAdmin) {
      if (!schoolId) throw new Error('School context required');

      const student = await this.prisma.student.findFirst({
        where: { id: data.studentId, schoolId },
        select: { id: true },
      });
      if (!student) throw new Error('Student not found in your school');
    }

    // If setting as primary, unset other primaries first
    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId: data.studentId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.relationship !== undefined) updateData.relationship = data.relationship;
    if (data.isPrimary !== undefined) updateData.isPrimary = data.isPrimary;
    if (data.isVerified !== undefined) {
      updateData.isVerified = data.isVerified;
      updateData.verifiedAt = data.isVerified ? new Date() : null;
      updateData.verifiedById = data.isVerified ? this.req?.user?.userId : null;
    }

    const relationship = await this.prisma.studentGuardian.update({
      where: {
        studentId_guardianId: {
          studentId: data.studentId,
          guardianId: data.guardianId,
        },
      },
      data: updateData,
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        guardian: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    logger.info('Student-guardian relationship updated', {
      studentId: data.studentId,
      guardianId: data.guardianId,
      changes: Object.keys(updateData),
    });

    return relationship;
  }

  /**
   * Verify a student-guardian relationship
   */
  async verifyRelationship(studentId: string, guardianId: string) {
    return this.updateRelationship({
      studentId,
      guardianId,
      isVerified: true,
    });
  }

  /**
   * Unlink (remove) a guardian from a student
   */
  async unlinkGuardian(studentId: string, guardianId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    // Validate access
    if (!isSuperAdmin) {
      if (!schoolId) throw new Error('School context required');

      const student = await this.prisma.student.findFirst({
        where: { id: studentId, schoolId },
        select: { id: true },
      });
      if (!student) throw new Error('Student not found in your school');
    }

    const relationship = await this.prisma.studentGuardian.delete({
      where: {
        studentId_guardianId: { studentId, guardianId },
      },
    });

    logger.info('Guardian unlinked from student', { studentId, guardianId, schoolId });
    return relationship;
  }

  /**
   * Get all guardians for a student with relationship details
   */
  async getStudentGuardians(studentId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    const student = await this.prisma.student.findFirst({
      where: { id: studentId },
      select: { id: true, schoolId: true },
    });
    if (!student) throw new Error('Student not found');
    if (!isSuperAdmin && schoolId && student.schoolId !== schoolId) {
      throw new Error('Access denied');
    }

    return await this.prisma.studentGuardian.findMany({
      where: { studentId },
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
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get all students for a guardian with relationship details
   */
  async getGuardianStudents(guardianId: string) {
    const { schoolId, isSuperAdmin } = this.getSchoolContext();

    return await this.prisma.studentGuardian.findMany({
      where: { guardianId },
      include: {
        student: {
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
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                class: { select: { id: true, name: true, level: true } },
                stream: { select: { id: true, name: true } },
                academicYear: { select: { id: true, year: true } },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }
}