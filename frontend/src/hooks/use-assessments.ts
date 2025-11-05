import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService, AssessmentCreateInput, AssessmentUpdateInput, BulkAssessmentInput } from '@/services/assessment.service';
import { toast } from 'sonner';

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
    queryFn: () => assessmentService.getById(id),
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

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssessmentUpdateInput }) =>
      assessmentService.update(id, data),
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
    mutationFn: (data: BulkAssessmentInput) => assessmentService.bulkCreate(data),
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
  classId: string;
  subjectId?: string;
  termId?: string;
}) {
  return useQuery({
    queryKey: ['assessments', 'statistics', params],
    queryFn: () => assessmentService.getStatistics(params),
    enabled: !!params.classId,
  });
}