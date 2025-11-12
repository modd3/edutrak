import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '@/services/school.service.ts';
import { School } from '@/types';
import { toast } from 'sonner';

// Define the shape for creating/updating a school based on your schema
type SchoolCreateInput = Omit<School, 'id' | 'createdAt' | 'updatedAt'>;
type SchoolUpdateInput = Partial<SchoolCreateInput>;

const SCHOOLS_QUERY_KEY = 'schools';

/**
 * Hook to fetch a paginated list of schools.
 */
export function useSchools(params?: {
  page?: number;
  pageSize?: number;
  county?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [SCHOOLS_QUERY_KEY, params],
    queryFn: () => schoolService.getAll(),
  });
}

/**
 * Hook to fetch a single school by its ID.
 */
export function useSchool(id: string) {
  return useQuery({
    queryKey: [SCHOOLS_QUERY_KEY, id],
    queryFn: () => schoolService.getById(id),
    enabled: !!id, // Only run the query if the id is provided
  });
}

/**
 * Hook for creating a new school.
 */
export function useCreateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SchoolCreateInput) => schoolService.create(data),
    onSuccess: () => {
      // Invalidate the main schools list query to refetch
      queryClient.invalidateQueries({ queryKey: [SCHOOLS_QUERY_KEY] });
      toast.success('School created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create school');
    },
  });
}

/**
 * Hook for updating an existing school.
 */
export function useUpdateSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SchoolUpdateInput }) =>
      schoolService.update(id, data),
    onSuccess: (updatedSchool) => {
      // Invalidate the main schools list query
      queryClient.invalidateQueries({ queryKey: [SCHOOLS_QUERY_KEY] });
      // Also update the specific school's cache if it exists
      queryClient.setQueryData(
        [SCHOOLS_QUERY_KEY, updatedSchool.data.data.id],
        updatedSchool
      );
      toast.success('School updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update school');
    },
  });
}

/**
 * Hook for deleting a school.
 */
export function useDeleteSchool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schoolService.delete(id),
    onSuccess: () => {
      // Invalidate the main schools list query
      queryClient.invalidateQueries({ queryKey: [SCHOOLS_QUERY_KEY] });
      toast.success('School deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete school');
    },
  });
}