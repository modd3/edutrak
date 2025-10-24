import { Router } from 'express';
import { SchoolController } from '../controllers/school.controller';
import { authenticateToken, requireSuperAdmin, requireAdmin } from '../middleware/auth.middleware';
import { validateSchoolCreate, validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const schoolController = new SchoolController();

router.use(authenticateToken);

// School management (Super Admin only)
router.post('/', requireSuperAdmin, validateSchoolCreate, schoolController.createSchool);
router.put('/:id', requireSuperAdmin, validateUUIDParam, schoolController.updateSchool);
router.delete('/:id', requireSuperAdmin, validateUUIDParam, schoolController.deleteSchool);

// School access (Admin and above)
router.get('/', validatePagination, schoolController.getSchools);
router.get('/:id', validateUUIDParam, schoolController.getSchoolById);
router.get('/:id/statistics', validateUUIDParam, requireAdmin, schoolController.getSchoolStatistics);
router.get('/:id/performance', validateUUIDParam, requireAdmin, schoolController.getSchoolPerformance);

export default router;