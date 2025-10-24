import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const subjectController = new SubjectController();

router.use(authenticateToken);

// Subject management (Admin only)
router.post('/', requireAdmin, subjectController.createSubject);
router.put('/:id', requireAdmin, validateUUIDParam, subjectController.updateSubject);
router.delete('/:id', requireAdmin, validateUUIDParam, subjectController.deleteSubject);

// Subject offerings (Admin only)
router.post('/offerings', requireAdmin, subjectController.addSubjectToSchool);
router.patch('/offerings/:id/toggle', requireAdmin, subjectController.toggleSubjectOffering);
router.delete('/schools/:schoolId/subjects/:subjectId', requireAdmin, subjectController.removeSubjectFromSchool);

// Subject access
router.get('/', validatePagination, subjectController.getSubjects);
router.get('/:id', validateUUIDParam, subjectController.getSubjectById);
router.get('/code/:code', subjectController.getSubjectByCode);
router.get('/schools/:schoolId/offerings', validateUUIDParam, subjectController.getSchoolSubjects);
router.get('/:subjectId/performance', validateUUIDParam, subjectController.getSubjectPerformance);
router.get('/curriculum/:curriculum', subjectController.getCurriculumSubjects);

// Curriculum-specific
router.get('/cbc/learning-area/:learningArea', subjectController.getCBCSubjectsByLearningArea);
router.get('/844/group/:subjectGroup', subjectController.get844SubjectsByGroup);

export default router;