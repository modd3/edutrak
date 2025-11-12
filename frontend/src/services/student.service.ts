import { Student, ApiResponse, PaginatedResponse } from '@/types';
import { studentsApi } from './api.service';

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
    const response = await studentsApi.getAll({ params });
    return response.data;
  },

  /**
   * Fetches a single student by their ID.
   */
  getById: async (id: string): Promise<ApiResponse<Student>> => {
    const response = await studentsApi.getById(id);
    if (!response.data.data) {
      throw new Error('Student not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new student.
   */
  create: async (data: StudentCreateInput): Promise<ApiResponse<Student>> => {
    const response = await studentsApi.create(data);
    if (!response.data.data) {
      throw new Error('Failed to create student');
    }
    return response.data.data;
  },

  /**
   * Updates an existing student by their ID.
   */
  update: async (id: string, data: StudentUpdateInput): Promise<ApiResponse<Student>> => {
    const response = await studentsApi.update(id, data);
    if (!response.data.data) {
      throw new Error('Failed to update student');
    }
    return response.data.data;
  },

  /**
   * Deletes a student by their ID.
   */
  delete: async (id: string): Promise<void> => {
    await studentsApi.delete(id);
  },
};