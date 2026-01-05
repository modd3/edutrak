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

/**
 * Hook to fetch paginated core subjects (for selection).
 */
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

/**
 * Hook to create a new core subject.
 * Typically used by Super Admins to define a new subject globally.
 */
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
      toast.error(error.response?.data?.message || 'Failed to create subject');
    },
  });
}

/**
 * Hook to update a core subject.
 */
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
      toast.error(error.response?.data?.message || 'Failed to update subject');
    },
  });
}

/**
 * Hook to delete a core subject.
 */
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

/**
 * Hook to fetch subjects offered by the active school.
 * @param schoolId - The ID of the currently active school.
 */
export function useSubjectOfferings(schoolId: string, params?: {
  page?: number;
  pageSize?: number;
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