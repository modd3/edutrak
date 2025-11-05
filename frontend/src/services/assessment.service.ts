import apiClient from '@/lib/api-client';
import { Assessment, ApiResponse, PaginatedResponse } from '@/types';

export type AssessmentCreateInput = {
  name: string;
  type: 'CAT' | 'MIDTERM' | 'END_OF_TERM' | 'MOCK' | 'NATIONAL_EXAM' | 'COMPETENCY_BASED';
  studentId: string;
  classSubjectId: string;
  termId: string;
  marksObtained?: number;
  maxMarks: number;
  competencyLevel?: 'EXCEEDING_EXPECTATIONS' | 'MEETING_EXPECTATIONS' | 'APPROACHING_EXPECTATIONS' | 'BELOW_EXPECTATIONS';
  grade?: string;
  remarks?: string;
  assessedBy?: string;
  assessedDate?: string;
};

export type AssessmentUpdateInput = Partial<AssessmentCreateInput>;

export type BulkAssessmentInput = {
  assessments: Array<Omit<AssessmentCreateInput, 'name' | 'type' | 'termId' | 'maxMarks'>>;
  name: string;
  type: AssessmentCreateInput['type'];
  termId: string;
  maxMarks: number;
};

export const assessmentService = {
  getAll: async (params?: {
    classId?: string;
    subjectId?: string;
    termId?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Assessment>> => {
    const response = await apiClient.get<PaginatedResponse<Assessment>>('/assessments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Assessment> => {
    const response = await apiClient.get<ApiResponse<Assessment>>(`/assessments/${id}`);
    if (!response.data.data) {
      throw new Error('Assessment not found');
    }
    return response.data.data;
  },

  create: async (data: AssessmentCreateInput): Promise<Assessment> => {
    const response = await apiClient.post<ApiResponse<Assessment>>('/assessments', data);
    if (!response.data.data) {
      throw new Error('Failed to create assessment');
    }
    return response.data.data;
  },

  update: async (id: string, data: AssessmentUpdateInput): Promise<Assessment> => {
    const response = await apiClient.patch<ApiResponse<Assessment>>(`/assessments/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update assessment');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assessments/${id}`);
  },

  bulkCreate: async (data: BulkAssessmentInput): Promise<Assessment[]> => {
    const response = await apiClient.post<ApiResponse<Assessment[]>>('/assessments/bulk', data);
    if (!response.data.data) {
      throw new Error('Failed to create assessments');
    }
    return response.data.data;
  },

  getStatistics: async (params: {
    classId: string;
    subjectId?: string;
    termId?: string;
  }): Promise<any> => {
    const response = await apiClient.get(`/assessments/statistics`, { params });
    return response.data.data;
  },
};