import apiClient from '@/lib/api-client';
import { Assessment, ApiResponse, PaginatedResponse } from '@/types';

// --- Assessment Types ---
export type AssessmentCreateInput = Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'student' | 'term' | 'classSubject'>;
export type AssessmentUpdateInput = Partial<AssessmentCreateInput>;

export type BulkAssessmentInput = {
  classSubjectId: string;
  termId: string;
  assessmentName: string;
  assessmentType: Assessment['type'];
  maxMarks: number;
  entries: Array<{
    studentId: string;
    marksObtained?: number;
    competencyLevel?: Assessment['competencyLevel'];
    remarks?: string;
  }>;
};

export const assessmentService = {
  /**
   * Fetches a paginated list of assessments.
   */
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    schoolId?: string;
    studentId?: string;
    classId?: string;
    subjectId?: string;
    termId?: string;
    academicYearId?: string;
  }): Promise<PaginatedResponse<Assessment>> => {
    const response = await apiClient.get('/assessments', { params });
    return response.data;
  },

  /**
   * Fetches a single assessment by its ID.
   */
  getById: async (id: string): Promise<Assessment> => {
    const response = await apiClient.get<ApiResponse<Assessment>>(`/assessments/${id}`);
    if (!response.data.data) {
      throw new Error('Assessment not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new assessment.
   */
  create: async (data: AssessmentCreateInput): Promise<Assessment> => {
    const response = await apiClient.post<ApiResponse<Assessment>>('/assessments', data);
    if (!response.data.data) {
      throw new Error('Failed to create assessment');
    }
    return response.data.data;
  },

  /**
   * Creates multiple assessments in a single request.
   */
  bulkCreate: async (data: BulkAssessmentInput): Promise<{ count: number }> => {
    const response = await apiClient.post<ApiResponse<{ count: number }>>('/assessments/bulk', data);
    return response.data.data!;
  },

  /**
   * Updates an existing assessment.
   */
  update: async (id: string, data: AssessmentUpdateInput): Promise<Assessment> => {
    const response = await apiClient.put<ApiResponse<Assessment>>(`/assessments/${id}`, data);
    return response.data.data!;
  },

  /**
   * Deletes an assessment by its ID.
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assessments/${id}`);
  },
};