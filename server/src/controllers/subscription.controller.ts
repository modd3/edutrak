import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { SubscriptionService } from '../services/subscription.service';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const subscription = await subscriptionService.createSubscription(req.body);
      return ResponseUtil.created(res, 'Subscription created successfully', subscription);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const result = await subscriptionService.getSubscriptions({
        schoolId: req.query.schoolId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
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
      return ResponseUtil.success(res, 'Subscription retrieved successfully', subscription);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async transitionStatus(req: Request, res: Response): Promise<Response> {
    try {
      const updated = await subscriptionService.transitionSubscriptionStatus(
        req.params.id,
        req.body.status,
        req.body.graceEndsAt,
      );
      return ResponseUtil.success(res, 'Subscription status updated successfully', updated);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
