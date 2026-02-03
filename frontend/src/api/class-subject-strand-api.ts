// frontend/src/api/class-subject-strand-api.ts
/**
 * Class Subject Strand API - Manage strand assignments to class subjects
 */

import api from '.';

export interface ClassSubjectStrandAssignment {
  id: string;
  classSubjectId: string;
  strandId: string;
}

export interface StrandWithAssignments {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  assessmentCount?: number;
}

/**
 * Class Subject Strand API Client
 */
export const classSubjectStrandApi = {
  /**
   * Assign a strand to a class subject
   */
  assignStrandToClassSubject: async (data: {
    classSubjectId: string;
    strandId: string;
    schoolId: string;
  }): Promise<ClassSubjectStrandAssignment> => {
    const response = await api.post(
      '/academic/class-subject-strand/assign',
      data
    );
    return response.data.data;
  },

  /**
   * Bulk assign strands to a class subject
   */
  bulkAssignStrands: async (data: {
    classSubjectId: string;
    strandIds: string[];
    schoolId: string;
  }): Promise<{ assigned: number; assignments: ClassSubjectStrandAssignment[] }> => {
    const response = await api.post(
      '/academic/class-subject-strand/bulk-assign',
      data
    );
    return response.data.data;
  },

  /**
   * Get all strands for a class subject
   */
  getStrandsForClassSubject: async (
    classSubjectId: string,
    params?: {
      includeAssessments?: boolean;
    }
  ): Promise<{
    data: StrandWithAssignments[];
    total: number;
  }> => {
    const response = await api.get(
      '/academic/class-subject-strand/class-subject',
      { params: { classSubjectId, ...params } }
    );
    return response.data.data;
  },

  /**
   * Get all class subjects for a strand
   */
  getClassSubjectsForStrand: async (
    strandId: string
  ): Promise<{
    data: Array<{
      classSubject: {
        id: string;
        subject: { name: string };
        class: { name: string };
      };
    }>;
    total: number;
  }> => {
    const response = await api.get(
      '/academic/class-subject-strand/strand/' + strandId
    );
    return response.data.data;
  },

  /**
   * Get strand count for a class subject
   */
  getStrandCount: async (
    classSubjectId: string
  ): Promise<{ classSubjectId: string; count: number }> => {
    const response = await api.get(
      '/academic/class-subject-strand/count',
      { params: { classSubjectId } }
    );
    return response.data.data;
  },

  /**
   * Remove strand from class subject
   */
  removeStrandFromClassSubject: async (data: {
    classSubjectId: string;
    strandId: string;
    schoolId: string;
  }): Promise<void> => {
    await api.delete(
      '/academic/class-subject-strand/remove',
      { data }
    );
  },

  /**
   * Validate strand assignments for a class subject
   */
  validateStrandAssignments: async (
    classSubjectId: string
  ): Promise<{ classSubjectId: string; isValid: boolean }> => {
    const response = await api.get(
      '/academic/class-subject-strand/validate',
      { params: { classSubjectId } }
    );
    return response.data.data;
  },
};
