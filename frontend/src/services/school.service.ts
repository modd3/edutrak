import apiClient from '@/lib/api-client';
import { School, ApiResponse, PaginatedResponse } from '@/types';

// Define the shape for creating/updating a school based on your schema
type SchoolCreateInput = Omit<School, 'id' | 'createdAt' | 'updatedAt'>;
type SchoolUpdateInput = Partial<SchoolCreateInput>;

export const schoolService = {
  /**
   * Fetches a paginated list of schools.
   */
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    county?: string;
    type?: string;
  }): Promise<PaginatedResponse<School>> => {
    const response = await apiClient.get('/schools', { params });
    // Assuming the API returns a standard paginated response
    return response.data;
  },

  /**
   * Fetches a single school by its ID.
   */
  getById: async (id: string): Promise<School> => {
    const response = await apiClient.get<ApiResponse<School>>(`/schools/${id}`);
    if (!response.data.data) {
      throw new Error('School not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new school.
   */
  create: async (data: SchoolCreateInput): Promise<School> => {
    const response = await apiClient.post<ApiResponse<School>>('/schools', data);
    if (!response.data.data) {
      throw new Error('Failed to create school');
    }
    return response.data.data;
  },

  /**
   * Updates an existing school by its ID.
   */
  update: async (id: string, data: SchoolUpdateInput): Promise<School> => {
    const response = await apiClient.put<ApiResponse<School>>(`/schools/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update school');
    }
    return response.data.data;
  },

  /**
   * Deletes a school by its ID.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/schools/${id}`);
  },

  /**
   * Fetches statistics for a specific school.
   * (As used in your Dashboard.tsx example)
   */
  getStatistics: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/schools/${id}/statistics`);
    return response.data.data;
  },
};