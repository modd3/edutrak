import prisma from '../database/client';

export interface CreateAuditLogInput {
  schoolId?: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  schoolId?: string;
  actorId?: string;
  entityType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

const db = prisma as any;

export const auditService = {
  /**
   * Create a new audit log entry
   */
  async log(input: CreateAuditLogInput) {
    return db.auditLog.create({
      data: {
        schoolId: input.schoolId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName,
        details: input.details,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },

  /**
   * Get recent audit logs with optional filtering
   */
  async getRecent(limit: number = 20, filters?: { schoolId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.schoolId) {
      where.schoolId = filters.schoolId;
    }

    return db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  },

  /**
   * Get paginated audit logs with advanced filtering
   */
  async getPaginated(filters: AuditLogFilters = {}) {
    const where: Record<string, unknown> = {};

    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = filters.action;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as any).gte = filters.startDate;
      if (filters.endDate) (where.createdAt as any).lte = filters.endDate;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [data, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return { data, total, limit, offset };
  },
};
