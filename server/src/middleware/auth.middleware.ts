import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        schoolId?: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    ResponseUtil.unauthorized(res, 'Access token required');
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    
    logger.info('User authenticated', { 
      userId: decoded.userId, 
      role: decoded.role,
      path: req.path 
    });
    
    next();
  } catch (error: any) {
    logger.warn('Authentication failed', { error: error.message, token: token.substring(0, 20) + '...' });
    ResponseUtil.unauthorized(res, error.message);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      logger.warn('Insufficient permissions', { 
        userId: user?.userId, 
        userRole: user?.role, 
        requiredRoles: roles,
        path: req.path 
      });
      ResponseUtil.forbidden(res);
      return;
    }
    
    next();
  };
};

export const requireSchool = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  
  if (!user?.schoolId) {
    ResponseUtil.forbidden(res, 'School context required');
    return;
  }
  
  next();
};

// Specific role middleware
export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
export const requireAdmin = requireRole(['SUPER_ADMIN', 'ADMIN']);
export const requireTeacher = requireRole(['TEACHER', 'ADMIN', 'SUPER_ADMIN']);
export const requireStudent = requireRole(['STUDENT', 'ADMIN', 'SUPER_ADMIN']);
export const requireGuardian = requireRole(['PARENT', 'ADMIN', 'SUPER_ADMIN']);

export const canAccessProfile = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  const requestedUserId = req.params.id;
  
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.userId === requestedUserId) {
    next();
  } else {
    logger.warn('Profile access denied', { 
      userId: user?.userId, 
      requestedUserId,
      path: req.path 
    });
    ResponseUtil.forbidden(res, 'You can only access your own profile');
  }
};