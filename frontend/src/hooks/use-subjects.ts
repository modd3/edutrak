import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  subjectService,
  SubjectCreateInput,
  SubjectUpdateInput,
  SubjectOfferingCreateInput,
} from '@/services/subject.service';
import { toast } from 'sonner';
import { Curriculum } from '@/types';

const SUBJECTS_KEY = 'subjects';
const OFFERINGS_KEY = 'subjectOfferings';

// === Core Subject Hooks ===

/**
 * Hook to fetch paginated core subjects (for selection).
 */
export function useCoreSubjects(params?: {
  page?: number;
  pageSize?: number;
  name?: string;
}) {
  return useQuery({
    queryKey: [SUBJECTS_KEY, 'core', params],
    queryFn: () => subjectService.getAllSubjects(params),
    staleTime: 1000 * 60 * 5, // Core subjects rarely change
  });
}

/**
 * Hook to create a new core subject.
 * Typically used by Super Admins to define a new subject globally.
 */
export function useCreateCoreSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubjectCreateInput) =>
      subjectService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY, 'core'] });
      toast.success('Core Subject created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create core subject');
    },
  });
}

// === Subject Offering Hooks (School-Specific) ===

/**
 * Hook to fetch subjects offered by the active school.
 * @param schoolId - The ID of the currently active school.
 */
export function useSubjectOfferings(schoolId: string, params?: {
  page?: number;
  pageSize?: number;
  level?: CurriculumLevel;
}) {
  return useQuery({
    queryKey: [OFFERINGS_KEY, schoolId, params],
    queryFn: () => subjectService.getSchoolSubjectOfferings(schoolId, params),
    enabled: !!schoolId,
  });
}

/**
 * Hook to create a new subject offering (enables a subject for a school).
 */
export function useCreateSubjectOffering(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubjectOfferingCreateInput) => 
      subjectService.createSubjectOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERINGS_KEY, schoolId] });
      toast.success('Subject added to school offerings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add subject offering');
    },
  });
}

/**
 * Hook to delete a subject offering (removes a subject from a school's catalog).
 */
export function useDeleteSubjectOffering(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subjectService.deleteSubjectOffering(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OFFERINGS_KEY, schoolId] });
      toast.success('Subject offering removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove subject offering');
    },
  });
}