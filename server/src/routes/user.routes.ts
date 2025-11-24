import { Router } from 'express';
import * as UserController from '../controllers/user.controller' ;
import { UserCreationController } from '../controllers/user-creation.controller' ;
import { 
  authenticate, 
  authorize,
  rateLimit
} from '../middleware/auth.middleware';
import { enforceSchoolContext, validateResourceOwnership } from '../middleware/school-context';

const router = Router();
const userCreationController = new UserCreationController();

// Protected routes
router.use(authenticate);
router.use(validateResourceOwnership);
router.use(enforceSchoolContext);


// User management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), userCreationController.createUserWithProfile);
router.post(
  '/bulk',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validateResourceOwnership,
  userCreationController.bulkCreateUsers.bind(userCreationController)
);
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'),enforceSchoolContext, UserController.getUsers);
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), enforceSchoolContext, UserController.getUserStatistics);

  
// User profile and management
router.get('/profile', enforceSchoolContext, UserController.getUserProfile);
router.get('/:id', UserController.getUserById);
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validateResourceOwnership,
  userCreationController.updateUserWithProfile.bind(userCreationController)
);


// User activation (Admin only)
router.patch('/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), validateResourceOwnership, UserController.activateUser);
router.patch('/:id/deactivate', authorize('ADMIN', 'SUPER_ADMIN'), validateResourceOwnership, UserController.deactivateUser);

export default router;