import apiClient from '@/lib/api-client';
import { Student, ApiResponse, PaginatedResponse } from '@/types';

export const studentService = {
  getAll: async (params?: {
    schoolId?: number;
    gender?: string;
    hasSpecialNeeds?: boolean;
  }): Promise<Student[]> => {
    const response = await apiClient.get<ApiResponse<Student[]>>('/students', { params });
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Student> => {
    const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<Student>): Promise<Student> => {
    const response = await apiClient.post<ApiResponse<Student>>('/students', data);
    return response.data.data!;
  },

  update: async (id: number, data: Partial<Student>): Promise<Student> => {
    const response = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },

  enroll: async (data: {
    studentId: number;
    classId: number;
    streamId?: number;
    academicYearId: number;
    selectedSubjects?: number[];
  }): Promise<any> => {
    const response = await apiClient.post('/students/enroll', data);
    return response.data.data;
  },
};