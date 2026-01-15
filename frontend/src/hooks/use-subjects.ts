import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  subjectService,
  SubjectCreateInput,
  SubjectUpdateInput,
  SubjectOfferingCreateInput,
} from '@/services/subject.service';
import { toast } from 'sonner';

const SUBJECTS_KEY = 'subjects';
const OFFERINGS_KEY = 'subjectOfferings';

// === Core Subject Hooks ===

export function useSubjects(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
  code?: string;
  category?: string;
  subjectGroup?: string;
  curriculum?: string;
}) {
  return useQuery({
    queryKey: [SUBJECTS_KEY, params],
    queryFn: () => subjectService.getAllSubjects(params)
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubjectCreateInput) =>
      subjectService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      toast.success('Subject created successfully');
    },
    onError: (error: any) => {
      console.error('Create subject error:', error);
      toast.error(error.response?.data?.message || 'Failed to create subject');
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectUpdateInput }) =>
      subjectService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      toast.success('Subject updated successfully');
    },
    onError: (error: any) => {
      console.error('Update subject error:', error);
      toast.error(error.response?.data?.message || 'Failed to update subject');
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      toast.success('Subject deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    },
  });
}

// === Subject Offering Hooks (School-Specific) ===

export function useSubjectOfferings(schoolId: string, params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [OFFERINGS_KEY, schoolId, params],
    queryFn: () => subjectService.getSchoolSubjectOfferings(schoolId, params),
    enabled: !!schoolId,
  });
}

export function useAddSubjectToSchool(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<SubjectOfferingCreateInput, 'schoolId'>) => 
      subjectService.addSubjectToSchool({ ...data, schoolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERINGS_KEY, schoolId] });
      toast.success('Subject added to school offerings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add subject offering');
    },
  });
}

export function useRemoveSubjectFromSchool(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subjectId: string) => subjectService.removeSubjectFromSchool(schoolId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERINGS_KEY, schoolId] });
      toast.success('Subject removed from school offerings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove subject offering');
    },
  });
}

export function useToggleSubjectOffering(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectService.toggleSubjectOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERINGS_KEY, schoolId] });
      toast.success('Subject offering status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update subject offering');
    },
  });
}

// === Curriculum-specific hooks ===

export function useSubjectsByCurriculum(curriculum: string) {
  return useQuery({
    queryKey: [SUBJECTS_KEY, 'curriculum', curriculum],
    queryFn: () => subjectService.getSubjectsByCurriculum(curriculum),
    enabled: !!curriculum,
  });
}

export function useCBCSubjectsByLearningArea(learningArea: string) {
  return useQuery({
    queryKey: [SUBJECTS_KEY, 'cbc', learningArea],
    queryFn: () => subjectService.getCBCSubjectsByLearningArea(learningArea),
    enabled: !!learningArea,
  });
}

export function use844SubjectsByGroup(subjectGroup: string) {
  return useQuery({
    queryKey: [SUBJECTS_KEY, '844', subjectGroup],
    queryFn: () => subjectService.get844SubjectsByGroup(subjectGroup),
    enabled: !!subjectGroup,
  });
}