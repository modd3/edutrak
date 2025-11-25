import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';

const router = Router();

// Apply authentication and school context middleware to all assessment routes
router.use(authenticate);
router.use(enforceSchoolContext);

// --- Assessment Definition Routes ---
router.post(
    '/definitions', 
    authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), 
    assessmentController.createAssessmentDefinition
);
router.get(
    '/definitions/class-subject/:classSubjectId',
    authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
    assessmentController.getClassSubjectAssessmentDefinitions
);
router.get('/definitions/:id', assessmentController.getAssessmentDefinitionById);
// router.put('/definitions/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.updateAssessmentDefinition);
// router.delete('/definitions/:id', authorize('ADMIN', 'SUPER_ADMIN'), assessmentController.deleteAssessmentDefinition);


// --- Assessment Result Routes ---
router.post(
    '/results', 
    authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), 
    assessmentController.createAssessmentResult
);
router.post(
    '/results/bulk', 
    authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), 
    assessmentController.createBulkAssessmentResults
);
router.get('/results/:id', assessmentController.getAssessmentResultById);
router.put('/results/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), assessmentController.updateAssessmentResult);
router.delete('/results/:id', authorize('ADMIN', 'SUPER_ADMIN'), assessmentController.deleteAssessmentResult);
router.get('/definitions/:assessmentDefId/results', assessmentController.getAssessmentDefinitionResults);

// --- Student-Specific Assessment Routes ---
router.get('/students/:studentId/results', assessmentController.getStudentAssessmentResults);
router.get('/students/:studentId/reports/term/:termId', assessmentController.generateStudentTermReport);
router.get('/students/:studentId/average/term/:termId', assessmentController.calculateStudentTermAverage);

// --- Statistics & Analytics ---
router.get('/statistics/class-subject/:classSubjectId', assessmentController.getClassSubjectStatistics);
router.get('/analytics/class/:classId', assessmentController.getClassAssessmentAnalytics);
router.get('/export/definition/:assessmentDefId', assessmentController.exportAssessmentResults);

export default router;