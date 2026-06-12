// src/routes/student-guardian.routes.ts
// Centralized routes for student-guardian relationship management
import { Router } from 'express';
import { StudentGuardianController } from '../controllers/student-guardian.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';

const router = Router();
const controller = new StudentGuardianController();

router.use(authenticate);
router.use(enforceSchoolContext);

// Link existing guardian to student
router.post(
  '/link',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.linkGuardianToStudent.bind(controller)
);

// Create guardian and link to student in one step
router.post(
  '/create-and-link',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.createGuardianAndLink.bind(controller)
);

// Verify a relationship
router.post(
  '/:studentId/:guardianId/verify',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.verifyRelationship.bind(controller)
);

// Update relationship (isPrimary, relationship type, verification)
router.patch(
  '/:studentId/:guardianId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.updateRelationship.bind(controller)
);

// Unlink guardian from student
router.delete(
  '/:studentId/:guardianId',
  authorize('ADMIN', 'SUPER_ADMIN'),
  controller.unlinkGuardian.bind(controller)
);

// Get all guardians for a student
router.get(
  '/student/:studentId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER'),
  controller.getStudentGuardians.bind(controller)
);

// Get all students for a guardian
router.get(
  '/guardian/:guardianId',
  authorize('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT'),
  controller.getGuardianStudents.bind(controller)
);

export default router;