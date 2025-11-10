import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller';
import { authenticate,
         authorize,
         optionalAuth, 
         checkSchoolAccess, 
         checkOwnershipOrAdmin 
        } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const schoolController = new SchoolController();

router.use(authenticate);

// School management (Super Admin only)
router.post('/', authorize('SUPER_ADMIN'), schoolController.createSchool);
router.put('/:id', authorize('SUPER_ADMIN'), validateUUIDParam, schoolController.updateSchool);
router.delete('/:id', authorize('SUPER_ADMIN'), validateUUIDParam, schoolController.deleteSchool);

// School access (Admin and above)
router.get('/', validatePagination, schoolController.getSchools);
router.get('/:id', validateUUIDParam, schoolController.getSchoolById);
router.get('/:id/statistics', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), schoolController.getSchoolStatistics);
router.get('/:id/performance', validateUUIDParam, authorize('ADMIN', 'SUPER_ADMIN'), schoolController.getSchoolPerformance);

export default router;