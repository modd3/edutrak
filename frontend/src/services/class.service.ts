// src/services/class.service.ts
import api from '@/api';
import { Class, ApiResponse, PaginatedResponse } from '@/types';

export type ClassCreateInput = Omit<Class, 'id' | 'createdAt' | 'updatedAt' | 'subjects' | 'streams' | 'students'>;
export type ClassUpdateInput = Partial<ClassCreateInput>;
export type StreamCreateInput = { name: string; classId: string; capacity?: number; schoolId: string };
export type StreamUpdateInput = { name?: string; capacity?: number };

export const classService = {
  getAll: async (params?: {
    schoolId?: string;
    academicYearId?: string;
    curriculum?: string;
    level?: string;
  }): Promise<PaginatedResponse<Class>> => {
    const response = await api.get<PaginatedResponse<Class>>('/academic/classes', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Class> => {
    const response = await api.get<ApiResponse<Class>>(`/academic/classes/${id}`);
    return response.data.data!;
  },

  getClassById: async (id: string): Promise<Class> => {
    return classService.getById(id);
  },

  createClass: async (data: ClassCreateInput): Promise<Class> => {
    const response = await api.post<ApiResponse<Class>>('/academic/classes', data);
    return response.data.data!;
  },

  create: async (data: Partial<Class>): Promise<Class> => {
    const response = await api.post<ApiResponse<Class>>('/academic/classes', data);
    return response.data.data!;
  },

  updateClass: async (id: string, data: ClassUpdateInput): Promise<Class> => {
    const response = await api.patch<ApiResponse<Class>>(`/academic/classes/${id}`, data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    const response = await api.put<ApiResponse<Class>>(`/academic/classes/${id}`, data);
    return response.data.data!;
  },

  deleteClass: async (id: string): Promise<void> => {
    await api.delete(`/academic/classes/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    return classService.deleteClass(id);
  },

  /**
   * Get students in a class for a given academic year via student-classes route
   */
  getStudents: async (classId: string, academicYearId: string): Promise<any[]> => {
    const response = await api.get(`/student-classes/class/${classId}/year/${academicYearId}`);
    return response.data.data || [];
  },

  /**
   * Get students by class (legacy - use getStudents with academicYearId)
   */
  getByClass: async (classId: string): Promise<any[]> => {
    return classService.getStudents(classId, '');
  },

  /**
   * Get streams for a class
   */
  getStreams: async (id: string): Promise<any[]> => {
    const response = await api.get(`/academic/classes/${id}/streams`);
    return response.data.data || [];
  },

  getStreamsByClass: async (classId: string): Promise<any[]> => {
    return classService.getStreams(classId);
  },

  /**
   * Create a new stream
   */
  createStream: async (data: StreamCreateInput): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/academic/streams', data);
    return response.data.data!;
  },

  /**
   * Update a stream
   */
  updateStream: async (id: string, data: StreamUpdateInput): Promise<any> => {
    const response = await api.patch<ApiResponse<any>>(`/academic/streams/${id}`, data);
    return response.data.data!;
  },

  /**
   * Delete a stream
   */
  deleteStream: async (id: string): Promise<void> => {
    await api.delete(`/academic/streams/${id}`);
  },

  getClassesBySchool: async (schoolId: string, params?: any): Promise<PaginatedResponse<Class>> => {
    return classService.getAll({ schoolId, ...params });
  },
};