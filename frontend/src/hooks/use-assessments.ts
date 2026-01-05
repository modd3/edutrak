import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService, AssessmentCreateInput, AssessmentUpdateInput, BulkAssessmentInput } from '@/services/assessment.service';
import { toast } from 'sonner';

// ===== Assessment Definitions =====

export function useAssessmentDefinitions(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['assessmentDefinitions', params],
    queryFn: () => assessmentService.getAll(params),
  });
}

export function useAssessmentDefinition(id: string) {
  return useQuery({
    queryKey: ['assessmentDefinitions', id],
    queryFn: () => assessmentService.getDefinitionById(id),
    enabled: !!id,
  });
}

export function useCreateAssessmentDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => assessmentService.createDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentDefinitions'] });
      toast.success('Assessment definition created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment definition');
    },
  });
}

export function useUpdateAssessmentDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      assessmentService.updateDefinition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentDefinitions'] });
      toast.success('Assessment definition updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment definition');
    },
  });
}

export function useDeleteAssessmentDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assessmentService.deleteDefinition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessmentDefinitions'] });
      toast.success('Assessment definition deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assessment definition');
    },
  });
}

// ===== Assessment Results =====

export function useAssessments(params?: {
  classId?: string;
  subjectId?: string;
  termId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['assessments', params],
    queryFn: () => assessmentService.getAll(params),
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ['assessments', id],
    queryFn: () => assessmentService.getById(id), // Now gets an assessment result
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssessmentCreateInput) => assessmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment');
    },
  });
}

export function useCreateAssessmentResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => assessmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment result recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record assessment result');
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssessmentUpdateInput }) =>
      assessmentService.update(id, data), // Updates an assessment result
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment');
    },
  });
}

export function useBulkCreateAssessments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAssessmentInput) => assessmentService.bulkCreate(data), // Bulk creates assessment results
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessments created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessments');
    },
  });
}

export function useAssessmentStatistics(params: {
  classId: string; // This should ideally be classSubjectId now
  subjectId?: string;
  termId?: string;
}) {
  return useQuery({
    queryKey: ['assessments', 'statistics', params],
    // The backend route is /assessments/statistics/class-subject/:classSubjectId
    // The frontend hook currently passes classId, which is probably incorrect.
    // It should be updated to pass classSubjectId.
    queryFn: () => assessmentService.getStatistics({ classId: params.classId, termId: params.termId }),
    enabled: !!params.classId,
  });
}