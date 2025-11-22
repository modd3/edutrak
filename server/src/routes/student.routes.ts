import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';

const router = Router();
const studentController = new StudentController();

router.use(authenticate);
router.use(enforceSchoolContext);

// Student management (Admin only)
router.get(
    '/',
    authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
    studentController.getStudents.bind(studentController)
  );
  
  // Get student by ID
  router.get(
    '/:id',
    authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
    studentController.getStudentById.bind(studentController)
  );
  
router.post('/enroll', authorize('ADMIN', 'SUPER_ADMIN'), studentController.enrollStudent);
router.post('/promote', authorize('ADMIN', 'SUPER_ADMIN'), studentController.promoteStudent);
router.post('/transfer', authorize('ADMIN', 'SUPER_ADMIN'), studentController.transferStudent);

// Student access
router.get('/class/:classId', studentController.getStudentsByClass);
router.get('/admission/:admissionNo', studentController.getStudentByAdmissionNo);
router.get('/:studentId/performance', studentController.getStudentPerformance);

// Student updates (Admin only)
router.patch(
    '/:id/profile',
    authorize('SUPER_ADMIN', 'ADMIN'),
    studentController.updateStudent.bind(studentController)
  );
router.patch(
    '/enrollment/:enrollmentId/status',
    authorize('ADMIN', 'SUPER_ADMIN'),
    studentController.updateEnrollmentStatus.bind(studentController)
  );
  router.delete(
    '/:id',
    authorize('SUPER_ADMIN', 'ADMIN'),
    studentController.deleteStudent.bind(studentController)
  );
  
  // Get statistics
  router.get(
    '/stats/overview',
    authorize('SUPER_ADMIN', 'ADMIN'),
    studentController.getStudentStatistics.bind(studentController)
  );

export default router;