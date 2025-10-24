import { Router } from 'express';
import { TeacherController } from '../controllers/teacher.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';

const router = Router();
const teacherController = new TeacherController();

router.use(authenticateToken);

// Teacher management (Admin only)
router.post('/', requireAdmin, teacherController.createTeacher);
router.post('/with-user', requireAdmin, teacherController.createTeacherWithUser);
router.post('/assign-subject', requireAdmin, teacherController.assignSubjectToTeacher);

// Teacher access
router.get('/', validatePagination, teacherController.getTeachers);
router.get('/:id', validateUUIDParam, teacherController.getTeacherById);
router.get('/user/:userId', validateUUIDParam, teacherController.getTeacherByUserId);
router.get('/tsc/:tscNumber', teacherController.getTeacherByTscNumber);
router.get('/:teacherId/workload', validateUUIDParam, teacherController.getTeacherWorkload);
router.get('/:teacherId/timetable', validateUUIDParam, teacherController.getTeacherTimetable);
router.get('/:teacherId/performance', validateUUIDParam, teacherController.getTeacherPerformance);

// Teacher updates (Admin only)
router.put('/:id', requireAdmin, validateUUIDParam, teacherController.updateTeacher);

export default router;