// src/validation/student-class-subject.validation.ts

import { z } from 'zod';
import { EnrollmentStatus } from '@prisma/client';

/**
 * Enroll Student in Subject Schema
 */
export const enrollStudentInSubjectSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Bulk Enroll Students in Subject Schema
 */
export const bulkEnrollStudentsInSubjectSchema = z.object({
  enrollmentIds: z.array(z.string().uuid('Invalid enrollment ID')).min(1, 'At least one enrollment is required'),
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Drop Student from Subject Schema
 */
export const dropStudentFromSubjectSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Update Subject Enrollment Status Schema
 */
export const updateSubjectEnrollmentStatusSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  schoolId: z.string().uuid('Invalid school ID'),
  status: z.nativeEnum(EnrollmentStatus),
});

/**
 * Get Student Subject Enrollments Query Schema
 */
export const getStudentSubjectEnrollmentsQuerySchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID').optional(),
  classSubjectId: z.string().uuid('Invalid class subject ID').optional(),
  studentId: z.string().uuid('Invalid student ID').optional(),
  schoolId: z.string().uuid('Invalid school ID').optional(),
  status: z.nativeEnum(EnrollmentStatus).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Get Students Enrolled in Subject Query Schema
 */
export const getStudentsEnrolledInSubjectQuerySchema = z.object({
  classSubjectId: z.string().uuid('Invalid class subject ID'),
  schoolId: z.string().uuid('Invalid school ID'),
  status: z.nativeEnum(EnrollmentStatus).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * Bulk Operations Schema
 */
export const bulkUpdateSubjectStatusSchema = z.object({
  updates: z.array(
    z.object({
      enrollmentId: z.string().uuid('Invalid enrollment ID'),
      classSubjectId: z.string().uuid('Invalid class subject ID'),
      status: z.nativeEnum(EnrollmentStatus),
    })
  ).min(1, 'At least one update is required'),
  schoolId: z.string().uuid('Invalid school ID'),
});

/**
 * Type exports
 */
export type EnrollStudentInSubjectInput = z.infer<typeof enrollStudentInSubjectSchema>;
export type BulkEnrollStudentsInSubjectInput = z.infer<typeof bulkEnrollStudentsInSubjectSchema>;
export type DropStudentFromSubjectInput = z.infer<typeof dropStudentFromSubjectSchema>;
export type UpdateSubjectEnrollmentStatusInput = z.infer<typeof updateSubjectEnrollmentStatusSchema>;
export type GetStudentSubjectEnrollmentsQuery = z.infer<typeof getStudentSubjectEnrollmentsQuerySchema>;
export type GetStudentsEnrolledInSubjectQuery = z.infer<typeof getStudentsEnrolledInSubjectQuerySchema>;
export type BulkUpdateSubjectStatusInput = z.infer<typeof bulkUpdateSubjectStatusSchema>;
