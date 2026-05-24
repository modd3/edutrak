// src/hooks/use-student-subjects.ts
/**
 * DEPRECATED: Use use-student-subject-enrollment.ts for new relational model
 * This file is kept for backward compatibility during migration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';
import { studentClassSubjectApi } from '@/api/student-class-subject-api';
import { useAuthStore } from '@/store/auth-store';

/**
 * Get students enrolled in a class with their subject enrollments
 * Uses StudentClass + StudentClassSubject relationships
 */
export function useClassStudentsWithSubjects(classId: string | undefined, academicYearId: string | undefined) {
  return useQuery({
    queryKey: ['class-students-subjects', classId, academicYearId],
    queryFn: async () => {
      if (!classId || !academicYearId) return { data: [] };
      
      const response = await api.get(`/student-classes/class/${classId}/year/${academicYearId}`);
      return response.data;
    },
    enabled: !!classId && !!academicYearId,
  });
}

/**
 * Update student's selected subjects (enroll in elective/optional subjects)
 * Uses the new bulk StudentClassSubject enrollment API
 */
export function useUpdateStudentSubjects() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      classSubjectIds,
    }: { 
      enrollmentId: string; 
      classSubjectIds: string[];
    }) => {
      // Bulk enroll student in all selected class subjects
      const results = [];
      for (const classSubjectId of classSubjectIds) {
        const result = await studentClassSubjectApi.enrollStudentInSubject({
          studentId: '', // This will be derived from enrollment
          classSubjectId,
          enrollmentId,
          schoolId: user?.schoolId || '',
        });
        results.push(result);
      }
      return { enrollmentId, enrolled: results.length };
    },
    onSuccess: (_, { enrollmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['student-subject-enrollments', enrollmentId] });
      toast.success('Subject selection updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update subject selection');
    },
  });
}

/**
 * Auto-assign core subjects to all students in a class
 */
export function useAutoAssignCoreSubjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classId: string) => {
      const response = await api.post(`/academic/class-subject/${classId}/assign-core-subjects`, {});
      return response.data;
    },
    onSuccess: (_, classId) => {
      queryClient.invalidateQueries({ queryKey: ['class-students-subjects', classId] });
      toast.success('Core subjects assigned to all students');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign core subjects');
    },
  });
}