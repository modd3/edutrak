import { Router } from 'express';
import * as  UserController from '../controllers/user.controller' ;
import { 
  authenticate, 
  authorize,
  checkOwnershipOrAdmin,
  checkSchoolAccess,
  optionalAuth,
  rateLimit
} from '../middleware/auth.middleware';

const router = Router();


// Protected routes
router.use(authenticate);

// User management (Admin only)
router.get('/', authorize('ADMIN'), UserController.getUsers);
router.get('/stats', authorize('ADMIN'), UserController.getUserStatistics);


// User profile and management
router.get('/profile', UserController.getUserProfile);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);


// User activation (Admin only)
router.patch('/:id/activate', authorize('ADMIN'), UserController.activateUser);
router.patch('/:id/deactivate', authorize('ADMIN'), UserController.deactivateUser);

export default router;