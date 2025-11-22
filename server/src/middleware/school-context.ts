// src/middleware/school-context.ts
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';

export interface RequestWithUser extends Request {
  user?: JwtPayload & {
    schoolId?: string;
    role?: string;
  };
  schoolId?: string;
  isSuperAdmin?: boolean;
}

/**
 * Middleware to enforce school context for ALL resources
 * This is the CRITICAL security layer for multi-tenant isolation
 */
export function enforceSchoolContext(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  console.log('🔐 enforceSchoolContext middleware:', {
    hasUser: !!user,
    userId: user?.userId,
    role: user?.role,
    schoolId: user?.schoolId,
  });

  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  // Super admins can access all schools
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  req.isSuperAdmin = isSuperAdmin;

  if (isSuperAdmin) {
    req.schoolId = undefined; // No school filter for super admin
    return next();
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