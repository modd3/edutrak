import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
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
      const response = await api.get<PaginatedResponse<StudentClass>>(
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
      const response = await api.post<StudentClass>('/student-classes', data);
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
      const response = await api.patch<StudentClass>(`/student-classes/${id}`, data);
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
      await api.delete(`/student-classes/${id}`);
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


/**
 * Get students enrolled in a class for a specific academic year and term
 */
export function useClassStudents(classId: string, academicYearId: string, termId?: string) {
  return useQuery({
    queryKey: ['class-students', classId, academicYearId, termId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<StudentClass>>(`/student-classes/class/${classId}/year/${academicYearId}`, {
        params: {
          ...(termId && { termId }),
          include: 'student,subjectEnrollments.classSubject.subject'
        }
      });
      return response.data;
    },
    enabled: !!classId && !!academicYearId,
  });
}

/**
 * Get students by stream
 */
export function useStreamStudents(streamId: string, academicYearId: string) {
  return useQuery({
    queryKey: ['stream-students', streamId, academicYearId],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<StudentClass>>(`/streams/${streamId}/students`, {
        params: { academicYearId }
      });
      return response.data;
    },
    enabled: !!streamId && !!academicYearId,
  });
}