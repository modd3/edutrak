// src/controllers/entitlement.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middleware/school-context';
import { ResponseUtil } from '../utils/response';
import prisma from '../database/client';

export class EntitlementController {
  async getMyEntitlements(req: RequestWithUser, res: Response) {
    try {
      if (req.isSuperAdmin) {
        return ResponseUtil.success(res, 'Super admin has unrestricted access', { unrestricted: true });
      }

      const subscription = await prisma.tenantSubscription.findFirst({
        where: { schoolId: req.schoolId! },
        orderBy: { createdAt: 'desc' },
        include: { plan: { include: { features: true } } },
      });

      if (!subscription) {
        return ResponseUtil.success(res, 'No active subscription', { status: 'NONE', features: {} });
      }

      const features: Record<string, any> = {};
      for (const f of subscription.plan.features) {
        features[f.featureKey] = { enabled: f.enabled, limitType: f.limitType, limitValue: f.limitValue ?? undefined };
      }

      return ResponseUtil.success(res, 'Entitlements retrieved', {
        status: subscription.status,
        planName: subscription.plan.name,
        planKey: subscription.plan.key,
        currentPeriodEnd: subscription.currentPeriodEnd,
        features,
      });
    } catch (e: any) {
      return ResponseUtil.serverError(res, e.message);
    }
  }
}
export const entitlementController = new EntitlementController();