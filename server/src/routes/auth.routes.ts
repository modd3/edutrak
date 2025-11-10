import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifySession,
  getProfile,
  logout,
  validatePassword,
} from '../controllers/auth.controller';
import { authenticate, rateLimit, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', rateLimit(5, 15 * 60 * 1000), login);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authorize('ADMIN', 'SUPER_ADMIN'), rateLimit(3, 60 * 60 * 1000), register);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/request-password-reset', rateLimit(3, 60 * 60 * 1000), requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   POST /api/auth/verify-session
 * @desc    Verify if token is valid
 * @access  Public
 */
router.post('/verify-session', verifySession);

/**
 * @route   POST /api/auth/validate-password
 * @desc    Validate password strength
 * @access  Public
 */
router.post('/validate-password', validatePassword);

// Protected routes (authentication required)
/**
 * @route   GET /api/auth/profile
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

export default router;