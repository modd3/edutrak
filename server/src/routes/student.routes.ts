import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticateToken, requireAdmin, requireTeacher } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';
import { uploadBulkData } from '../middleware/upload';

const router = Router();
const studentController = new StudentController();

router.use(authenticateToken);

// Student management (Admin only)
router.post('/', requireAdmin, studentController.createStudent);
router.post('/with-user', requireAdmin, studentController.createStudentWithUser);
router.post('/bulk', requireAdmin, studentController.bulkCreateStudents);
router.post('/enroll', requireAdmin, studentController.enrollStudent);
router.post('/promote', requireAdmin, studentController.promoteStudent);
router.post('/transfer', requireAdmin, studentController.transferStudent);
router.post('/guardians', requireAdmin, studentController.addGuardianToStudent);

// Student access
router.get('/', validatePagination, studentController.getStudents);
router.get('/class/:classId', studentController.getStudentsByClass);
router.get('/:id', validateUUIDParam, studentController.getStudentById);
router.get('/admission/:admissionNo', studentController.getStudentByAdmissionNo);
router.get('/:studentId/performance', validateUUIDParam, studentController.getStudentPerformance);

// Student updates (Admin only)
router.put('/:id', requireAdmin, validateUUIDParam, studentController.updateStudent);
router.patch('/enrollment/:enrollmentId/status', requireAdmin, studentController.updateEnrollmentStatus);

export default router;