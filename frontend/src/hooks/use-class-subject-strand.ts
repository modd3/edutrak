// frontend/src/hooks/use-class-subject-strand.ts
/**
 * Hooks for managing class subject strands
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classSubjectStrandApi } from '@/api/class-subject-strand-api';
import { toast } from 'sonner';

/**
 * Assign a strand to a class subject
 */
export function useAssignStrandToClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classSubjectStrandApi.assignStrandToClassSubject,
    onSuccess: (_, { classSubjectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['class-subject-strands', classSubjectId],
      });
      toast.success('Strand assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign strand');
    },
  });
}

/**
 * Bulk assign strands to a class subject
 */
export function useBulkAssignStrands() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classSubjectStrandApi.bulkAssignStrands,
    onSuccess: (_, { classSubjectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['class-subject-strands', classSubjectId],
      });
      toast.success('Strands bulk assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk assign strands');
    },
  });
}

/**
 * Get all strands for a class subject
 */
export function useStrandsForClassSubject(
  classSubjectId: string | undefined,
  includeAssessments?: boolean
) {
  return useQuery({
    queryKey: ['class-subject-strands', classSubjectId, { includeAssessments }],
    queryFn: () =>
      classSubjectStrandApi.getStrandsForClassSubject(classSubjectId!, {
        includeAssessments,
      }),
    enabled: !!classSubjectId,
  });
}

/**
 * Get all class subjects for a strand
 */
export function useClassSubjectsForStrand(strandId: string | undefined) {
  return useQuery({
    queryKey: ['strand-class-subjects', strandId],
    queryFn: () => classSubjectStrandApi.getClassSubjectsForStrand(strandId!),
    enabled: !!strandId,
  });
}

/**
 * Get strand count for a class subject
 */
export function useStrandCount(classSubjectId: string | undefined) {
  return useQuery({
    queryKey: ['strand-count', classSubjectId],
    queryFn: () => classSubjectStrandApi.getStrandCount(classSubjectId!),
    enabled: !!classSubjectId,
  });
}

/**
 * Remove strand from class subject
 */
export function useRemoveStrandFromClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classSubjectStrandApi.removeStrandFromClassSubject,
    onSuccess: (_, { classSubjectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['class-subject-strands', classSubjectId],
      });
      toast.success('Strand removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove strand');
    },
  });
}

/**
 * Validate strand assignments for a class subject
 */
export function useValidateStrandAssignments(
  classSubjectId: string | undefined
) {
  return useQuery({
    queryKey: ['validate-strands', classSubjectId],
    queryFn: () => classSubjectStrandApi.validateStrandAssignments(classSubjectId!),
    enabled: !!classSubjectId,
  });
}
