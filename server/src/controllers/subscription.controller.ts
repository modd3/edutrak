import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { SubscriptionService } from '../services/subscription.service';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const body = req.body;

      // For ADMIN users, enforce they can only create for their own school
      if (user.role === 'ADMIN') {
        body.schoolId = user.schoolId;
      }

      const subscription = await subscriptionService.createSubscription(body);
      return ResponseUtil.created(res, 'Subscription created successfully', subscription);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      let { schoolId, status, page, limit } = req.query;

      // ADMIN users can only see their own school's subscriptions
      if (user.role === 'ADMIN') {
        schoolId = user.schoolId;
      }

      const result = await subscriptionService.getSubscriptions({
        schoolId: schoolId as string | undefined,
        status: status === "All" ? undefined : status as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return ResponseUtil.paginated(res, 'Subscriptions retrieved successfully', result.subscriptions, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const subscription = await subscriptionService.getSubscriptionById(req.params.id);
      if (!subscription) return ResponseUtil.notFound(res, 'Subscription');

      const user = (req as any).user;
      // ADMIN users can only access their own school's subscription
      if (user.role === 'ADMIN' && subscription.schoolId !== user.schoolId) {
        return ResponseUtil.forbidden(res, 'You do not have access to this subscription');
      }

      return ResponseUtil.success(res, 'Subscription retrieved successfully', subscription);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async transitionStatus(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      const updated = await subscriptionService.transitionSubscriptionStatus(
        req.params.id,
        req.body.status,
        req.body.graceEndsAt,
        user.schoolId, // Pass schoolId for ADMIN validation
        user.userId,   // Pass userId for audit logging
      );
      return ResponseUtil.success(res, 'Subscription status updated successfully', updated);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async changePlan(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      const result = await subscriptionService.changePlan(
        req.params.id,
        req.body.planId,
        req.body.withTrial ? req.body.trialEndsAt : undefined,
        user.schoolId,
        user.userId,
      );
      
      return ResponseUtil.success(res, 'Plan changed successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async renew(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      
      const result = await subscriptionService.renewSubscription(
        req.params.id,
        req.body.withTrial ? req.body.trialEndsAt : undefined,
        user.schoolId,
        user.userId,
      );
      
      return ResponseUtil.success(res, 'Subscription renewed successfully', result);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get the subscription for the authenticated admin's school.
   * GET /subscriptions/my
   */
  async getMySubscription(req: Request, res: Response): Promise<Response> {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) {
        return ResponseUtil.error(res, 'School context required', 400);
      }

      const subscription = await subscriptionService.getSubscriptionBySchool(schoolId);
      if (!subscription) {
        return ResponseUtil.notFound(res, 'Active subscription');
      }
      return ResponseUtil.success(res, 'Subscription retrieved successfully', subscription);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}