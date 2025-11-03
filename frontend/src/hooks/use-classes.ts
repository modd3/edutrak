import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  classService,
  ClassCreateInput,
  StreamCreateInput,
  ClassSubjectCreateInput
} from '@/services/class.service';
import { toast } from 'sonner';

const CLASSES_KEY = 'classes';
const STREAMS_KEY = 'streams';
const CLASS_SUBJECTS_KEY = 'classSubjects';

// === Class Hooks ===

/**
 * Hook to fetch all classes for the active school.
 * @param schoolId - The ID of the currently active school.
 */
export function useClasses(schoolId: string) {
  return useQuery({
    queryKey: [CLASSES_KEY, 'list', schoolId],
    queryFn: () => classService.getAllClasses(schoolId),
    enabled: !!schoolId,
  });
}

/**
 * Hook to fetch a single class by ID.
 */
export function useClass(id: string) {
  return useQuery({
    queryKey: [CLASSES_KEY, 'detail', id],
    queryFn: () => classService.getClassById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new class.
 */
export function useCreateClass(schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassCreateInput) =>
      classService.createClass({ ...data, schoolId }), // Inject schoolId
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLASSES_KEY, 'list', schoolId] });
      toast.success('Class created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create class');
    },
  });
}

// === Stream Hooks ===

/**
 * Hook to fetch all streams belonging to a class.
 */
export function useStreamsByClass(classId: string) {
  return useQuery({
    queryKey: [STREAMS_KEY, 'list', classId],
    queryFn: () => classService.getStreamsByClass(classId),
    enabled: !!classId,
  });
}

/**
 * Hook to create a new stream.
 */
export function useCreateStream(classId: string, schoolId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StreamCreateInput) =>
      classService.createStream({ ...data, classId, schoolId }), // Inject required IDs
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STREAMS_KEY, 'list', classId] });
      toast.success('Stream added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add stream');
    },
  });
}

// === ClassSubject Hooks ===

/**
 * Hook to fetch all subjects taught in a class.
 */
export function useClassSubjects(classId: string) {
  return useQuery({
    queryKey: [CLASS_SUBJECTS_KEY, 'list', classId],
    queryFn: () => classService.getClassSubjects(classId),
    enabled: !!classId,
  });
}

/**
 * Hook to add a subject to a class.
 */
export function useAddClassSubject(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassSubjectCreateInput) =>
      classService.addClassSubject({ ...data, classId }), // Inject classId
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLASS_SUBJECTS_KEY, 'list', classId] });
      toast.success('Subject added to class');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add subject');
    },
  });
}

/**
 * Hook to remove a subject from a class.
 */
export function useRemoveClassSubject(classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classService.removeClassSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLASS_SUBJECTS_KEY, 'list', classId] });
      toast.success('Subject removed from class');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove subject');
    },
  });
}