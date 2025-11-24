// src/routes/academic.routes.ts
import express from 'express';
import AcademicController from '../controllers/academic.controller';
import { enforceSchoolContext, validateResourceOwnership } from '../middleware/school-context';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication and school context to all routes
router.use(authenticate);
router.use(enforceSchoolContext);
router.use(validateResourceOwnership);

// Academic Years
router.post('/academic-years', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createAcademicYear);
router.get('/academic-years', AcademicController.getAcademicYears);
router.get('/academic-years/active', AcademicController.getActiveAcademicYear);
router.get('/academic-years/:id', AcademicController.getAcademicYearById);
router.patch('/academic-years/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.setActiveAcademicYear);

// Terms
router.post('/terms', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createTerm);
router.get('/terms/:id', AcademicController.getTermById);
router.get('/academic-years/:academicYearId/terms', AcademicController.getTermsByAcademicYear);

// Classes
router.post('/classes', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createClass);
router.post('/classes/bulk', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createMultipleClasses);
router.get('/classes', AcademicController.getSchoolClasses);
router.get('/classes/:id', AcademicController.getClassById);
router.patch('/classes/:id', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.updateClass);

// Streams
router.post('/streams', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createStream);
router.get('/streams/:id', AcademicController.getStreamById);
router.get('/classes/:classId/streams', AcademicController.getClassStreams);
router.patch('/streams/:id', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.updateStream);
router.delete('/streams/:id', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.deleteStream);

// Analytics
router.get('/statistics', AcademicController.getAcademicStatistics);
router.get('/classes/:classId/performance', AcademicController.getClassPerformance);
router.get('/overview', AcademicController.getAcademicOverview);

export default router;
