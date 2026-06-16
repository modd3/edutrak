import api from './client';

export interface AuditLog {
  id: string;
  schoolId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export const auditApi = {
  /**
   * Get recent audit logs (for dashboard widgets)
   */
  getRecent: (limit: number = 20) =>
    api.get<{ success: boolean; data: AuditLog[] }>('/audit-logs/recent', {
      params: { limit },
    }),

  /**
   * Get paginated audit logs with filtering (for audit trail page)
   */
  getPaginated: (filters?: AuditLogFilters) =>
    api.get<{ success: boolean; data: PaginatedAuditLogs }>('/audit-logs', {
      params: filters,
    }),
};