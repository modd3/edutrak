// src/routes/academic.routes.ts
import express from 'express';
import AcademicController from '../controllers/academic.controller';
import { enforceSchoolContext, validateResourceOwnership } from '../middleware/school-context';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ClassSubjectController } from '../controllers/classSubject.controller';

const controller = new ClassSubjectController();
const router = express.Router();

// Apply authentication and school context to all routes
router.use(authenticate);
router.use(enforceSchoolContext);
router.use(validateResourceOwnership);

// Academic Years
router.post('/years', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createAcademicYear);
router.get('/years', AcademicController.getAcademicYears);
router.get('/years/active', AcademicController.getActiveAcademicYear);
router.get('/years/:id', AcademicController.getAcademicYearById);
router.patch('/years/:id/activate', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.setActiveAcademicYear);

// Terms
router.post('/terms', authorize('ADMIN', 'SUPER_ADMIN'), AcademicController.createTerm);
router.get('/terms/:id', AcademicController.getTermById);
router.get('/years/:academicYearId/terms', AcademicController.getTermsByAcademicYear);

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

// Assign a subject to a class (Admin/Super Admin only)
router.post(
  '/class-subject', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  controller.assignSubject
);

// Assign a teacher to a specific class subject
router.patch(
  '/class-subject/:id/teacher', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  controller.assignTeacher
);

// Get subjects for a specific class (Teachers needs this too)
router.get(
  '/class-subject/class/:classId', 
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  controller.getByClass
);

/**
 * Get students who have selected a specific class subject
 * Used for grade entry - only shows students who are taking this subject
 */
router.get(
  '/class-subject/:classSubjectId/students',
  authorize('ADMIN', 'TEACHER'),
  controller.getClassSubjectStudents
);

/**
 * Get class subjects taught by a specific teacher
 */
router.get(
  '/class-subject/teacher/:teacherId',
  authorize('ADMIN', 'TEACHER'),
  controller.getTeacherClassSubjects
);

/**
 * Auto-assign core subjects to all students in a class
 */
router.post(
  '/class-subject/:classId/assign-core-subjects',
  authorize('ADMIN'),
  controller.assignCoreSubjects
);


export default router;
