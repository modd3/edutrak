import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  academicYearService,
  AcademicYearCreateInput,
  AcademicYearUpdateInput,
  TermCreateInput,
} from '@/services/academic-year.service';
import { toast } from 'sonner';

const ACADEMIC_YEAR_KEY = 'academicYears';
const TERMS_KEY = 'terms';

// === Academic Year Hooks ===

/**
 * Hook to fetch paginated academic years.
 */
export function useAcademicYears(params?: {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [ACADEMIC_YEAR_KEY, 'list', params],
    queryFn: () => academicYearService.getAllYears(params),
  });
}

/**
 * Hook to fetch a single academic year by ID.
 */
export function useAcademicYear(id: string) {
  return useQuery({
    queryKey: [ACADEMIC_YEAR_KEY, 'detail', id],
    queryFn: () => academicYearService.getYearById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new academic year.
 */
export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcademicYearCreateInput) =>
      academicYearService.createYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEY, 'list'] });
      toast.success('Academic Year created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create academic year');
    },
  });
}

/**
 * Hook to update an academic year.
 */
export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcademicYearUpdateInput }) =>
      academicYearService.updateYear(id, data),
    onSuccess: (updatedYear) => {
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEY, 'list'] });
      queryClient.setQueryData(
        [ACADEMIC_YEAR_KEY, 'detail', updatedYear.id],
        updatedYear
      );
      toast.success('Academic Year updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update academic year');
    },
  });
}

/**
 * Hook to set an academic year as active.
 */
export function useSetActiveAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => academicYearService.setActiveYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEY, 'list'] });
      toast.success('Academic Year set as active');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set active year');
    },
  });
}

/**
 * Hook to delete an academic year.
 */
export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => academicYearService.deleteYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACADEMIC_YEAR_KEY, 'list'] });
      toast.success('Academic Year deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete academic year');
    },
  });
}

// === Term Hooks ===

/**
 * Hook to fetch all terms for a specific academic year.
 */
export function useTerms(academicYearId: string) {
  return useQuery({
    queryKey: [TERMS_KEY, 'list', academicYearId],
    queryFn: () => academicYearService.getTermsByYear(academicYearId),
    enabled: !!academicYearId,
  });
}

/**
 * Hook to update a term.
 */
export function useUpdateTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TermCreateInput> }) =>
      academicYearService.updateTerm(id, data),
    onSuccess: (updatedTerm) => {
      // Invalidate the list of terms for its academic year
      queryClient.invalidateQueries({
        queryKey: [TERMS_KEY, 'list', updatedTerm.academicYearId],
      });
      toast.success('Term dates updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update term');
    },
  });
}