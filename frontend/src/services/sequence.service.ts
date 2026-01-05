import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export type SequenceType = 'ADMISSION_NUMBER' | 'EMPLOYEE_NUMBER' | 'RECEIPT_NUMBER' | 'INVOICE_NUMBER' | 'ASSESSMENT_NUMBER' | 'CLASS_CODE';

export type SequenceResponse = {
  type: SequenceType;
  nextValue: string;
  schoolId?: string;
};

export const sequenceService = {
  /**
   * Preview the next sequence number without generating it
   */
  preview: async (type: SequenceType, schoolId?: string): Promise<SequenceResponse> => {
    const response = await apiClient.get<ApiResponse<SequenceResponse>>('/sequences/preview', {
      params: { type, schoolId },
    });
    return response.data.data!;
  },

  /**
   * Generate the next sequence number
   */
  generate: async (type: SequenceType, schoolId?: string): Promise<SequenceResponse> => {
    const response = await apiClient.post<ApiResponse<SequenceResponse>>('/sequences/generate', {
      type,
      schoolId,
    });
    return response.data.data!;
  },

  /**
   * Get sequence history for audit purposes
   */
  getHistory: async (type: SequenceType, schoolId?: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<any> => {
    const response = await apiClient.get(`/sequences/history`, {
      params: { type, schoolId, ...params },
    });
    return response.data;
  },

  /**
   * Reset sequence (admin only)
   */
  reset: async (type: SequenceType, schoolId?: string): Promise<void> => {
    await apiClient.post(`/sequences/reset`, { type, schoolId });
  },
};
