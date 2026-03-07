import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classSubjectStrandService } from '@/services/subject.service';

export const useClassSubjectStrands = (
  classSubjectId: string,
  schoolId: string,
  opts?: { includeAssessments?: boolean }
) => {
  const queryClient = useQueryClient();
  const key = ['classSubjectStrands', classSubjectId, opts?.includeAssessments ? 'withAssessments' : 'plain'];

  const listQuery = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (opts?.includeAssessments) {
        return classSubjectStrandService.strandsWithAssessments({ classSubjectId, schoolId });
      }
      return classSubjectStrandService.listForClassSubject({ classSubjectId, schoolId });
    },
    enabled: Boolean(classSubjectId && schoolId),
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { strandId: string }) =>
      classSubjectStrandService.assign({ classSubjectId, strandId: payload.strandId, schoolId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (payload: { strandIds: string[] }) =>
      classSubjectStrandService.bulkAssign({ classSubjectId, strandIds: payload.strandIds, schoolId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: (payload: { strandId: string }) =>
      classSubjectStrandService.remove({ classSubjectId, strandId: payload.strandId, schoolId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { listQuery, assignMutation, bulkAssignMutation, removeMutation };
};
