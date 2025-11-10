import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';


const router = Router();
const academicController = new AcademicController();

router.use(authenticate);

// Academic Years
router.post('/years', authorize('ADMIN', 'SUPER_ADMIN'), academicController.createAcademicYear);
router.get('/years', academicController.getAcademicYears);
router.get('/years/active', academicController.getActiveAcademicYear);
router.get('/years/:id', academicController.getAcademicYearById);
router.patch('/years/:id/set-active', authorize('ADMIN', 'SUPER_ADMIN'), academicController.setActiveAcademicYear);

// Terms
router.post('/terms', authorize('ADMIN', 'SUPER_ADMIN'), academicController.createTerm);
router.get('/terms/:id', academicController.getTermById);
router.get('/years/:academicYearId/terms', academicController.getTermsByAcademicYear);

// Classes
router.post('/classes', authorize('ADMIN', 'SUPER_ADMIN'), academicController.createClass);
router.get('/classes/:id', academicController.getClassById);
router.get('/schools/:schoolId/classes', academicController.getSchoolClasses);
router.put('/classes/:id', authorize('ADMIN', 'SUPER_ADMIN'), academicController.updateClass);

// Streams
router.post('/streams', authorize('ADMIN', 'SUPER_ADMIN'), academicController.createStream);
router.get('/streams/:id', academicController.getStreamById);
router.get('/classes/:classId/streams', academicController.getClassStreams);
router.put('/streams/:id', authorize('ADMIN', 'SUPER_ADMIN'), academicController.updateStream);
router.delete('/streams/:id', authorize('ADMIN', 'SUPER_ADMIN'), academicController.deleteStream);

// Statistics
router.get('/statistics', academicController.getAcademicStatistics);
router.get('/classes/:classId/performance', academicController.getClassPerformance);

export default router;