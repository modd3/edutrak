// frontend/src/hooks/use-student-subject-enrollment.ts
/**
 * Hooks for managing student subject enrollments (new relational model)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentClassSubjectApi } from '@/api/student-class-subject-api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { EnrollmentStatus } from '@/types';

/**
 * Enroll a student in a subject
 */
export function useEnrollStudentInSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassSubjectApi.enrollStudentInSubject,
    onSuccess: (_, { classSubjectId, enrollmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ['student-subject-enrollments', enrollmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['subject-roster', classSubjectId],
      });
      toast.success('Student enrolled in subject');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to enroll student in subject'
      );
    },
  });
}

/**
 * Bulk enroll students in a subject
 */
export function useBulkEnrollStudentsInSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassSubjectApi.bulkEnrollStudentsInSubject,
    onSuccess: (_, { classSubjectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subject-roster', classSubjectId],
      });
      toast.success('Students bulk enrolled in subject');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to bulk enroll students'
      );
    },
  });
}

/**
 * Drop a student from a subject
 */
export function useDropStudentFromSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassSubjectApi.dropStudentFromSubject,
    onSuccess: (_, { classSubjectId, enrollmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ['student-subject-enrollments', enrollmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['subject-roster', classSubjectId],
      });
      toast.success('Student dropped from subject');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to drop student');
    },
  });
}

/**
 * Get all subjects for a student enrollment
 */
export function useStudentSubjectEnrollments(
  enrollmentId: string | undefined,
  status?: EnrollmentStatus
) {
  return useQuery({
    queryKey: ['student-subject-enrollments', enrollmentId, status],
    queryFn: () =>
      studentClassSubjectApi.getStudentSubjectEnrollments(enrollmentId!, {
        status,
      }),
    enabled: !!enrollmentId,
  });
}

/**
 * Get all subjects for a student across all classes
 */
export function useAllStudentSubjectEnrollments(
  studentId: string | undefined
) {
  return useQuery({
    queryKey: ['all-student-subject-enrollments', studentId],
    queryFn: () =>
      studentClassSubjectApi.getAllStudentSubjectEnrollments(studentId!),
    enabled: !!studentId,
  });
}

/**
 * Get students enrolled in a subject (for grade entry)
 */
export function useStudentsEnrolledInSubject(
  classSubjectId: string | undefined,
  params?: {
    page?: number;
    limit?: number;
    status?: EnrollmentStatus;
  }
) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['subject-roster', classSubjectId, user?.schoolId, params],
    queryFn: () =>
      studentClassSubjectApi.getStudentsEnrolledInSubject(
        classSubjectId!,
        user?.schoolId!,
        params
      ),
    enabled: !!classSubjectId && !!user?.schoolId,
  });
}

/**
 * Get enrollment count for a subject
 */
export function useSubjectEnrollmentCount(
  classSubjectId: string | undefined,
  status?: EnrollmentStatus
) {
  return useQuery({
    queryKey: ['subject-enrollment-count', classSubjectId, status],
    queryFn: () =>
      studentClassSubjectApi.getSubjectEnrollmentCount(classSubjectId!, status),
    enabled: !!classSubjectId,
  });
}

/**
 * Update subject enrollment status
 */
export function useUpdateSubjectEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassSubjectApi.updateSubjectEnrollmentStatus,
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({
        queryKey: ['student-subject-enrollments', enrollmentId],
      });
      toast.success('Subject status updated');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update subject status'
      );
    },
  });
}

/**
 * Bulk update subject enrollment statuses
 */
export function useBulkUpdateSubjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentClassSubjectApi.bulkUpdateSubjectStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-subject-enrollments'],
      });
      toast.success('Subject statuses updated');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update subject statuses'
      );
    },
  });
}

/**
 * Get available subjects for a student to enroll in
 */
export function useAvailableSubjectsForStudent(
  enrollmentId: string | undefined,
  classId: string | undefined,
  schoolId: string | undefined
) {
  return useQuery({
    queryKey: ['available-subjects', enrollmentId, classId],
    queryFn: () =>
      studentClassSubjectApi.getAvailableSubjectsForStudent(
        enrollmentId!,
        classId!,
        schoolId!
      ),
    enabled: !!enrollmentId && !!classId && !!schoolId,
  });
}
