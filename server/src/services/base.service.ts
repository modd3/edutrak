// src/services/base.service.ts
import { PrismaClient } from '@prisma/client';
import prisma from '../database/client';

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Build where clause with school filtering
   */
  protected buildWhereClause(
    baseWhere: any = {},
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): any {
    if (isSuperAdmin) {
      return baseWhere;
    }

    if (!schoolId) {
      // Force no results if no school context
      return { ...baseWhere, schoolId: 'NONE' };
    }

    return { ...baseWhere, schoolId };
  }

  /**
   * Validate that a resource belongs to the requesting user's school
   */
  protected async validateSchoolAccess(
    resourceId: string,
    model: string,
    schoolId?: string,
    isSuperAdmin: boolean = false
  ): Promise<boolean> {
    if (isSuperAdmin) {
      return true;
    }

    if (!schoolId) {
      return false;
    }

    const resource = await (this.prisma as any)[model].findUnique({
      where: { id: resourceId },
      select: { schoolId: true },
    });

    if (!resource) {
      return false;
    }

    return resource.schoolId === schoolId;
  }

  /**
   * Get paginated results with school filtering
   */
  protected async getPaginated<T>(
    model: string,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      page?: number;
      limit?: number;
      schoolId?: string;
      isSuperAdmin?: boolean;
    }
  ) {
    const {
      where = {},
      include,
      orderBy,
      page = 1,
      limit = 20,
      schoolId,
      isSuperAdmin = false,
    } = options;

    const schoolWhere = this.buildWhereClause(where, schoolId, isSuperAdmin);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (this.prisma as any)[model].findMany({
        where: schoolWhere,
        include,
        orderBy,
        skip,
        take: limit,
      }),
      (this.prisma as any)[model].count({ where: schoolWhere }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}