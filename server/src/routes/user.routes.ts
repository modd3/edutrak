import { Router } from 'express';
import * as UserController from '../controllers/user.controller' ;
import { UserCreationController } from '../controllers/user-creation.controller' ;
import { 
  authenticate, 
  authorize,
  checkOwnershipOrAdmin,
  checkSchoolAccess,
  optionalAuth,
  rateLimit
} from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const userCreationController = new UserCreationController();

// Protected routes
router.use(authenticate);

// User management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), userCreationController.createUserWithProfile);
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), userCreationController.bulkCreateUsersWithProfiles);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), UserController.getUsers);
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), UserController.getUserStatistics);

  
// User profile and management
router.get('/profile', UserController.getUserProfile);
router.get('/:id', UserController.getUserById);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), userCreationController.updateUserWithProfile);


// User activation (Admin only)
router.patch('/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), UserController.activateUser);
router.patch('/:id/deactivate', authorize('ADMIN', 'SUPER_ADMIN'), UserController.deactivateUser);

export default router;