import { Response, NextFunction } from 'express';
import { RequestWithUser } from './school-context';
import prisma from '../database/client';
import logger from '../utils/logger';

const ALLOWED_STATUSES = ['TRIALING', 'ACTIVE', 'GRACE'];

/**
 * Middleware to enforce active subscription status for all operational routes.
 * Skips checks for SUPER_ADMIN.
 */
export async function enforceSubscription(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Super Admins bypass subscription checks
    if (req.isSuperAdmin) {
      return next();
    }

    const schoolId = req.schoolId;

    // 2. If school context is missing, return error
    if (!schoolId) {
      res.status(403).json({
        success: false,
        error: 'SCHOOL_CONTEXT_REQUIRED',
        message: 'School context is required to verify subscription status',
      });
      return;
    }

    // 3. Find the latest subscription for this school
    const subscription = await (prisma as any).tenantSubscription.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (!subscription) {
      logger.warn('Subscription check failed: No subscription found', { schoolId });
      res.status(402).json({
        success: false,
        error: 'NO_ACTIVE_SUBSCRIPTION',
        message: 'No subscription found for this school. Please subscribe to access the system.',
      });
      return;
    }

    // 4. Validate status
    if (!ALLOWED_STATUSES.includes(subscription.status)) {
      logger.warn('Subscription check failed: Inactive status', {
        schoolId,
        status: subscription.status,
      });

      res.status(402).json({
        success: false,
        error: 'SUBSCRIPTION_INACTIVE',
        status: subscription.status,
        message: `Your school's subscription status is ${subscription.status}. Please renew your subscription to access operational resources.`,
      });
      return;
    }

    // 5. Attach subscription to request for downstream handlers
    req.subscription = subscription;
    next();
  } catch (error: any) {
    logger.error('Error in subscription middleware', { error: error.message });
    next(error);
  }
}
