import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, 
         optionalAuth, 
         authorize, 
         checkSchoolAccess, 
         checkOwnershipOrAdmin } from '../middleware/auth.middleware';
import { validateUUIDParam, validatePagination } from '../middleware/validation';
import { uploadBulkData } from '../middleware/upload';

const router = Router();
const studentController = new StudentController();

router.use(authenticate);

// Student management (Admin only)
router.post('/', authorize('ADMIN', 'SUPER_ADMIN'), studentController.createStudent);
router.post('/with-user', authorize('ADMIN', 'SUPER_ADMIN'), studentController.createStudentWithUser);
router.post('/bulk', authorize('ADMIN', 'SUPER_ADMIN'), studentController.bulkCreateStudents);
router.post('/enroll', authorize('ADMIN', 'SUPER_ADMIN'), studentController.enrollStudent);
router.post('/promote', authorize('ADMIN', 'SUPER_ADMIN'), studentController.promoteStudent);
router.post('/transfer', authorize('ADMIN', 'SUPER_ADMIN'), studentController.transferStudent);
router.post('/guardians', authorize('ADMIN', 'SUPER_ADMIN'), studentController.addGuardianToStudent);

// Student access
router.get('/', validatePagination, studentController.getStudents);
router.get('/class/:classId', studentController.getStudentsByClass);
router.get('/:id', validateUUIDParam, studentController.getStudentById);
router.get('/admission/:admissionNo', studentController.getStudentByAdmissionNo);
router.get('/:studentId/performance', validateUUIDParam, studentController.getStudentPerformance);

// Student updates (Admin only)
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), validateUUIDParam, studentController.updateStudent);
router.patch('/enrollment/:enrollmentId/status', authorize('ADMIN', 'SUPER_ADMIN'), studentController.updateEnrollmentStatus);

export default router;