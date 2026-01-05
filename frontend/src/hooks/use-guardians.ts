// src/hooks/use-guardians.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guardianService, GuardianCreateInput, GuardianUpdateInput, GuardianResponse } from '@/services/guardian.service';
import { toast } from 'sonner';

export function useGuardians(params?: { 
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['guardians', params],
    queryFn: () => guardianService.getAll(params),
  });
}

export function useGuardian(id: string) {
  return useQuery({
    queryKey: ['guardians', id],
    queryFn: () => guardianService.getById(id),
    enabled: !!id,
  });
}

export function useGuardiansByStudent(studentId: string) {
  return useQuery({
    queryKey: ['guardians', 'student', studentId],
    queryFn: () => guardianService.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useCreateGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GuardianCreateInput) => guardianService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create guardian');
    },
  });
}

export function useUpdateGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GuardianUpdateInput }) =>
      guardianService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update guardian');
    },
  });
}

export function useDeleteGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => guardianService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete guardian');
    },
  });
}

export function useLinkGuardianToStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guardianId, studentId }: { guardianId: string; studentId: string }) =>
      guardianService.linkToStudent(guardianId, studentId),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', 'student', studentId] });
      toast.success('Guardian linked to student successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to link guardian');
    },
  });
}

export function useUnlinkGuardianFromStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guardianId, studentId }: { guardianId: string; studentId: string }) =>
      guardianService.unlinkStudent(guardianId, studentId),
    onSuccess: (_, { studentId }) => {
      queryClient.invalidateQueries({ queryKey: ['guardians', 'student', studentId] });
      toast.success('Guardian unlinked from student successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unlink guardian');
    },
  });
}
