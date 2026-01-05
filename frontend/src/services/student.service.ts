// src/services/student.service.ts (Enhanced)
import { Student, ApiResponse, PaginatedResponse } from '@/types';
import api from '@/api';

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
    search?: string;
    gender?: string;
    hasSpecialNeeds?: boolean;
    classId?: string;
  }): Promise<PaginatedResponse<Student>> => {
    // Map pageSize to limit for API compatibility
    const apiParams = {
      page: params?.page || 1,
      limit: params?.pageSize || 20,
      schoolId: params?.schoolId,
      search: params?.search,
      gender: params?.gender,
      hasSpecialNeeds: params?.hasSpecialNeeds,
      classId: params?.classId,
    };
    const response = await api.get<PaginatedResponse<Student>>('/students', { params: apiParams });
    return response.data;
  },

  /**
   * Fetches a single student by their ID.
   */
  getById: async (id: string): Promise<Student> => {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    if (!response.data.data) {
      throw new Error('Student not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new student.
   */
  create: async (data: Partial<Student>): Promise<Student> => {
    const response = await api.post<ApiResponse<Student>>('/users', data);
    if (!response.data.data) {
      throw new Error('Failed to create student');
    }
    return response.data.data;
  },

  /**
   * Updates an existing student by their ID.
   */
  update: async (id: string, data: Partial<Student>): Promise<Student> => {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update student');
    }
    return response.data.data;
  },

  /**
   * Deletes a student by their ID.
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  /**
   * Enrolls a student in a class/stream
   */
  enroll: async (data: {
    studentId: string;
    classId: string;
    streamId?: string;
    academicYearId: string;
    schoolId: string;
    status?: string;
  }): Promise<any> => {
    const response = await api.post('/students/enroll', data);
    return response.data.data;
  },

  /**
   * Promotes students to next class
   */
  promote: async (data: {
    studentIds: string[];
    fromClassId: string;
    toClassId: string;
    academicYearId: string;
  }): Promise<any> => {
    const response = await api.post('/students/promote', data);
    return response.data.data;
  },

  /**
   * Gets student enrollment history
   */
  getEnrollmentHistory: async (studentId: string): Promise<any[]> => {
    const response = await api.get(`/students/${studentId}/enrollments`);
    return response.data.data;
  },

  /**
   * Gets students by class
   */
  getByClass: async (classId: string, params?: {
    streamId?: string;
    status?: string;
  }): Promise<Student[]> => {
    const response = await api.get(`/classes/${classId}/students`, { params });
    return response.data.data;
  },
};
