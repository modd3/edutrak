import apiClient from '@/lib/api-client';
import { Guardian, User, ApiResponse, PaginatedResponse } from '@/types';

export type GuardianCreateInput = {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
};

export type GuardianUpdateInput = Partial<Omit<GuardianCreateInput, 'email'>>;

export type GuardianResponse = Guardian & {
  user: User;
};

export const guardianService = {
  /**
   * Get all guardians for a school
   */
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<GuardianResponse>> => {
    const response = await apiClient.get('/guardians', { params });
    return response.data;
  },

  /**
   * Get a single guardian by ID
   */
  getById: async (id: string): Promise<GuardianResponse> => {
    const response = await apiClient.get<ApiResponse<GuardianResponse>>(`/guardians/${id}`);
    return response.data.data!;
  },

  /**
   * Create a new guardian with user account
   */
  create: async (data: GuardianCreateInput): Promise<GuardianResponse> => {
    const response = await apiClient.post<ApiResponse<GuardianResponse>>('/guardians', data);
    return response.data.data!;
  },

  /**
   * Update an existing guardian
   */
  update: async (id: string, data: GuardianUpdateInput): Promise<GuardianResponse> => {
    const response = await apiClient.put<ApiResponse<GuardianResponse>>(`/guardians/${id}`, data);
    return response.data.data!;
  },

  /**
   * Delete a guardian
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/guardians/${id}`);
  },

  /**
   * Link a guardian to a student
   */
  linkToStudent: async (guardianId: string, studentId: string): Promise<void> => {
    await apiClient.post(`/guardians/${guardianId}/link-student`, { studentId });
  },

  /**
   * Unlink a guardian from a student
   */
  unlinkStudent: async (guardianId: string, studentId: string): Promise<void> => {
    await apiClient.post(`/guardians/${guardianId}/unlink-student`, { studentId });
  },

  /**
   * Get guardians for a specific student
   */
  getByStudent: async (studentId: string): Promise<GuardianResponse[]> => {
    const response = await apiClient.get<ApiResponse<GuardianResponse[]>>(`/students/${studentId}/guardians`);
    return response.data.data!;
  },
};
