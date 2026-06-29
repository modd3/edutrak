import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller';
import { authenticate,
         authorize,
         optionalAuth, 
         checkSchoolAccess, 
         checkOwnershipOrAdmin 
        } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';
import { enforceSubscription } from '../middleware/subscription.middleware';

const router = Router();
const schoolController = new SchoolController();

router.use(authenticate);

// School management (Super Admin only)
router.post('/', authorize('SUPER_ADMIN'), schoolController.createSchool);
router.put('/:id', authorize('SUPER_ADMIN'), validateUUIDParam, schoolController.updateSchool);
router.delete('/:id', authorize('SUPER_ADMIN'), validateUUIDParam, schoolController.deleteSchool);

// School access (Admin and above)
router.get('/', validatePagination, authorize('SUPER_ADMIN'), schoolController.getSchools);
router.get('/:id', validateUUIDParam, authorize('SUPER_ADMIN'), schoolController.getSchoolById);
router.get('/:id/branding', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), schoolController.getSchoolBranding);
router.put('/:id/branding', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), schoolController.upsertSchoolBranding);
router.get('/:id/statistics', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), enforceSubscription, schoolController.getSchoolStatistics);
router.get('/:id/performance', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), enforceSubscription, schoolController.getSchoolPerformance);

export default router;
