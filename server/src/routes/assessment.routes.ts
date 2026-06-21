// src/routes/assessment.routes.ts

import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';
import { enforceSubscription } from '../middleware/subscription.middleware';

const router = Router();
const controller = new AssessmentController();

router.use(authenticate);
router.use(enforceSchoolContext);
router.use(enforceSubscription);

/**
 * Assessment Definition Routes
 */

// Create new assessment
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.createAssessment
);

// Bulk create assessments
router.post(
  '/bulk',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.bulkCreateAssessments
);

// Get all assessments with filtering
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  controller.getAssessments
);

// Get assessment statistics
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.getAssessmentStats
);

// Get assessments for a specific class
router.get(
  '/class/:classId/term/:termId',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  controller.getClassAssessments
);

// Get assessments for a specific subject
router.get(
  '/class-subject/:classSubjectId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.getSubjectAssessments
);

// Get results with filtering
router.get(
  '/results',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  controller.getResults
);

// Get single assessment by ID
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  controller.getAssessmentById
);

// Update assessment
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.updateAssessment
);

// Update assessment status (workflow transition)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.updateAssessmentStatus
);

// Delete assessment
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  controller.deleteAssessment
);

/**
 * Assessment Weight Routes
 */

// Get weights for a term and class subject
router.get(
  '/weights',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.getWeights
);

// Calculate weighted score
router.get(
  '/weights/calculate',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.calculateWeightedScore
);

// Upsert a single weight
router.post(
  '/weights',
  authenticate,
  authorize('ADMIN'),
  controller.upsertWeight
);

// Bulk upsert weights
router.post(
  '/weights/bulk',
  authenticate,
  authorize('ADMIN'),
  controller.bulkUpsertWeights
);

// Delete a weight
router.delete(
  '/weights/:id',
  authenticate,
  authorize('ADMIN'),
  controller.deleteWeight
);

/**
 * Grade Entry Routes
 */

// Create or update single result
router.post(
  '/results',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.createResult
);

// Bulk grade entry
router.post(
  '/results/bulk',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.bulkGradeEntry
);

// CSV bulk upload
router.post(
  '/results/upload/:assessmentId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.csvBulkUpload
);

// Update result
router.put(
  '/results/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.updateResult
);

// Delete result
router.delete(
  '/results/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.deleteResult
);

/**
 * Report Generation Routes
 */

// Generate student report card
router.get(
  '/reports/student/:studentId/term/:termId',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'),
  controller.generateStudentReport
);

// Generate class performance report
router.get(
  '/reports/class/:classId/term/:termId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  controller.generateClassReport
);

export default router;
