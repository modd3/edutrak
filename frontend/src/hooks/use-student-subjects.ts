// src/hooks/use-student-subjects.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';

/**
 * Get students enrolled in a class with their selected subjects
 */
export function useClassStudentsWithSubjects(classId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['class-students-subjects', classId, termId],
    queryFn: async () => {
      if (!classId) return { data: [] };
      
      const response = await api.get(`/classes/${classId}/students`, {
        params: termId ? { termId } : {}
      });
      return response.data;
    },
    enabled: !!classId,
  });
}

/**
 * Get students who have selected a specific subject (for grade entry)
 */
export function useClassSubjectStudents(classSubjectId: string | undefined) {
  return useQuery({
    queryKey: ['class-subject-students', classSubjectId],
    queryFn: async () => {
      const response = await api.get(`/academic/class-subject/${classSubjectId}/students`);
      return response.data;
    },
    enabled: !!classSubjectId,
  });
}

/**
 * Update student's selected subjects
 */
export function useUpdateStudentSubjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      selectedSubjects 
    }: { 
      enrollmentId: string; 
      selectedSubjects: string[] 
    }) => {
      const response = await api.patch(`/student-classes/${enrollmentId}`, {
        selectedSubjects
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students-subjects'] });
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
      const response = await api.post(`/classes/${classId}/assign-core-subjects`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students-subjects'] });
      toast.success('Core subjects assigned to all students');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign core subjects');
    },
  });
}