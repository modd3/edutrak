import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { 
  authenticateToken, 
  requireAdmin, 
  requireSuperAdmin,
  canAccessProfile 
} from '../middleware/auth.middleware';
import {
  validateLogin,
  validateCreateUser,
  validateUpdateUser,
  validateChangePassword,
  validateUUIDParam,
  validatePagination
} from '../middleware/validation';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/login', validateLogin, userController.login);

// Protected routes
router.use(authenticateToken);

// User management (Admin only)
router.post('/', requireAdmin, validateCreateUser, userController.createUser);
router.get('/', requireAdmin, validatePagination, userController.getUsers);
router.get('/stats', requireAdmin, userController.getUserStats);
router.get('/search', requireAdmin, userController.searchUsers);

// User profile and management
router.get('/profile', userController.getProfile);
router.get('/:id', validateUUIDParam, canAccessProfile, userController.getUserById);
router.put('/:id', validateUUIDParam, canAccessProfile, validateUpdateUser, userController.updateUser);
router.put('/:id/password', validateUUIDParam, canAccessProfile, validateChangePassword, userController.updatePassword);

// User activation (Admin only)
router.patch('/:id/activate', requireAdmin, validateUUIDParam, userController.activateUser);
router.patch('/:id/deactivate', requireAdmin, validateUUIDParam, userController.deactivateUser);

export default router;