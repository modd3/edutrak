import apiClient from '@/lib/api-client';
import { Teacher, ApiResponse, PaginatedResponse } from '@/types';

export const teacherService = {
  getAll: async (params?: {
    schoolId?: string;
    employmentType?: string;
    search?: string;
  }): Promise<PaginatedResponse<Teacher>> => {
    const response = await apiClient.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await apiClient.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<Teacher>): Promise<Teacher> => {
    const response = await apiClient.post<ApiResponse<Teacher>>('/teachers', data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    const response = await apiClient.put<ApiResponse<Teacher>>(`/teachers/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teachers/${id}`);
  },

  assignSubjects: async (teacherId: string, subjectIds: string[]): Promise<void> => {
    await apiClient.post(`/teachers/${teacherId}/subjects`, { subjectIds });
  },

  getWorkload: async (teacherId: string): Promise<any> => {
    const response = await apiClient.get(`/teachers/${teacherId}/workload`);
    return response.data.data;
  },
};