import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticate, authorize, optionalAuth,  } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const teacherController = new TeacherController();

router.use(authenticate);

// Teacher management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.createTeacher);
router.post('/with-user', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.createTeacherWithUser);
router.post('/assign-subject', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.assignSubjectToTeacher);

// Teacher access
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), validatePagination, teacherController.getTeachers);
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.getTeacherById);
router.get('/user/:userId', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.getTeacherByUserId);
router.get('/tsc/:tscNumber', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.getTeacherByTscNumber);
router.get('/:teacherId/workload', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), teacherController.getTeacherWorkload);
router.get('/:teacherId/timetable', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), teacherController.getTeacherTimetable);
router.get('/:teacherId/performance', authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'), teacherController.getTeacherPerformance);

// Teacher updates (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), teacherController.updateTeacher);

export default router;