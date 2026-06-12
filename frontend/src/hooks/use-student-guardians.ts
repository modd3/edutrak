// src/hooks/use-student-guardians.ts
// Hooks for centralized student-guardian relationship management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentGuardianService } from '@/services/student-guardian.service';
import type {
  StudentGuardianLinkInput,
  CreateGuardianAndLinkInput,
  UpdateRelationshipInput,
  StudentGuardianResponse,
} from '@/services/student-guardian.service';
import { toast } from 'sonner';

/**
 * Get all guardians for a student
 */
export function useStudentGuardians(studentId: string) {
  return useQuery({
    queryKey: ['student-guardians', 'student', studentId],
    queryFn: () => studentGuardianService.getStudentGuardians(studentId),
    enabled: !!studentId,
  });
}

/**
 * Get all students for a guardian
 */
export function useGuardianStudents(guardianId: string) {
  return useQuery({
    queryKey: ['student-guardians', 'guardian', guardianId],
    queryFn: () => studentGuardianService.getGuardianStudents(guardianId),
    enabled: !!guardianId,
  });
}

/**
 * Link an existing guardian to a student
 */
export function useLinkGuardianToStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudentGuardianLinkInput) =>
      studentGuardianService.linkGuardianToStudent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-guardians', 'student', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-guardians', 'guardian', variables.guardianId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian linked to student successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to link guardian');
    },
  });
}

/**
 * Create a new guardian and link to student in one step
 */
export function useCreateGuardianAndLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGuardianAndLinkInput) =>
      studentGuardianService.createGuardianAndLink(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-guardians', 'student', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian created and linked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create guardian');
    },
  });
}

/**
 * Update a student-guardian relationship
 */
export function useUpdateStudentGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      guardianId,
      data,
    }: {
      studentId: string;
      guardianId: string;
      data: UpdateRelationshipInput;
    }) => studentGuardianService.updateRelationship(studentId, guardianId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Relationship updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update relationship');
    },
  });
}

/**
 * Verify a student-guardian relationship
 */
export function useVerifyStudentGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, guardianId }: { studentId: string; guardianId: string }) =>
      studentGuardianService.verifyRelationship(studentId, guardianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-guardians'] });
      toast.success('Relationship verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to verify relationship');
    },
  });
}

/**
 * Unlink a guardian from a student
 */
export function useUnlinkGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, guardianId }: { studentId: string; guardianId: string }) =>
      studentGuardianService.unlinkGuardian(studentId, guardianId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      toast.success('Guardian removed from student successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove guardian');
    },
  });
}

export type { StudentGuardianResponse, StudentGuardianLinkInput, CreateGuardianAndLinkInput, UpdateRelationshipInput };
