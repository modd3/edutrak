import { NextFunction, Response } from 'express';
import { RequestWithUser } from './school-context';
import { entitlementService } from '../services/entitlement.service';

export const requireFeature = (featureKey: string) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.isSuperAdmin) {
      return next();
    }

    const schoolId = req.schoolId;
    if (!schoolId) {
      return res.status(403).json({
        error: 'SCHOOL_CONTEXT_REQUIRED',
        message: 'School context is required for entitlement checks',
      });
    }

    const decision = await entitlementService.canUseFeature(schoolId, featureKey);
    if (!decision.allowed) {
      return res.status(402).json({
        error: 'FEATURE_NOT_AVAILABLE',
        featureKey,
        message: decision.reason ?? 'Feature is not available for current subscription',
      });
    }

    next();
  };
};
