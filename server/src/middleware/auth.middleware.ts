import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { ResponseUtil } from '../utils/response';
import { Role } from '@prisma/client';
import logger from '../utils/logger';
import { RequestWithUser } from './school-context';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate middleware - verifies JWT token
 */
export const authenticate = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error: any) {
    logger.warn('Authentication failed', { error: error.message });
    ResponseUtil.unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Authorize middleware - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });

      ResponseUtil.forbidden(
        res,
        'You do not have permission to access this resource'
      );
      return;
    }

    next();
  };
};

// Convenience role guards
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res, 'Authentication required');
    return;
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    logger.warn('Super admin required', { userId: req.user.userId, role: req.user.role });
    ResponseUtil.forbidden(res, 'Super admin privileges required');
    return;
  }
  next();
};

export const requireAdminOrSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res, 'Authentication required');
    return;
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    logger.warn('Admin or Super Admin required', { userId: req.user.userId, role: req.user.role });
    ResponseUtil.forbidden(res, 'Admin or Super Admin role required');
    return;
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Check if user belongs to specific school
 */
export const checkSchoolAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res, 'Authentication required');
    return;
  }

  const { schoolId } = req.params;

  // Super admins can access any school
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // Check if user belongs to the school
  if (!req.user.schoolId || req.user.schoolId !== schoolId) {
    logger.warn('School access denied', {
      userId: req.user.userId,
      userSchoolId: req.user.schoolId,
      requestedSchoolId: schoolId,
    });

    ResponseUtil.forbidden(
      res,
      'You do not have access to this school'
    );
    return;
  }

  next();
};

/**
 * Check if user can access their own resource or is admin
 */
export const checkOwnershipOrAdmin = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Authentication required');
      return;
    }

    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];

    // Allow if user is accessing their own resource
    if (req.user.userId === resourceUserId) {
      next();
      return;
    }

    // Allow if user is admin or super admin
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      next();
      return;
    }

    logger.warn('Ownership check failed', {
      userId: req.user.userId,
      resourceUserId,
    });

    ResponseUtil.forbidden(
      res,
      'You can only access your own resources'
    );
  };
};

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.user?.userId || req.ip || 'anonymous';
    const now = Date.now();

    const record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // Create new record
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { identifier });
      ResponseUtil.error(
        res,
        'Too many requests. Please try again later.',
        429
      );
      return;
    }

    // Increment count
    record.count++;
    next();
  };
};

/**
 * Validate API key for external integrations
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    ResponseUtil.unauthorized(res, 'API key required');
    return;
  }

  // Validate API key (implement your logic)
  const validApiKeys = process.env.API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey as string)) {
    logger.warn('Invalid API key attempted', { apiKey });
    ResponseUtil.unauthorized(res, 'Invalid API key');
    return;
  }

  next();
};

/**
 * Log all requests (useful for debugging)
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.userId,
      ip: req.ip,
    });
  });

  next();
};