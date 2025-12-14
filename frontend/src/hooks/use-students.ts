// src/hooks/use-students.ts (Enhanced)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '@/services/student.service';
import { Student } from '@/types';
import { toast } from 'sonner';

export function useStudents(params?: { 
  schoolId?: string;
  name?: string;
  gender?: string;
  hasSpecialNeeds?: boolean;
  classId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentService.getAll(params),
    enabled: !!params?.schoolId,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentService.getById(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Student>) => studentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentId: string;
      classId: string;
      streamId?: string;
      academicYearId: string;
      schoolId: string;
    }) => studentService.enroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student enrolled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    },
  });
}

export function usePromoteStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      studentIds: string[];
      fromClassId: string;
      toClassId: string;
      academicYearId: string;
    }) => studentService.promote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Students promoted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to promote students');
    },
  });
}

export function useStudentEnrollmentHistory(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: () => studentService.getEnrollmentHistory(studentId),
    enabled: !!studentId,
  });
}

export function useStudentsByClass(classId: string, params?: {
  streamId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['students', 'class', classId, params],
    queryFn: () => studentService.getByClass(classId, params),
    enabled: !!classId,
  });
}