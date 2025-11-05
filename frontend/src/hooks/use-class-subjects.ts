import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { ClassSubject, PaginatedResponse } from '@/types';

interface ClassSubjectInput {
  classId: string;
  subjectId: string;
  teacherId?: string;
  isCompulsory: boolean;
}

export function useClassSubjects(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'subjects'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ClassSubject>>(
        `/classes/${classId}/subjects`
      );
      return response.data;
    },
    enabled: !!classId,
  });
}

export function useAssignSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassSubjectInput) => {
      const response = await apiClient.post<ClassSubject>('/class-subjects', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['classes', data.classId, 'subjects'] 
      });
      toast.success('Subject assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign subject');
    },
  });
}

export function useUpdateClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<ClassSubjectInput>;
    }) => {
      const response = await apiClient.patch<ClassSubject>(`/class-subjects/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['classes', data.classId, 'subjects'] 
      });
      toast.success('Subject assignment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update subject assignment');
    },
  });
}

export function useRemoveClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/class-subjects/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
      toast.success('Subject removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove subject');
    },
  });
}