// src/services/class.service.ts
import { BaseService } from './base.service';

export class ClassService extends BaseService {
  /**
   * Get all classes (school-filtered)
   */
  async getClasses(filters: {
    schoolId?: string;
    isSuperAdmin?: boolean;
    academicYearId?: string;
    level?: string;
    curriculum?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      schoolId,
      isSuperAdmin,
      academicYearId,
      level,
      curriculum,
      page,
      limit,
    } = filters;

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (level) where.level = level;
    if (curriculum) where.curriculum = curriculum;

    return this.getPaginated('class', {
      where,
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        academicYear: true,
        classTeacher: {
          include: {
            user: true,
          },
        },
        streams: {
          include: {
            streamTeacher: {
              include: {
                user: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      page,
      limit,
      schoolId,
      isSuperAdmin,
    });
  }

  /**
   * Get single class (school-filtered)
   */
  async getClassById(
    classId: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const where = this.buildWhereClause({ id: classId }, schoolId, isSuperAdmin);

    return await this.prisma.class.findFirst({
      where,
      include: {
        school: true,
        academicYear: true,
        classTeacher: {
          include: {
            user: true,
          },
        },
        streams: {
          include: {
            streamTeacher: {
              include: {
                user: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: true,
            teacherProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: true,
              },
            },
            stream: true,
          },
        },
      },
    });
  }

  /**
   * Create class (school-enforced)
   */
  async createClass(data: any, schoolId: string) {
    data.schoolId = schoolId;

    return await this.prisma.class.create({
      data,
      include: {
        school: true,
        academicYear: true,
      },
    });
  }

  /**
   * Update class (school-validated)
   */
  async updateClass(
    classId: string,
    data: any,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const hasAccess = await this.validateSchoolAccess(
      classId,
      'class',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('Class not found or access denied');
    }

    if (!isSuperAdmin) {
      delete data.schoolId;
    }

    return await this.prisma.class.update({
      where: { id: classId },
      data,
      include: {
        school: true,
        academicYear: true,
        classTeacher: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Delete class (school-validated)
   */
  async deleteClass(
    classId: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ) {
    const hasAccess = await this.validateSchoolAccess(
      classId,
      'class',
      schoolId,
      isSuperAdmin
    );

    if (!hasAccess) {
      throw new Error('Class not found or access denied');
    }

    return await this.prisma.class.delete({
      where: { id: classId },
    });
  }
}

export const classService = new ClassService();
