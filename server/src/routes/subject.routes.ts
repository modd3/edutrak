import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const subjectController = new SubjectController();

router.use(authenticate);

// Subject management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.createSubject);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, subjectController.updateSubject);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, subjectController.deleteSubject);

// Subject offerings (Admin only)
router.post('/offerings', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.addSubjectToSchool);
router.patch('/offerings/:id/toggle', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.toggleSubjectOffering);
router.delete('/schools/:schoolId/subjects/:subjectId', authorize('ADMIN', 'SUPER_ADMIN'), subjectController.removeSubjectFromSchool);

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