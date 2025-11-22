// src/controllers/user.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../middleware/school-context';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';

const userService = new UserService();

/**
 * Get all users with school-based filtering
 * Super admins see all users, others see only their school's users
 */
export const getUsers = async (req: RequestWithUser, res: Response) => {
  try {
    const { role, isActive, page, limit, search } = req.query;

    // Validate role if provided
    const roleEnum = role && Object.values(Role).includes(role as Role) 
      ? (role as Role) 
      : undefined;

    // Get school context from middleware
    const schoolId = req.schoolId;
    const requestingUserRole = req.user?.role;
    const isSuperAdmin = req.isSuperAdmin || false;

    const result = await userService.getUsers({
      schoolId, // Automatically filtered by school
      role: roleEnum,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      requestingUserRole,
    });

    logger.info('Users fetched', {
      userId: req.user?.userId,
      schoolId,
      isSuperAdmin,
      count: result.data.length,
    });

    return ResponseUtil.paginated(
      res,
      'Users fetched successfully',
      result.data,
      result.pagination
    );
  } catch (err: any) {
    logger.error('Error fetching users', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get user by ID with school validation
 */
export const getUserById = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    const user = await userService.getUserById(id, schoolId, isSuperAdmin);

    if (!user) {
      return ResponseUtil.notFound(res, 'User');
    }

    logger.info('User fetched by ID', {
      userId: req.user?.userId,
      targetUserId: id,
      schoolId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User fetched successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error fetching user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get user by email with school context
 */
export const getUserByEmail = async (req: RequestWithUser, res: Response) => {
  try {
    const { email } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    const user = await userService.getUserByEmail(email, schoolId, isSuperAdmin);

    if (!user) {
      return ResponseUtil.notFound(res, 'User');
    }

    logger.info('User fetched by email', {
      userId: req.user?.userId,
      targetEmail: email,
      schoolId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User fetched successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error fetching user by email', { 
      error: err.message, 
      email: req.params.email 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Change password with school validation
 */
export const changePassword = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return ResponseUtil.validationError(
        res,
        'currentPassword and newPassword are required'
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return ResponseUtil.validationError(
        res,
        'New password must be at least 8 characters long'
      );
    }

    // Verify user belongs to same school (or is super admin)
    const targetUser = await userService.getUserById(id, schoolId, isSuperAdmin);
    if (!targetUser) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Check if user is changing their own password or has admin rights
    const isSelf = req.user?.userId === id;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return ResponseUtil.forbidden(res, 'You can only change your own password');
    }

    await userService.changePassword(id, currentPassword, newPassword);

    logger.info('Password changed', { 
      userId: id, 
      changedBy: req.user?.userId,
      schoolId,
    });

    return ResponseUtil.success(res, 'Password changed successfully');
  } catch (err: any) {
    logger.error('Error changing password', { error: err.message, id: req.params.id });
    
    if (err.message === 'User not found') {
      return ResponseUtil.notFound(res, 'User');
    }
    
    if (err.message === 'Current password is incorrect') {
      return ResponseUtil.validationError(res, 'Current password is incorrect');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Reset user password (admin only) with school validation
 */
export const resetUserPassword = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Validate required field
    if (!newPassword) {
      return ResponseUtil.validationError(res, 'newPassword is required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return ResponseUtil.validationError(
        res,
        'New password must be at least 8 characters long'
      );
    }

    // Verify user belongs to same school
    const targetUser = await userService.getUserById(id, schoolId, isSuperAdmin);
    if (!targetUser) {
      return ResponseUtil.notFound(res, 'User');
    }

    await userService.resetUserPassword(id, newPassword);

    logger.info('User password reset', { 
      userId: id, 
      resetBy: req.user?.userId,
      schoolId,
    });

    return ResponseUtil.success(res, 'Password reset successfully');
  } catch (err: any) {
    logger.error('Error resetting password', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Activate user with school validation
 */
export const activateUser = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Verify user belongs to same school
    const existing = await userService.getUserById(id, schoolId, isSuperAdmin);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    if (existing.isActive) {
      return ResponseUtil.validationError(res, 'User is already active');
    }

    const user = await userService.activateUser(id);

    logger.info('User activated', { 
      userId: id, 
      activatedBy: req.user?.userId,
      schoolId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User activated successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error activating user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Deactivate user with school validation
 */
export const deactivateUser = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Verify user belongs to same school
    const existing = await userService.getUserById(id, schoolId, isSuperAdmin);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    if (!existing.isActive) {
      return ResponseUtil.validationError(res, 'User is already inactive');
    }

    // Prevent deactivating yourself
    if (req.user?.userId === id) {
      return ResponseUtil.validationError(res, 'You cannot deactivate your own account');
    }

    const user = await userService.deactivateUser(id);

    logger.info('User deactivated', { 
      userId: id, 
      deactivatedBy: req.user?.userId,
      schoolId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User deactivated successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error deactivating user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Delete user with school validation
 */
export const deleteUser = async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Verify user belongs to same school
    const existing = await userService.getUserById(id, schoolId, isSuperAdmin);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return ResponseUtil.validationError(res, 'You cannot delete your own account');
    }

    await userService.deleteUser(id, schoolId, isSuperAdmin);

    logger.info('User deleted', { 
      userId: id, 
      deletedBy: req.user?.userId,
      schoolId,
    });

    return ResponseUtil.success(res, 'User deleted successfully');
  } catch (err: any) {
    logger.error('Error deleting user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get current user profile (always allowed)
 */
export const getUserProfile = async (req: RequestWithUser, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const profile = await userService.getUserProfile(userId);

    logger.info('Profile fetched', { userId });

    return ResponseUtil.success(res, 'Profile fetched successfully', profile);
  } catch (err: any) {
    logger.error('Error fetching user profile', { 
      error: err.message, 
      userId: req.user?.userId 
    });
    
    if (err.message === 'User not found') {
      return ResponseUtil.notFound(res, 'User');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get users by school (deprecated - use getUsers instead)
 * Kept for backward compatibility
 */
export const getUsersBySchool = async (req: RequestWithUser, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { role } = req.query;
    const isSuperAdmin = req.isSuperAdmin || false;

    // Validate school access
    if (!isSuperAdmin && req.schoolId !== schoolId) {
      return ResponseUtil.forbidden(res, 'Cannot access users from another school');
    }

    // Validate role if provided
    const roleEnum = role && Object.values(Role).includes(role as Role) 
      ? (role as Role) 
      : undefined;

    const users = await userService.getUsersBySchool(schoolId, roleEnum);

    logger.info('School users fetched', {
      userId: req.user?.userId,
      schoolId,
      role: roleEnum,
    });

    return ResponseUtil.success(
      res,
      'School users fetched successfully',
      users,
      users.length
    );
  } catch (err: any) {
    logger.error('Error fetching school users', { 
      error: err.message, 
      schoolId: req.params.schoolId 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get user statistics (school-filtered)
 */
export const getUserStatistics = async (req: RequestWithUser, res: Response) => {
  try {
    const schoolId = req.schoolId; // From middleware

    const statistics = await userService.getUserStatistics(schoolId);

    logger.info('User statistics fetched', {
      userId: req.user?.userId,
      schoolId,
    });

    return ResponseUtil.success(res, 'User statistics fetched successfully', statistics);
  } catch (err: any) {
    logger.error('Error fetching user statistics', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Verify user credentials (for login - no school filtering needed)
 */
export const verifyCredentials = async (req: RequestWithUser, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return ResponseUtil.validationError(res, 'email and password are required');
    }

    const user = await userService.verifyUserCredentials(email, password);

    if (!user) {
      return ResponseUtil.unauthorized(res, 'Invalid email or password');
    }

    logger.info('User credentials verified', { 
      userId: user.id, 
      email: user.email,
      schoolId: user.schoolId,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'Credentials verified successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error verifying credentials', { 
      error: err.message, 
      email: req.body.email 
    });
    
    if (err.message === 'User account is deactivated') {
      return ResponseUtil.forbidden(
        res, 
        'Your account has been deactivated. Please contact support.'
      );
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Check if email exists (school-filtered for non-super-admins)
 */
export const checkEmailExists = async (req: RequestWithUser, res: Response) => {
  try {
    const { email } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    const exists = await userService.checkEmailExists(email, schoolId, isSuperAdmin);

    return ResponseUtil.success(res, 'Email check completed', { exists });
  } catch (err: any) {
    logger.error('Error checking email', { 
      error: err.message, 
      email: req.params.email 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Check if ID number exists (school-filtered for non-super-admins)
 */
export const checkIdNumberExists = async (req: RequestWithUser, res: Response) => {
  try {
    const { idNumber } = req.params;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    const exists = await userService.checkIdNumberExists(idNumber, schoolId, isSuperAdmin);

    return ResponseUtil.success(res, 'ID number check completed', { exists });
  } catch (err: any) {
    logger.error('Error checking ID number', { 
      error: err.message, 
      idNumber: req.params.idNumber 
    });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Bulk update users (admin only, school-filtered)
 */
export const bulkUpdateUsers = async (req: RequestWithUser, res: Response) => {
  try {
    const { userIds, updates } = req.body;
    const schoolId = req.schoolId;
    const isSuperAdmin = req.isSuperAdmin || false;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return ResponseUtil.validationError(res, 'userIds array is required');
    }

    if (!updates || typeof updates !== 'object') {
      return ResponseUtil.validationError(res, 'updates object is required');
    }

    // Prevent school changes unless super admin
    if (!isSuperAdmin && updates.schoolId) {
      return ResponseUtil.forbidden(res, 'Cannot change school assignment');
    }

    const results = await userService.bulkUpdateUsers(
      userIds, 
      updates, 
      schoolId, 
      isSuperAdmin
    );

    logger.info('Bulk user update', {
      userId: req.user?.userId,
      schoolId,
      count: results.successful.length,
      failed: results.failed.length,
    });

    return ResponseUtil.success(res, 'Bulk update completed', results);
  } catch (err: any) {
    logger.error('Error bulk updating users', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};