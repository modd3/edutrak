import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';

const router = Router();
const studentController = new StudentController();

router.use(authenticate);
router.use(enforceSchoolContext);

// Specific routes FIRST (before :id parameter routes)
router.post('/enroll', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  studentController.enrollStudent.bind(studentController)
);

router.post('/promote', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  studentController.promoteStudent.bind(studentController)
);

router.post('/transfer', 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  studentController.transferStudent.bind(studentController)
);

router.get('/class/:classId', studentController.getStudentsByClass);
router.get('/admission/:admissionNo', studentController.getStudentByAdmissionNo);
router.get('/stats/overview',
  authorize('SUPER_ADMIN', 'ADMIN'),
  studentController.getStudentStatistics.bind(studentController)
);

// Generic list route
router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  studentController.getStudents.bind(studentController)
);

// ID-based routes LAST
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'TEACHER'),
  studentController.getStudentById.bind(studentController)
);

router.get(
  '/:studentId/performance',
  studentController.getStudentPerformance
);

router.put(
  '/enrollment/:enrollmentId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  studentController.updateEnrollment.bind(studentController)
);

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

export default router;