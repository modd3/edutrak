import api from '@/api';
import { Guardian, User, ApiResponse, PaginatedResponse } from '@/types';

export type GuardianCreateInput = {
  email: string;
  password: string;
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
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<GuardianResponse>> => {
    const response = await api.get('/guardians', { params });
    return response.data;
  },

  /**
   * Get a single guardian by ID
   */
  getById: async (id: string): Promise<GuardianResponse> => {
    const response = await api.get<ApiResponse<GuardianResponse>>(`/guardians/${id}`);
    return response.data.data!;
  },

  /**
   * Create a new guardian with user account
   */
  create: async (data: GuardianCreateInput): Promise<GuardianResponse> => {
    const response = await api.post<ApiResponse<GuardianResponse>>('/guardians', data);
    return response.data.data!;
  },

  /**
   * Update an existing guardian
   */
  update: async (id: string, data: GuardianUpdateInput): Promise<GuardianResponse> => {
    const response = await api.put<ApiResponse<GuardianResponse>>(`/guardians/${id}`, data);
    return response.data.data!;
  },

  /**
   * Delete a guardian
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/guardians/${id}`);
  },

  /**
   * @deprecated Use studentGuardianService.linkGuardianToStudent instead
   * Link a guardian to a student via centralized API
   */
  linkToStudent: async (guardianId: string, studentId: string): Promise<void> => {
    const { studentGuardianService } = await import('@/services/student-guardian.service');
    await studentGuardianService.linkGuardianToStudent({ guardianId, studentId });
  },

  /**
   * @deprecated Use studentGuardianService.unlinkGuardian instead
   * Unlink a guardian from a student via centralized API
   */
  unlinkStudent: async (guardianId: string, studentId: string): Promise<void> => {
    const { studentGuardianService } = await import('@/services/student-guardian.service');
    await studentGuardianService.unlinkGuardian(studentId, guardianId);
  },

  /**
   * Get guardians for a specific student
   */
  getByStudent: async (studentId: string): Promise<GuardianResponse[]> => {
    const response = await api.get<ApiResponse<GuardianResponse[]>>(`/students/${studentId}/guardians`);
    return response.data.data!;
  },
};