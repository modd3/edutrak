import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '@/services/teacher.service';
import { Teacher } from '@/types';
import { toast } from 'sonner';

export function useTeachers(params?: { 
  schoolId?: string;
  employmentType?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: () => teacherService.getAll(params),
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teacherService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Teacher>) => teacherService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      teacherService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    },
  });
}

export function useAssignSubjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, subjectIds }: { teacherId: string; subjectIds: string[] }) =>
      teacherService.assignSubjects(teacherId, subjectIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Subjects assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign subjects');
    },
  });
}

export function useTeacherWorkload(teacherId: string) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'workload'],
    queryFn: () => teacherService.getWorkload(teacherId),
    enabled: !!teacherId,
  });
}