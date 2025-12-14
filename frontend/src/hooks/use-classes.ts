import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classService, ClassCreateInput, ClassUpdateInput, StreamCreateInput, StreamUpdateInput } from '@/services/class.service';
import { toast } from 'sonner';
import { Class, Stream } from '@/types';

// === Class Hooks ===

/**
 * Hook to fetch classes for a specific school with pagination and filtering
 */
export function useSchoolClasses(
  schoolId: string,
  params?: {
    page?: number;
    pageSize?: number;
    name?: string;
  }
) {
  return useQuery({
    queryKey: ['classes', schoolId, params],
    queryFn: () => classService.getClassesBySchool(schoolId, params),
    enabled: !!schoolId,
  });
}

export function useClasses(
	params: {
		schoolId?: string;
		academicYearId?: string;
		curriculum?: string;
		level?: string;
	}
){
return useQuery({                                                    queryKey: ['classes', params],
   queryFn: () => classService.getAll(params),
   enabled: !!schoolId,
     });
 }

/**
 * Hook to fetch a single class by ID
 */
export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => classService.getClassById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new class
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassCreateInput) => classService.createClass(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.schoolId] });
      toast.success('Class created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create class');
    },
  });
}

/**
 * Hook to update an existing class
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClassUpdateInput }) =>
      classService.updateClass(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes', data.schoolId] });
      queryClient.invalidateQueries({ queryKey: ['classes', data.id] });
      toast.success('Class updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update class');
    },
  });
}

/**
 * Hook to delete a class
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classService.deleteClass(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });
}

// === Stream Hooks ===

/**
 * Hook to fetch streams for a specific class
 */
export function useClassStreams(classId: string) {
  return useQuery({
    queryKey: ['streams', classId],
    queryFn: () => classService.getStreamsByClass(classId),
    enabled: !!classId,
  });
}

/**
 * Hook to create a new stream
 */
export function useCreateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StreamCreateInput) => classService.createStream(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['streams', data.classId] });
      toast.success('Stream created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create stream');
    },
  });
}

/**
 * Hook to update an existing stream
 */
export function useUpdateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StreamUpdateInput }) =>
      classService.updateStream(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['streams', data.classId] });
      toast.success('Stream updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stream');
    },
  });
}

/**
 * Hook to delete a stream
 */
export function useDeleteStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classService.deleteStream(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete stream');
    },
  });
}
