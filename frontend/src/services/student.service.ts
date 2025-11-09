import apiClient from '@/lib/api-client';
import { Student, ApiResponse, PaginatedResponse } from '@/types';

// --- Student Types ---
export type StudentCreateInput = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'enrollments'>;
export type StudentUpdateInput = Partial<StudentCreateInput>;

export const studentService = {
  /**
   * Fetches a paginated list of students.
   */
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    schoolId?: string;
    name?: string;
    gender?: string;
    hasSpecialNeeds?: boolean;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get('/students', { params });
    return response.data;
  },

  /**
   * Fetches a single student by their ID.
   */
  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get<ApiResponse<Student>>(`/students/${id}`);
    if (!response.data.data) {
      throw new Error('Student not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new student.
   */
  create: async (data: StudentCreateInput): Promise<Student> => {
    const response = await apiClient.post<ApiResponse<Student>>('/students', data);
    if (!response.data.data) {
      throw new Error('Failed to create student');
    }
    return response.data.data;
  },

  /**
   * Updates an existing student by their ID.
   */
  update: async (id: string, data: StudentUpdateInput): Promise<Student> => {
    const response = await apiClient.put<ApiResponse<Student>>(`/students/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update student');
    }
    return response.data.data;
  },

  /**
   * Deletes a student by their ID.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};