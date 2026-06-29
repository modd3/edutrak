// src/middleware/school-context.ts
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';
import { SubscriptionService } from '../services/subscription.service';
import prisma from '../database/client';

export interface RequestWithUser extends Request {
  user?: JwtPayload & {
    schoolId?: string;
    role?: string;
  };
  schoolId?: string;
  isSuperAdmin?: boolean;
  isInOverrideMode?: boolean;
  subscription?: any;
}

const SUBSCRIPTION_ACCESS_STATES = ['TRIALING', 'ACTIVE', 'GRACE'];

/**
 * Middleware to enforce school context for ALL resources
 * This is the CRITICAL security layer for multi-tenant isolation
 */
export async function enforceSchoolContext(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  // Super admins can operate at platform level or explicitly override into a school tenant.
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  req.isSuperAdmin = isSuperAdmin;

  if (isSuperAdmin) {
    const overrideHeader = req.headers['x-school-override'];
    const overrideSchoolId = Array.isArray(overrideHeader) ? overrideHeader[0] : overrideHeader;

    if (overrideSchoolId) {
      const school = await prisma.school.findUnique({
        where: { id: overrideSchoolId },
        select: { id: true },
      });

      if (!school) {
        return res.status(404).json({
          error: 'SCHOOL_OVERRIDE_NOT_FOUND',
          message: 'The requested school override context was not found',
        });
      }

      req.schoolId = school.id;
    } else {
      req.schoolId = undefined;
    }

    return next();
  }

  const subscriptionService = new SubscriptionService();
  const userSchoolSubscriptions = await subscriptionService.getSubscriptions({
    schoolId: user.schoolId,
  });

  const validSubscriptions = userSchoolSubscriptions.subscriptions;
  const subscription = validSubscriptions.find((s) => SUBSCRIPTION_ACCESS_STATES.includes(s.status));

  req.subscription = subscription;

  if (!subscription) {
    logger.error(`School ${user.schoolId} has no active subscription ${req.subscription}`, user.schoolId);
    return res.status(403).json({
      error: 'NO_ACTIVE_SUBSCRIPTION',
      message: 'An Active Subscription is required!',
    });
  }

  // All other roles MUST have a school
  if (!user.schoolId) {
    return res.status(403).json({
      error: 'NO_SCHOOL_ASSIGNED',
      message: 'User must be assigned to a school to access resources',
    });
  }

  // Add schoolId to request for filtering ALL queries
  req.schoolId = user.schoolId;
  req.isInOverrideMode = false;
  next();
}

/**
 * Middleware to validate resource ownership
 * Ensures resources being created/updated belong to user's school
 */
export function validateResourceOwnership(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  // Super admin bypasses cross-school ownership checks, but override mode should
  // still stamp writes with the selected tenant so create/update flows behave
  // exactly like a school admin operating inside that school.
  if (req.isSuperAdmin) {
    if (req.schoolId && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body && typeof req.body === 'object') {
        req.body.schoolId = req.schoolId;
      }
    }
    return next();
  }

  // Get schoolId from various sources
  const resourceSchoolId =
    req.body.schoolId ||
    req.params.schoolId ||
    req.query.schoolId as string;

  // If resource specifies a school, validate it matches user's school
  if (resourceSchoolId && resourceSchoolId !== req.schoolId) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Cannot access resources from another school',
    });
  }

  // For POST/PUT requests, ensure schoolId is set to user's school
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.body && typeof req.body === 'object') {
      req.body.schoolId = req.schoolId;
    }
  }

  next();
}

/**
 * Utility function to build school-aware where clause
 */
export function buildSchoolWhereClause(
  baseWhere: any = {},
  schoolId?: string,
  isSuperAdmin: boolean = false
): any {
  if (isSuperAdmin) {
    return schoolId ? { ...baseWhere, schoolId } : baseWhere;
  }

  if (!schoolId) {
    // Force no results if no school context
    return { ...baseWhere, schoolId: 'NONE' };
  }

  return { ...baseWhere, schoolId };
}

// Type declarations
declare global {
  namespace Express {
    interface Request {
      schoolId?: string;
      isSuperAdmin?: boolean;
    }
  }
}
