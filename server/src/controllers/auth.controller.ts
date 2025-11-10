import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';

const authService = new AuthService();

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return ResponseUtil.validationError(res, 'Email and password are required');
    }

    const result = await authService.login(email, password);

    logger.info('User logged in', { 
      userId: result.user.id, 
      email: result.user.email,
      role: result.user.role 
    });

    return ResponseUtil.success(res, 'Login successful', result);
  } catch (err: any) {
    logger.warn('Login failed', { email: req.body.email, error: err.message });

    if (err.message === 'Invalid email or password') {
      return ResponseUtil.unauthorized(res, 'Invalid email or password');
    }

    if (err.message.includes('deactivated')) {
      return ResponseUtil.forbidden(res, err.message);
    }

    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Register new user
 */
export const register = async (req: Request, res: Response) => {
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
      schoolId,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return ResponseUtil.validationError(
        res,
        'Email, password, firstName, and lastName are required'
      );
    }

    // Validate role if provided
    if (role && !Object.values(Role).includes(role)) {
      return ResponseUtil.validationError(
        res,
        `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`
      );
    }

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return ResponseUtil.validationError(
        res,
        passwordValidation.errors.join(', ')
      );
    }

    const result = await authService.register({
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

    logger.info('User registered', { 
      userId: result.user.id, 
      email: result.user.email,
      role: result.user.role 
    });

    return ResponseUtil.created(res, 'Registration successful', result);
  } catch (err: any) {
    logger.error('Registration failed', { email: req.body.email, error: err.message });

    if (err.message.includes('already exists')) {
      return ResponseUtil.conflict(res, err.message);
    }

    if (err.code === 'P2002') {
      return ResponseUtil.conflict(res, 'User with this email or ID number already exists');
    }

    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ResponseUtil.validationError(res, 'Refresh token is required');
    }

    const result = await authService.refreshToken(refreshToken);

    return ResponseUtil.success(res, 'Token refreshed successfully', result);
  } catch (err: any) {
    logger.warn('Token refresh failed', { error: err.message });
    return ResponseUtil.unauthorized(res, 'Invalid or expired refresh token');
  }
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return ResponseUtil.validationError(
        res,
        'Current password and new password are required'
      );
    }

    // Validate new password strength
    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return ResponseUtil.validationError(
        res,
        passwordValidation.errors.join(', ')
      );
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      return ResponseUtil.validationError(
        res,
        'New password must be different from current password'
      );
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    logger.info('Password changed', { userId });

    return ResponseUtil.success(res, 'Password changed successfully');
  } catch (err: any) {
    logger.error('Password change failed', { userId: req.user?.userId, error: err.message });

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
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ResponseUtil.validationError(res, 'Email is required');
    }

    const resetToken = await authService.requestPasswordReset(email);

    logger.info('Password reset requested', { email });

    // In production, the token would be sent via email
    // For development, we return it in the response
    return ResponseUtil.success(res, 'Password reset instructions sent to your email', {
      message: 'If this email exists, a reset link will be sent',
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (err: any) {
    logger.error('Password reset request failed', { email: req.body.email, error: err.message });

    // Always return success to prevent email enumeration
    return ResponseUtil.success(res, 'If this email exists, a reset link will be sent');
  }
};

/**
 * Reset password using token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return ResponseUtil.validationError(res, 'Token and new password are required');
    }

    // Validate new password strength
    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return ResponseUtil.validationError(
        res,
        passwordValidation.errors.join(', ')
      );
    }

    await authService.resetPassword(token, newPassword);

    logger.info('Password reset successful');

    return ResponseUtil.success(res, 'Password reset successfully');
  } catch (err: any) {
    logger.error('Password reset failed', { error: err.message });

    if (err.message.includes('Invalid or expired')) {
      return ResponseUtil.validationError(res, 'Invalid or expired reset token');
    }

    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Verify session/token
 */
export const verifySession = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return ResponseUtil.unauthorized(res, 'No token provided');
    }

    const result = await authService.verifySession(token);

    return ResponseUtil.success(res, 'Session verified', result);
  } catch (err: any) {
    logger.warn('Session verification failed', { error: err.message });
    return ResponseUtil.unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Get authenticated user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    const profile = await authService.getProfile(userId);

    return ResponseUtil.success(res, 'Profile fetched successfully', profile);
  } catch (err: any) {
    logger.error('Get profile failed', { userId: req.user?.userId, error: err.message });

    if (err.message === 'User not found') {
      return ResponseUtil.notFound(res, 'User');
    }

    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return ResponseUtil.unauthorized(res);
    }

    await authService.logout(userId);

    logger.info('User logged out', { userId });

    return ResponseUtil.success(res, 'Logout successful');
  } catch (err: any) {
    logger.error('Logout failed', { userId: req.user?.userId, error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};

/**
 * Validate password strength
 */
export const validatePassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return ResponseUtil.validationError(res, 'Password is required');
    }

    const validation = authService.validatePasswordStrength(password);

    return ResponseUtil.success(res, 'Password validation completed', validation);
  } catch (err: any) {
    logger.error('Password validation failed', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};