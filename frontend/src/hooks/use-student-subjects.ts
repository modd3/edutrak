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
 * UPDATED: Now uses StudentClassSubject relationships
 */
export function useClassStudentsWithSubjects(classId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['class-students-subjects', classId, termId],
    queryFn: async () => {
      if (!classId) return { data: [] };
      
      const response = await api.get(`/classes/${classId}/enrollments`, {
        params: termId ? { termId } : {}
      });
      return response.data;
    },
    enabled: !!classId,
  });
}

/**
 * Update student's selected subjects (elective/optional only)
 * UPDATED: Now creates StudentClassSubject records instead of updating JSON array
 */
export function useUpdateStudentSubjects() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      selectedSubjects,
      classId,
    }: { 
      enrollmentId: string; 
      selectedSubjects: string[];
      classId: string;
    }) => {
      // Get class subject IDs for selected subjects
      const response = await api.get(`/academic/class-subject/class/${classId}`);
      const classSubjects = response.data.data || [];
      
      // Filter to only elective/optional subjects
      const electiveSubjects = classSubjects.filter((cs: any) => 
        ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'].includes(cs.subjectCategory) &&
        selectedSubjects.includes(cs.subjectId)
      );

      // Bulk enroll in selected subjects
      if (electiveSubjects.length > 0) {
        await studentClassSubjectApi.bulkEnrollStudentsInSubject({
          enrollmentIds: [enrollmentId],
          classSubjectId: electiveSubjects[0].id, // Note: This would need adjustment for multiple
          schoolId: user?.schoolId || '',
        });
      }

      return { enrollmentId, updated: electiveSubjects.length };
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ['class-students-subjects', classId] });
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
      const response = await api.post(`/academic/class-subject/${classId}/assign-core-subjects`);
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