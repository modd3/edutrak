import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { auditService } from '../services/audit.service';
import { ResponseUtil } from '../utils/response';
import logger from '../utils/logger';
import { Role } from '@prisma/client';
import { generateToken, JwtPayload, verifyToken } from '../utils/jwt';
import { generateSSOCode, consumeSSOCode, getLMSURL } from '../utils/sso';

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

    // Audit log
    auditService.log({
      schoolId: result.user.schoolId,
      actorId: result.user.id,
      actorRole: result.user.role,
      action: 'LOGIN',
      entityType: 'User',
      entityId: result.user.id,
      entityName: `${result.user.firstName} ${result.user.lastName}`,
      details: `User logged in: ${result.user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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

    // Audit log
    auditService.log({
      schoolId: result.user.schoolId,
      actorId: result.user.id,
      actorRole: result.user.role,
      action: 'REGISTER',
      entityType: 'User',
      entityId: result.user.id,
      entityName: `${result.user.firstName} ${result.user.lastName}`,
      details: `User registered: ${result.user.email} as ${result.user.role}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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

    // Audit log
    auditService.log({
      schoolId: req.user?.schoolId,
      actorId: userId,
      actorRole: req.user!.role,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      details: `User logged out`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((err) => logger.warn('Audit log failed', { error: err.message }));

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

/**
 * Generate LMS SSO redirect URL
 * Authenticated user clicks "E-Learning" -> this endpoint creates a one-time code
 * and redirects to the LMS with it. LMS exchanges code server-to-server for the JWT.
 * This flow keeps JWTs out of browser history/logs.
 *
 * When called with Accept: application/json (from the sidebar's authenticated fetch),
 * returns the redirect URL as JSON instead of doing an HTTP redirect. This allows
 * the frontend to make an authenticated API call (which includes the Bearer token
 * via the axios interceptor) and then open the URL in a new tab.
 */
export const redirectToLMS = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      // If JSON was requested, return error; otherwise redirect to login
      if (req.accepts('json')) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }
      return res.redirect(`${getLMSURL()}/login`);
    }

    // Get the current user with their full payload
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      if (req.accepts('json')) {
        return ResponseUtil.unauthorized(res, 'No token provided');
      }
      return res.redirect(`${getLMSURL()}/login`);
    }

    const payload = verifyToken(token);
    
    // Only allow access tokens (not refresh or reset)
    if (payload.type !== 'access') {
      if (req.accepts('json')) {
        return ResponseUtil.unauthorized(res, 'Invalid token type - re-login required');
      }
      return ResponseUtil.unauthorized(res, 'Invalid token type - re-login required');
    }

    // Generate one-time SSO code with the same payload
    const ssoCode = generateSSOCode(payload);
    
    // For SUPER_ADMIN without school context, allow access too
    const lmsURL = getLMSURL();
    const redirectURL = `${lmsURL}/auth/sso/callback?code=${ssoCode}`;
    
    logger.info('LMS SSO redirect generated', { userId: payload.userId, schoolId: payload.schoolId });
    
    // Audit log — only if we have a valid schoolId to avoid FK violations
    const schoolIdForAudit = payload.schoolId;
    if (schoolIdForAudit && schoolIdForAudit !== "null") {
      auditService.log({
        schoolId: schoolIdForAudit,
        actorId: payload.userId,
        actorRole: payload.role,
        action: 'LMS_SSO_REDIRECT',
        entityType: 'User',
        entityId: payload.userId,
        details: `User redirected to LMS for SSO`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn('Audit log failed', { error: err.message }));
    }
    
    // If the client accepts JSON (e.g. an XHR/fetch from the sidebar),
    // return the URL as JSON so the frontend can open it in a new tab.
    // Otherwise, do a browser redirect (legacy behavior).
    if (req.accepts('json')) {
      return ResponseUtil.success(res, 'LMS SSO redirect URL generated', { redirectUrl: redirectURL });
    }
    
    return res.redirect(redirectURL);
  } catch (err: any) {
    logger.error('LMS SSO redirect failed', { error: err.message });
    if (req.accepts('json')) {
      return ResponseUtil.unauthorized(res, 'Authentication failed');
    }
    return res.redirect(`${getLMSURL()}/login`);
  }
};

/**
 * Exchange SSO code for EduTrak JWT claims
 * Called by LMS backend to exchange a one-time code for the JWT payload
 * This keeps the actual JWT out of browser history/logs
 */
export const exchangeSSOCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return ResponseUtil.validationError(res, 'SSO code is required');
    }

    const payload = consumeSSOCode(code);
    
    if (!payload) {
      return ResponseUtil.unauthorized(res, 'Invalid, expired, or already used SSO code');
    }

    // Return the payload (same structure as JWT claims)
    logger.info('SSO code exchanged', { userId: payload.userId });
    
    return ResponseUtil.success(res, 'SSO code exchanged successfully', payload);
  } catch (err: any) {
    logger.error('SSO code exchange failed', { error: err.message });
    return ResponseUtil.serverError(res, err.message);
  }
};