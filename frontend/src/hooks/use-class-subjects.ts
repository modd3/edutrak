import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { classSubjectsApi, subjectsApi,} from '@/api'; // Adjust path as needed
import { toast } from 'sonner';

// --- Types (Move these to @/types if preferred) ---
export interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

export interface Teacher {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export interface AssignSubjectPayload {
  classId: string;
  subjectId: string;
  academicYearId: string;
  termId: string;
  teacherId?: string;
  streamId?: string;
  subjectCategory: string;
}

// --- Hooks ---

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectsApi.getAll(),
  });
}

export function useClassSubjects(classId: string, academicYearId: string, termId: string) {
  return useQuery({
    queryKey: ['class-subjects', classId, academicYearId, termId],
    queryFn: () => classSubjectsApi.getByClass(classId, { academicYearId, termId }),
    enabled: !!classId && !!academicYearId && !!termId,
  });
}

export function useAssignSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignSubjectPayload) => classSubjectsApi.assign(data),
    onSuccess: (_, variables) => {
      toast.success('Subject assigned successfully');
      // Invalidate the list so it refreshes
      queryClient.invalidateQueries({
        queryKey: ['class-subjects', variables.classId]
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign subject');
    },
  });
}

export function useAssignSubjectTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, teacherId }: { id: string; teacherId: string }) => 
      classSubjectsApi.assignTeacher(id, teacherId),
    onSuccess: () => {
      toast.success('Teacher assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign teacher');
    },
  });
}