// src/routes/studentClass.routes.ts

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { enforceSchoolContext } from '../middleware/school-context';
import { enforceSubscription } from '../middleware/subscription.middleware';
import {
  assignStudentToClass,
  getStudentsInClass,
  getStudentClassAssignment,
  updateStudentClassAssignment,
  promoteStudent,
  transferStudent,
  getStudentEnrollmentHistory
} from '../controllers/studentClass.controller';

const router = Router();

router.use(authenticate);
router.use(enforceSchoolContext);
router.use(enforceSubscription);

/**
 * @route   POST /api/student-classes
 * @desc    Assign a student to a class for an academic year
 * @access  Private (Admin)
 */
router.post(
  '/',
  authorize('ADMIN'),
  assignStudentToClass
);

/**
 * @route   GET /api/student-classes/class/:classId/year/:academicYearId
 * @desc    Get all students in a class for a given academic year
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/class/:classId/year/:academicYearId',
  authorize('ADMIN', 'TEACHER'),
  getStudentsInClass
);

/**
 * @route   GET /api/student-classes/:id
 * @desc    Get a single student's class assignment
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/:id',
  authorize('ADMIN', 'TEACHER'),
  getStudentClassAssignment
);

/**
 * @route   PUT /api/student-classes/:id
 * @desc    Update student class assignment (e.g., change stream, add selected subjects)
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authorize('ADMIN'),
  updateStudentClassAssignment
);

/**
 * @route   POST /api/student-classes/promote
 * @desc    Promote a student to another class for the next academic year
 * @access  Private (Admin)
 */
router.post(
  '/promote',
  authorize('ADMIN'),
  promoteStudent
);

/**
 * @route   POST /api/student-classes/transfer
 * @desc    Transfer a student from one school to another
 * @access  Private (Admin)
 */
router.post(
  '/transfer',
  authorize('ADMIN'),
  transferStudent
);

/**
 * @route   GET /api/student-classes/history/:studentId
 * @desc    Get student enrollment history
 * @access  Private (Admin, Teacher)
 */
router.get(
  '/history/:studentId',
  authorize('ADMIN', 'TEACHER'),
  getStudentEnrollmentHistory
);

export default router;