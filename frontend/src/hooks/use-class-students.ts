import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { StudentClass, PaginatedResponse } from '@/types';

interface EnrollmentData {
  studentId: string;
  classId: string;
  streamId?: string;
  academicYearId: string;
  status: 'ACTIVE';
}

export function useClassEnrollments(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'enrollments'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<StudentClass>>(
        `/classes/${classId}/enrollments`
      );
      return response.data;
    },
    enabled: !!classId,
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrollmentData) => {
      const response = await apiClient.post<StudentClass>('/student-classes', data);
      return response.data;
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'enrollments'] });
      toast.success('Student enrolled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<StudentClass>;
    }) => {
      const response = await apiClient.patch<StudentClass>(`/student-classes/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['classes', data.classId, 'enrollments'] 
      });
      toast.success('Enrollment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update enrollment');
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/student-classes/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Student unenrolled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unenroll student');
    },
  });
}