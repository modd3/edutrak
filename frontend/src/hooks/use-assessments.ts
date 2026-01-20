// src/hooks/use-assessments.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentApi, AssessmentFilters, CreateAssessmentInput, UpdateAssessmentInput } from '@/api/assessment-api';
import { toast } from 'sonner';

/**
 * Get all assessments with filtering
 */
export function useAssessments(filters?: AssessmentFilters) {
  return useQuery({
    queryKey: ['assessments', filters],
    queryFn: () => assessmentApi.getAssessments(filters),
  });
}

/**
 * Get single assessment by ID
 */
export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: ['assessments', id],
    queryFn: () => assessmentApi.getAssessmentById(id!),
    enabled: !!id,
  });
}

/**
 * Get assessments for a specific class
 */
export function useClassAssessments(classId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['assessments', 'class', classId, termId],
    queryFn: () => assessmentApi.getClassAssessments(classId!, termId!),
    enabled: !!classId && !!termId,
  });
}

/**
 * Get assessments for a specific subject
 */
export function useSubjectAssessments(classSubjectId: string | undefined) {
  return useQuery({
    queryKey: ['assessments', 'subject', classSubjectId],
    queryFn: () => assessmentApi.getSubjectAssessments(classSubjectId!),
    enabled: !!classSubjectId,
  });
}

/**
 * Get assessment statistics
 */
export function useAssessmentStats(academicYearId?: string) {
  return useQuery({
    queryKey: ['assessments', 'stats', academicYearId],
    queryFn: () => assessmentApi.getAssessmentStats(academicYearId),
  });
}

/**
 * Create assessment mutation
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentInput) => assessmentApi.createAssessment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create assessment');
    },
  });
}

/**
 * Bulk create assessments mutation
 */
export function useBulkCreateAssessments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessments: CreateAssessmentInput[]) =>
      assessmentApi.bulkCreateAssessments(assessments),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success(`Successfully created ${response.data.created} assessments`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create assessments');
    },
  });
}

/**
 * Update assessment mutation
 */
export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssessmentInput }) =>
      assessmentApi.updateAssessment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', variables.id] });
      toast.success('Assessment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update assessment');
    },
  });
}

/**
 * Delete assessment mutation
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assessmentApi.deleteAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete assessment');
    },
  });
}
