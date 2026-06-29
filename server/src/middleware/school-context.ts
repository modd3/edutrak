// src/middleware/school-context.ts
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';
import { SubscriptionService } from '../services/subscription.service';
import { TenantSubscription } from '@prisma/client';
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

  // Super admin check FIRST — before subscription enforcement
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  req.isSuperAdmin = isSuperAdmin;

  if (isSuperAdmin) {
    // Check for X-School-Override header
    const overrideSchoolId = req.headers['x-school-override'] as string | undefined;
    
    if (overrideSchoolId) {
      // Validate the school exists
      const school = await prisma.school.findUnique({
        where: { id: overrideSchoolId },
        select: { id: true, name: true },
      });

      if (!school) {
        return res.status(404).json({
          error: 'SCHOOL_NOT_FOUND',
          message: `School with ID "${overrideSchoolId}" not found`,
        });
      }

      req.schoolId = overrideSchoolId;
      req.isInOverrideMode = true;
      req.subscription = undefined; // No subscription enforcement in override mode
      logger.info(`Super Admin ${user.userId} accessing school ${school.name} (${overrideSchoolId}) in override mode`);
    } else {
      req.schoolId = undefined; // No school filter for super admin
      req.isInOverrideMode = false;
      req.subscription = undefined;
    }

    return next();
  }

  // Non-Super Admin: enforce subscription and school context
  const subscriptionService = new SubscriptionService();
  const userSchoolSubscriptions = await subscriptionService.getSubscriptions({
    schoolId: user.schoolId,
  });

  const validSubscriptions = userSchoolSubscriptions.subscriptions;
  const subscription = validSubscriptions.find((s) => SUBSCRIPTION_ACCESS_STATES.includes(s.status));

  req.subscription = subscription;

  if (!subscription) {
    logger.error(`School ${user.schoolId} has no active subscription`, user.schoolId);
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
  // Super admin bypasses check
  if (req.isSuperAdmin) {
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
    return baseWhere;
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