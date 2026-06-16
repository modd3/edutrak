import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

export const auditController = {
  /**
   * GET /api/audit-logs/recent
   * Get recent audit logs for the current user's school / scope
   */
  async getRecent(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const user = req.user!;

      // SUPER_ADMIN sees all, others see their school only
      const filters: { schoolId?: string } = {};
      if (user.role !== 'SUPER_ADMIN') {
        filters.schoolId = user.schoolId;
      }

      const logs = await auditService.getRecent(limit, filters);
      return ResponseUtil.success(res, 'Audit logs fetched successfully', logs);
    } catch (error: any) {
      logger.error('Failed to fetch audit logs', { error: error.message });
      return ResponseUtil.serverError(res, 'Failed to fetch audit logs');
    }
  },

  /**
   * GET /api/audit-logs
   * Get paginated audit logs with filtering
   */
  async getPaginated(req: Request, res: Response) {
    try {
      const user = req.user!;
      const {
        action,
        entityType,
        actorId,
        startDate,
        endDate,
        limit: limitStr,
        offset: offsetStr,
      } = req.query;

      // SUPER_ADMIN sees all, others see their school only
      const filters: Record<string, any> = {};
      if (user.role !== 'SUPER_ADMIN') {
        filters.schoolId = user.schoolId;
      }

      if (action) filters.action = action as string;
      if (entityType) filters.entityType = entityType as string;
      if (actorId) filters.actorId = actorId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limitStr) filters.limit = parseInt(limitStr as string);
      if (offsetStr) filters.offset = parseInt(offsetStr as string);

      const result = await auditService.getPaginated(filters);
      return ResponseUtil.success(res, 'Audit logs fetched successfully', result);
    } catch (error: any) {
      logger.error('Failed to fetch audit logs', { error: error.message });
      return ResponseUtil.serverError(res, 'Failed to fetch audit logs');
    }
  },
};