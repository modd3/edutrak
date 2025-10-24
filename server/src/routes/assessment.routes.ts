import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const assessmentController = new AssessmentController();

router.use(authenticateToken);

// Assessment management (Teacher only)
router.post('/', requireTeacher, assessmentController.createAssessment);
router.post('/bulk', requireTeacher, assessmentController.createBulkAssessments);
router.put('/:id', requireTeacher, validateUUIDParam, assessmentController.updateAssessment);
router.delete('/:id', requireTeacher, validateUUIDParam, assessmentController.deleteAssessment);

// Assessment access
router.get('/:id', validateUUIDParam, assessmentController.getAssessmentById);
router.get('/students/:studentId', validateUUIDParam, validatePagination, assessmentController.getStudentAssessments);
router.get('/class-subjects/:classSubjectId', validateUUIDParam, assessmentController.getClassSubjectAssessments);

// Statistics and calculations
router.get('/students/:studentId/average', validateUUIDParam, assessmentController.calculateStudentTermAverage);
router.get('/class-subjects/:classSubjectId/statistics', validateUUIDParam, assessmentController.getClassSubjectStatistics);
router.get('/students/:studentId/trends', validateUUIDParam, assessmentController.getAssessmentTrends);

// Grading
router.post('/convert-grade', assessmentController.convertMarksToGrade);

// Reports
router.get('/students/:studentId/report', validateUUIDParam, assessmentController.generateStudentTermReport);
router.get('/classes/:classId/report', validateUUIDParam, assessmentController.generateClassTermReport);

export default router;