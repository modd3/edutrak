import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';

const userService = new UserService();

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      idNumber, 
      role, 
      schoolId 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return ResponseUtil.validationError(
        res,
        'email, password, firstName, lastName, and role are required'
      );
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
      return ResponseUtil.validationError(
        res,
        `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`
      );
    }

    // Check if email already exists
    const emailExists = await userService.checkEmailExists(email);
    if (emailExists) {
      return ResponseUtil.conflict(res, 'User with this email already exists');
    }

    // Check if ID number already exists (if provided)
    if (idNumber) {
      const idExists = await userService.checkIdNumberExists(idNumber);
      if (idExists) {
        return ResponseUtil.conflict(res, 'User with this ID number already exists');
      }
    }

    const user = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      idNumber,
      role,
      schoolId,
    });

    logger.info('User created', { userId: user.id, createdBy: req.user?.userId });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.created(res, 'User created successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error creating user', { error: err.message });
    
    if (err.code === 'P2002') {
      return ResponseUtil.conflict(res, 'User with this email or ID number already exists');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get all users with filters
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, schoolId, isActive, page, limit, search } = req.query;

    // Validate role if provided
    const roleEnum = role && Object.values(Role).includes(role as Role) 
      ? (role as Role) 
      : undefined;

    const result = await userService.getUsers({
      role: roleEnum,
      schoolId: schoolId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    });

    return ResponseUtil.paginated(
      res,
      'Users fetched successfully',
      result.users,
      result.pagination
    );
  } catch (err: any) {
    logger.error('Error fetching users', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await userService.getUserById(id);
    console.log(user);

    if (!user) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User fetched successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error fetching user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const user = await userService.getUserByEmail(email);

    if (!user) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User fetched successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error fetching user by email', { error: err.message, email: req.params.email });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, middleName, phone, idNumber, isActive } = req.body;

    const existing = await userService.getUserById(id);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existing.email) {
      const emailExists = await userService.checkEmailExists(email);
      if (emailExists) {
        return ResponseUtil.conflict(res, 'User with this email already exists');
      }
    }

    // Check if ID number is being changed and if it already exists
    if (idNumber && idNumber !== existing.idNumber) {
      const idExists = await userService.checkIdNumberExists(idNumber);
      if (idExists) {
        return ResponseUtil.conflict(res, 'User with this ID number already exists');
      }
    }

    const user = await userService.updateUser(id, {
      email,
      firstName,
      lastName,
      middleName,
      phone,
      idNumber,
      isActive,
    });

    logger.info('User updated', { userId: id, updatedBy: req.user?.userId });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User updated successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error updating user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

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

    // Check if user is changing their own password or has admin rights
    if (req.user?.userId !== id && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      return ResponseUtil.forbidden(res, 'You can only change your own password');
    }

    await userService.changePassword(id, currentPassword, newPassword);

    logger.info('Password changed', { userId: id, changedBy: req.user?.userId });

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
 * Reset user password (admin only)
 */
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

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

    const user = await userService.resetUserPassword(id, newPassword);

    logger.info('User password reset', { userId: id, resetBy: req.user?.userId });

    return ResponseUtil.success(res, 'Password reset successfully');
  } catch (err: any) {
    logger.error('Error resetting password', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Activate user
 */
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await userService.getUserById(id);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    if (existing.isActive) {
      return ResponseUtil.validationError(res, 'User is already active');
    }

    const user = await userService.activateUser(id);

    logger.info('User activated', { userId: id, activatedBy: req.user?.userId });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User activated successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error activating user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await userService.getUserById(id);
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

    logger.info('User deactivated', { userId: id, deactivatedBy: req.user?.userId });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'User deactivated successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error deactivating user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await userService.getUserById(id);
    if (!existing) {
      return ResponseUtil.notFound(res, 'User');
    }

    // Prevent deleting yourself
    if (req.user?.userId === id) {
      return ResponseUtil.validationError(res, 'You cannot delete your own account');
    }

    await userService.deleteUser(id);

    logger.info('User deleted', { userId: id, deletedBy: req.user?.userId });

    return ResponseUtil.success(res, 'User deleted successfully');
  } catch (err: any) {
    logger.error('Error deleting user', { error: err.message, id: req.params.id });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const profile = await userService.getUserProfile(userId);

    return ResponseUtil.success(res, 'Profile fetched successfully', profile);
  } catch (err: any) {
    logger.error('Error fetching user profile', { error: err.message, userId: req.user?.userId });
    
    if (err.message === 'User not found') {
      return ResponseUtil.notFound(res, 'User');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Get users by school
 */
export const getUsersBySchool = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const { role } = req.query;

    // Validate role if provided
    const roleEnum = role && Object.values(Role).includes(role as Role) 
      ? (role as Role) 
      : undefined;

    const users = await userService.getUsersBySchool(schoolId, roleEnum);

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
 * Get user statistics
 */
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.query;

    const statistics = await userService.getUserStatistics(schoolId as string);

    return ResponseUtil.success(res, 'User statistics fetched successfully', statistics);
  } catch (err: any) {
    logger.error('Error fetching user statistics', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Verify user credentials (for login)
 */
export const verifyCredentials = async (req: Request, res: Response) => {
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

    logger.info('User credentials verified', { userId: user.id, email: user.email });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(res, 'Credentials verified successfully', userWithoutPassword);
  } catch (err: any) {
    logger.error('Error verifying credentials', { error: err.message, email: req.body.email });
    
    if (err.message === 'User account is deactivated') {
      return ResponseUtil.forbidden(res, 'Your account has been deactivated. Please contact support.');
    }
    
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Bulk create users
 */
export const bulkCreateUsers = async (req: Request, res: Response) => {
  try {
    const { users } = req.body;
    const createdBy = req.user?.userId || 'system';

    if (!users || !Array.isArray(users) || users.length === 0) {
      return ResponseUtil.validationError(res, 'users array is required and must not be empty');
    }

    const results = await userService.bulkCreateUsers(users, createdBy);

    logger.info('Bulk user creation completed', {
      successful: results.successful.length,
      failed: results.failed.length,
      createdBy,
    });

    return ResponseUtil.success(
      res,
      `Bulk user creation completed. ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    );
  } catch (err: any) {
    logger.error('Error in bulk user creation', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Check if email exists
 */
export const checkEmailExists = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const exists = await userService.checkEmailExists(email);

    return ResponseUtil.success(res, 'Email check completed', { exists });
  } catch (err: any) {
    logger.error('Error checking email', { error: err.message, email: req.params.email });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Check if ID number exists
 */
export const checkIdNumberExists = async (req: Request, res: Response) => {
  try {
    const { idNumber } = req.params;

    const exists = await userService.checkIdNumberExists(idNumber);

    return ResponseUtil.success(res, 'ID number check completed', { exists });
  } catch (err: any) {
    logger.error('Error checking ID number', { error: err.message, idNumber: req.params.idNumber });
    return ResponseUtil.serverError(res, err.message);
  }
};