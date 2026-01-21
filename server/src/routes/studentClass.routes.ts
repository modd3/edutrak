// src/routes/studentClass.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
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

/**
 * @route   POST /api/student-classes
 * @desc    Assign a student to a class for an academic year
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  getStudentEnrollmentHistory
);

export default router;