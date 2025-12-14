// src/services/class.service.ts
import api from '@/api';
import { Class, ApiResponse, PaginatedResponse } from '@/types';

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

  create: async (data: Partial<Class>): Promise<Class> => {
    const response = await api.post<ApiResponse<Class>>('/academic/classes', data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Class>): Promise<Class> => {
    const response = await api.put<ApiResponse<Class>>(`/academic/classes/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/academic/classes/${id}`);
  },

  getStudents: async (id: string): Promise<any[]> => {
    const response = await api.get(`/academic/classes/${id}/students`);
    return response.data.data;
  },

  getStreams: async (id: string): Promise<any[]> => {
    const response = await api.get(`/academic/classes/${id}/streams`);
    return response.data.data;
  },
};