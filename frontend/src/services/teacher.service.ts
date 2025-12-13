import api from '@/api';
import { Teacher, ApiResponse, PaginatedResponse } from '@/types';

export const teacherService = {
  getAll: async (params?: {
    schoolId?: string;
    employmentType?: string;
    search?: string;
  }): Promise<PaginatedResponse<Teacher>> => {
    const response = await api.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await api.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<Teacher>): Promise<Teacher> => {
    const response = await api.post<ApiResponse<Teacher>>('/teachers', data);
    return response.data.data!;
  },

  create_user: async (data: Partial<Teacher>): Promise<Teacher> => {
    const response = await api.post<ApiResponse<Teacher>>('/teachers/with-user', data);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    const response = await api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },

  assignSubjects: async (teacherId: string, subjectIds: string[]): Promise<void> => {
    await api.post(`/teachers/${teacherId}/subjects`, { subjectIds });
  },

  getWorkload: async (teacherId: string): Promise<any> => {
    const response = await api.get(`/teachers/${teacherId}/workload`);
    return response.data.data;
  },
};