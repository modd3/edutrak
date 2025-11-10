import { Router } from 'express';
import { createAssessmentDefinition, 
         getAssessmentDefinitionById, 
         getClassSubjectAssessmentDefinitions, 
         //updateAssessmentDefinition, 
         //deleteAssessmentDefinition, 
         createAssessmentResult, 
         createBulkAssessmentResults, 
         getAssessmentResultById, 
         updateAssessmentResult, 
         deleteAssessmentResult, 
         getStudentAssessmentResults, 
         getAssessmentDefinitionResults,
         getClassSubjectStatistics,
         generateStudentTermReport,
         getClassAssessmentAnalytics,
         exportAssessmentResults
        } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Assessment management (Teacher & Admins)
router.post('/create', authorize('ADMIN', 'SUPER_ADMIN'), createAssessmentDefinition);
router.post('/result/bulk', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), createBulkAssessmentResults);
router.post('/result', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), createAssessmentResult);
router.put('/result/:id', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), updateAssessmentResult);
router.delete('/result/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteAssessmentResult);

// Assessment access
router.get('/:id', getAssessmentDefinitionById);
router.get('/def/result/:id', getAssessmentDefinitionResults)
router.get('result/:id', getAssessmentResultById);
router.get('/students/:studentId', getStudentAssessmentResults);
router.get('/class-subjects/:classSubjectId', getClassSubjectAssessmentDefinitions);

// Statistics and calculations
router.get('/class-subjects/:classSubjectId/statistics', getClassSubjectStatistics);
router.get('/class/analytics', getClassAssessmentAnalytics)
//router.get('/students/:studentId/trends', validateUUIDParam, assessmentController.getAssessmentTrends);


// Reports
router.get('/students/:studentId/report', generateStudentTermReport);
router.get('/result/export', exportAssessmentResults);
//router.get('/classes/:classId/report', validateUUIDParam, assessmentController.generateClassTermReport);

export default router;