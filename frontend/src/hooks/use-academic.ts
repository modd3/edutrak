// src/hooks/use-academic.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';

// Types
export interface AcademicYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  terms?: Term[];
  _count?: {
    classes: number;
    terms: number;
    studentClasses: number;
  };
}

export interface Term {
  id: string;
  name: 'TERM_1' | 'TERM_2' | 'TERM_3';
  termNumber: number;
  startDate: string;
  endDate: string;
  academicYearId: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  _count?: {
    AssessmentDefinitions: number;
    classSubjects: number;
  };
}

export interface Class {
  id: string;
  name: string;
  level: string;
  curriculum: 'CBC' | 'EIGHT_FOUR_FOUR' | 'TVET' | 'IGCSE' | 'IB';
  pathway?: 'STEM' | 'ARTS_SPORTS' | 'SOCIAL_SCIENCES';
  academicYearId: string;
  schoolId: string;
  classTeacherId?: string;
  createdAt: string;
  updatedAt: string;
  academicYear?: AcademicYear;
  classTeacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  streams?: Stream[];
  _count?: {
    students: number;
    streams: number;
    subjects: number;
  };
}

export interface Stream {
  id: string;
  name: string;
  capacity?: number;
  classId: string;
  schoolId: string;
  streamTeacherId?: string;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  streamTeacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  _count?: {
    students: number;
  };
}

export interface CreateAcademicYearData {
  year: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  terms: Array<{
    name: 'TERM_1' | 'TERM_2' | 'TERM_3';
    termNumber: number;
    startDate: Date;
    endDate: Date;
  }>;
}

export interface CreateClassData {
  name: string;
  level: string;
  curriculum: string;
  academicYearId: string;
  classTeacherId?: string;
  pathway?: string;
}

export interface CreateStreamData {
  name: string;
  capacity?: number;
  classId: string;
  streamTeacherId?: string;
}

// Academic Years Hooks
export function useAcademicYears() {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await api.get('/academic/years');
      return response.data;
    },
  });
}

export function useActiveAcademicYear() {
  return useQuery({
    queryKey: ['academic-years', 'active'],
    queryFn: async () => {
      const response = await api.get('/academic/years/active');
      return response.data.data;
    },
  });
}

export function useAcademicYear(id: string) {
  return useQuery({
    queryKey: ['academic-years', id],
    queryFn: async () => {
      const response = await api.get(`/academic/years/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAcademicYearData) => {
      const response = await api.post('/academic/years', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Academic year created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create academic year');
    },
  });
}

export function useSetActiveAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/academic/years/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Active academic year updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set active year');
    },
  });
}

// Classes Hooks
export function useClasses(academicYearId?: string) {
  return useQuery({
    queryKey: ['classes', academicYearId],
    queryFn: async () => {
      const params = academicYearId ? { academicYearId } : {};
      const response = await api.get('/academic/classes', { params });
      return response.data;
    },
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const response = await api.get(`/academic/classes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassData) => {
      const response = await api.post('/academic/classes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create class');
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClassData> }) => {
      const response = await api.put(`/academic/classes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update class');
    },
  });
}

// Streams Hooks
export function useClassStreams(classId: string) {
  return useQuery({
    queryKey: ['streams', classId],
    queryFn: async () => {
      const response = await api.get(`/academic/classes/${classId}/streams`);
      console.log(response.data, ': is resp.data')
      return response.data;
    },
    enabled: !!classId,
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStreamData) => {
      const response = await api.post('/academic/streams', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Stream created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create stream');
    },
  });
}

export function useUpdateStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStreamData> }) => {
      const response = await api.put(`/academic/streams/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update stream');
    },
  });
}

export function useDeleteStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/academic/streams/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Stream deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete stream');
    },
  });
}

// Academic Statistics
export function useAcademicStatistics(academicYearId?: string) {
  return useQuery({
    queryKey: ['academic-statistics', academicYearId],
    queryFn: async () => {
      const params = academicYearId ? { academicYearId } : {};
      const response = await api.get('/academic/statistics', { params });
      return response.data;
    },
  });
}
