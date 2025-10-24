import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const academicController = new AcademicController();

router.use(authenticateToken);

// Academic Years
router.post('/years', requireAdmin, academicController.createAcademicYear);
router.get('/years', academicController.getAcademicYears);
router.get('/years/active', academicController.getActiveAcademicYear);
router.get('/years/:id', validateUUIDParam, academicController.getAcademicYearById);
router.patch('/years/:id/set-active', requireAdmin, validateUUIDParam, academicController.setActiveAcademicYear);

// Terms
router.post('/terms', requireAdmin, academicController.createTerm);
router.get('/terms/:id', validateUUIDParam, academicController.getTermById);
router.get('/years/:academicYearId/terms', validateUUIDParam, academicController.getTermsByAcademicYear);

// Classes
router.post('/classes', requireAdmin, academicController.createClass);
router.get('/classes/:id', validateUUIDParam, academicController.getClassById);
router.get('/schools/:schoolId/classes', validateUUIDParam, academicController.getSchoolClasses);
router.put('/classes/:id', requireAdmin, validateUUIDParam, academicController.updateClass);

// Streams
router.post('/streams', requireAdmin, academicController.createStream);
router.get('/streams/:id', validateUUIDParam, academicController.getStreamById);
router.get('/classes/:classId/streams', validateUUIDParam, academicController.getClassStreams);
router.put('/streams/:id', requireAdmin, validateUUIDParam, academicController.updateStream);
router.delete('/streams/:id', requireAdmin, validateUUIDParam, academicController.deleteStream);

// Statistics
router.get('/statistics', academicController.getAcademicStatistics);
router.get('/classes/:classId/performance', validateUUIDParam, academicController.getClassPerformance);

export default router;