import api from '@/api';
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
  // Assessment Definitions
  createDefinition: async (data: Omit<AssessmentCreateInput, 'studentId' | 'marksObtained' | 'competencyLevel' | 'grade' | 'remarks' | 'assessedBy' | 'assessedDate'>): Promise<Assessment> => {
    const response = await api.post<ApiResponse<Assessment>>('/assessments/definitions', data);
    if (!response.data.data) {
      throw new Error('Failed to create assessment definition');
    }
    return response.data.data;
  },

  getDefinitionById: async (id: string): Promise<Assessment> => {
    const response = await api.get<ApiResponse<Assessment>>(`/assessments/definitions/${id}`);
    if (!response.data.data) {
      throw new Error('Assessment definition not found');
    }
    return response.data.data;
  },

  updateDefinition: async (id: string, data: Partial<Omit<AssessmentCreateInput, 'studentId' | 'marksObtained' | 'competencyLevel' | 'grade' | 'remarks' | 'assessedBy' | 'assessedDate'>>): Promise<Assessment> => {
    const response = await api.put<ApiResponse<Assessment>>(`/assessments/definitions/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update assessment definition');
    }
    return response.data.data;
  },

  deleteDefinition: async (id: string): Promise<void> => {
    await api.delete(`/assessments/definitions/${id}`);
  },

  getClassSubjectDefinitions: async (classSubjectId: string): Promise<PaginatedResponse<Assessment>> => {
    const response = await api.get<PaginatedResponse<Assessment>>(`/assessments/definitions/class-subject/${classSubjectId}`);
    return response.data;
  },

  // Assessment Results
  getAll: async (params?: {
    classId?: string;
    subjectId?: string;
    termId?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Assessment>> => {
    // Assuming this means "get all assessment results"
    const response = await api.get<PaginatedResponse<Assessment>>('/assessments/results', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Assessment> => {
    const response = await api.get<ApiResponse<Assessment>>(`/assessments/results/${id}`);
    if (!response.data.data) {
      throw new Error('Assessment result not found');
    }
    return response.data.data;
  },

  create: async (data: AssessmentCreateInput): Promise<Assessment> => {
    const response = await api.post<ApiResponse<Assessment>>('/assessments/results', data);
    if (!response.data.data) {
      throw new Error('Failed to create assessment result');
    }
    return response.data.data;
  },

  update: async (id: string, data: AssessmentUpdateInput): Promise<Assessment> => {
    const response = await api.put<ApiResponse<Assessment>>(`/assessments/results/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update assessment result');
    }
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assessments/results/${id}`);
  },

  bulkCreate: async (data: BulkAssessmentInput): Promise<Assessment[]> => {
    const response = await api.post<ApiResponse<Assessment[]>>('/assessments/results/bulk', data);
    if (!response.data.data) {
      throw new Error('Failed to bulk create assessment results');
    }
    return response.data.data;
  },

  getStudentResults: async (studentId: string, params?: {
    termId?: string;
    classSubjectId?: string;
    assessmentType?: AssessmentType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Assessment>> => {
    const response = await api.get<PaginatedResponse<Assessment>>(`/assessments/students/${studentId}/results`, { params });
    return response.data;
  },

  getDefinitionResults: async (assessmentDefId: string): Promise<Assessment[]> => {
    const response = await api.get<ApiResponse<Assessment[]>>(`/assessments/definitions/${assessmentDefId}/results`);
    return response.data.data || [];
  },

  // Statistics
  getStatistics: async (params: {
    classId: string;
    subjectId?: string;
    termId?: string;
  }): Promise<any> => {
    // This endpoint should be for a specific class or class-subject statistics
    // The current backend route is: /assessments/statistics/class-subject/:classSubjectId
    // Need to clarify what 'getStatistics' is intended for in the frontend.
    // For now, assuming it's class-subject statistics.
    if (!params.classId) { // Should be classSubjectId
        throw new Error('classSubjectId is required for class subject statistics');
    }
    const response = await api.get(`/assessments/statistics/class-subject/${params.classId}`, { params: { termId: params.termId } });
    return response.data.data;
  },

  getStudentTermAverage: async (studentId: string, termId: string): Promise<any> => {
    const response = await api.get(`/assessments/students/${studentId}/average/term/${termId}`);
    return response.data;
  },

  generateStudentTermReport: async (studentId: string, termId: string): Promise<any> => {
    const response = await api.get(`/assessments/students/${studentId}/reports/term/${termId}`);
    return response.data;
  },
  
  getClassAssessmentAnalytics: async (classId: string, params?: {termId?: string, academicYearId?: string}) => {
    const response = await api.get(`/assessments/analytics/class/${classId}`, { params });
    return response.data;
  },

  exportAssessmentResults: async (assessmentDefId: string, format: string = 'csv'): Promise<any> => {
    const response = await api.get(`/assessments/export/definition/${assessmentDefId}`, { params: { format } });
    return response.data;
  },
};