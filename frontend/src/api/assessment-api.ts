// src/api/assessment-api.ts

import api from '.';
import {
  AssessmentDefinition,
  AssessmentResult,
  AssessmentType,
  CompetencyLevel,
} from '@/types';

/**
 * Type Definitions
 */
export interface CreateAssessmentInput {
  name: string;
  type: AssessmentType;
  maxMarks?: number;
  termId: string;
  classSubjectId: string;
  strandId?: string;
  academicYearId?: string;
}

export interface UpdateAssessmentInput {
  name?: string;
  type?: AssessmentType;
  maxMarks?: number;
  termId?: string;
  classSubjectId?: string;
  strandId?: string;
}

export interface CreateGradeInput {
  studentId: string;
  assessmentDefId: string;
  numericValue?: number;
  grade?: string;
  competencyLevel?: CompetencyLevel;
  comment?: string;
}

export interface BulkGradeEntry {
  assessmentDefId: string;
  entries: Array<{
    studentId: string;
    marks: number;
    comment?: string;
  }>;
}

export interface CSVGradeEntry {
  studentAdmissionNo: string;
  marks: number;
  comment?: string;
}

export interface AssessmentFilters {
  termId?: string;
  classSubjectId?: string;
  type?: AssessmentType;
  academicYearId?: string;
  page?: number;
  limit?: number;
}

export interface ResultFilters {
  studentId?: string;
  assessmentDefId?: string;
  classId?: string;
  termId?: string;
  academicYearId?: string;
  page?: number;
  limit?: number;
}

/**
 * Assessment API Client
 */
export const assessmentApi = {
  // ========================================
  // Assessment Definitions
  // ========================================

  /**
   * Create new assessment
   */
  createAssessment: async (data: CreateAssessmentInput) => {
    const response = await api.post('/assessments', data);
    return response.data;
  },

  /**
   * Bulk create assessments
   */
  bulkCreateAssessments: async (assessments: CreateAssessmentInput[]) => {
    const response = await api.post('/assessments/bulk', { assessments });
    return response.data;
  },

  /**
   * Get all assessments with filters
   */
  getAssessments: async (filters?: AssessmentFilters) => {
    const response = await api.get('/assessments', { params: filters });
    return response.data;
  },

  /**
   * Get single assessment by ID
   */
  getAssessmentById: async (id: string) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  },

  /**
   * Get assessments for a class
   */
  getClassAssessments: async (classId: string, termId: string) => {
    const response = await api.get(`/assessments/class/${classId}/term/${termId}`);
    return response.data;
  },

  /**
   * Get assessments for a subject
   */
  getSubjectAssessments: async (classSubjectId: string) => {
    const response = await api.get(`/assessments/class-subject/${classSubjectId}`);
    return response.data;
  },

  /**
   * Get assessment statistics
   */
  getAssessmentStats: async (academicYearId?: string) => {
    const response = await api.get('/assessments/stats', {
      params: academicYearId ? { academicYearId } : {},
    });
    return response.data;
  },

  /**
   * Update assessment
   */
  updateAssessment: async (id: string, data: UpdateAssessmentInput) => {
    const response = await api.put(`/assessments/${id}`, data);
    return response.data;
  },

  /**
   * Delete assessment
   */
  deleteAssessment: async (id: string) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  },

  // ========================================
  // Grade Entry
  // ========================================

  /**
   * Create or update single grade
   */
  createGrade: async (data: CreateGradeInput) => {
    const response = await api.post('/assessments/results', data);
    return response.data;
  },

  /**
   * Bulk grade entry
   */
  bulkGradeEntry: async (data: BulkGradeEntry) => {
    const response = await api.post('/assessments/results/bulk', data);
    return response.data;
  },

  /**
   * CSV upload
   */
  csvUpload: async (assessmentId: string, data: CSVGradeEntry[]) => {
    const response = await api.post(`/assessments/results/upload/${assessmentId}`, {
      data,
    });
    return response.data;
  },

  /**
   * Get results with filters
   */
  getResults: async (filters?: ResultFilters) => {
    const response = await api.get('/assessments/results', { params: filters });
    return response.data;
  },

  /**
   * Update grade
   */
  updateGrade: async (
    id: string,
    data: {
      numericValue?: number;
      grade?: string;
      competencyLevel?: CompetencyLevel;
      comment?: string;
    }
  ) => {
    const response = await api.put(`/assessments/results/${id}`, data);
    return response.data;
  },

  /**
   * Delete grade
   */
  deleteGrade: async (id: string) => {
    const response = await api.delete(`/assessments/results/${id}`);
    return response.data;
  },

  // ========================================
  // Reports
  // ========================================

  /**
   * Generate student report card
   */
  generateStudentReport: async (studentId: string, termId: string) => {
    const response = await api.get(
      `/assessments/reports/student/${studentId}/term/${termId}`
    );
    return response.data;
  },

  /**
   * Generate class performance report
   */
  generateClassReport: async (classId: string, termId: string) => {
    const response = await api.get(
      `/assessments/reports/class/${classId}/term/${termId}`
    );
    return response.data;
  },
};
