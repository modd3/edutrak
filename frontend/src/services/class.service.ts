import apiClient from '@/lib/api-client';
import { Class, Stream, ApiResponse, PaginatedResponse } from '@/types';

// --- Class Types ---
export type ClassCreateInput = Omit<Class, 'id' | 'createdAt' | 'updatedAt' | 'streams' | 'school'>;
export type ClassUpdateInput = Partial<ClassCreateInput>;

// --- Stream Types ---
export type StreamCreateInput = Omit<Stream, 'id' | 'createdAt' | 'updatedAt' | 'class'>;
export type StreamUpdateInput = Partial<StreamCreateInput>;

export const classService = {
  // === Class Endpoints (School Specific) ===

  /**
   * Fetches a paginated list of classes for a specific school.
   */
  getClassesBySchool: async (
    schoolId: string,
    params?: {
      page?: number;
      pageSize?: number;
      name?: string;
    }
  ): Promise<PaginatedResponse<Class>> => {
    const response = await apiClient.get(`/schools/${schoolId}/classes`, { params });
    return response.data;
  },

  /**
   * Fetches a single class by its ID.
   */
  getClassById: async (id: string): Promise<Class> => {
    const response = await apiClient.get<ApiResponse<Class>>(`/classes/${id}`);
    if (!response.data.data) {
      throw new Error('Class not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new class for a school.
   */
  createClass: async (data: ClassCreateInput): Promise<Class> => {
    const response = await apiClient.post<ApiResponse<Class>>('/classes', data);
    if (!response.data.data) {
      throw new Error('Failed to create class');
    }
    return response.data.data;
  },

  /**
   * Updates an existing class.
   */
  updateClass: async (id: string, data: ClassUpdateInput): Promise<Class> => {
    const response = await apiClient.put<ApiResponse<Class>>(`/classes/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update class');
    }
    return response.data.data;
  },

  /**
   * Deletes a class by its ID.
   */
  deleteClass: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },

  // === Stream Endpoints ===

  /**
   * Fetches all streams for a specific class.
   */
  getStreamsByClass: async (classId: string): Promise<Stream[]> => {
    const response = await apiClient.get<ApiResponse<Stream[]>>(`/classes/${classId}/streams`);
    return response.data.data || [];
  },

  /**
   * Creates a new stream within a class.
   */
  createStream: async (data: StreamCreateInput): Promise<Stream> => {
    const response = await apiClient.post<ApiResponse<Stream>>('/streams', data);
    if (!response.data.data) {
      throw new Error('Failed to create stream');
    }
    return response.data.data;
  },

  /**
   * Updates an existing stream.
   */
  updateStream: async (id: string, data: StreamUpdateInput): Promise<Stream> => {
    const response = await apiClient.put<ApiResponse<Stream>>(`/streams/${id}`, data);
    return response.data.data!;
  },

  /**
   * Deletes a stream by its ID.
   */
  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/streams/${id}`);
  },
};