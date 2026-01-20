// src/hooks/use-grades.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assessmentApi,
  BulkGradeEntry,
  CreateGradeInput,
  CSVGradeEntry,
  ResultFilters,
} from '@/api/assessment-api';
import { toast } from 'sonner';
import { CompetencyLevel } from '@/types';

/**
 * Get results with filtering
 */
export function useResults(filters?: ResultFilters) {
  return useQuery({
    queryKey: ['results', filters],
    queryFn: () => assessmentApi.getResults(filters),
  });
}

/**
 * Get student results for a specific term
 */
export function useStudentResults(studentId: string | undefined, termId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'student', studentId, termId],
    queryFn: () => assessmentApi.getResults({ studentId, termId }),
    enabled: !!studentId && !!termId,
  });
}

/**
 * Get results for a specific assessment
 */
export function useAssessmentResults(assessmentDefId: string | undefined) {
  return useQuery({
    queryKey: ['results', 'assessment', assessmentDefId],
    queryFn: () => assessmentApi.getResults({ assessmentDefId }),
    enabled: !!assessmentDefId,
  });
}

/**
 * Create/update single grade
 */
export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradeInput) => assessmentApi.createGrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success('Grade recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record grade');
    },
  });
}

/**
 * Bulk grade entry
 */
export function useBulkGradeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkGradeEntry) => assessmentApi.bulkGradeEntry(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      const { successful, failed } = response.data;

      if (failed > 0) {
        toast.warning(`Recorded ${successful} grades. ${failed} failed.`);
      } else {
        toast.success(`Successfully recorded ${successful} grades`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record grades');
    },
  });
}

/**
 * CSV upload
 */
export function useCSVUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assessmentId, data }: { assessmentId: string; data: CSVGradeEntry[] }) =>
      assessmentApi.csvUpload(assessmentId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      const { successful, failed, errors } = response.data;

      if (failed > 0) {
        toast.warning(
          `Uploaded ${successful} grades. ${failed} failed. Check the errors below.`
        );
      } else {
        toast.success(`Successfully uploaded ${successful} grades`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload grades');
    },
  });
}

/**
 * Update grade
 */
export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        numericValue?: number;
        grade?: string;
        competencyLevel?: CompetencyLevel;
        comment?: string;
      };
    }) => assessmentApi.updateGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success('Grade updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update grade');
    },
  });
}

/**
 * Delete grade
 */
export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assessmentApi.deleteGrade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      toast.success('Grade deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete grade');
    },
  });
}
