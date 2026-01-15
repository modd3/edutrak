import api from '@/api';  // Assuming your API client is exported as 'api'
import { Subject, SubjectOffering, ApiResponse, PaginatedResponse } from '@/types';

// --- Subject Types ---
export type SubjectCreateInput = Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'offerings'>;
export type SubjectUpdateInput = Partial<SubjectCreateInput>;

// --- Subject Offering Types ---
export type SubjectOfferingCreateInput = {
  schoolId: string;
  subjectId: string;
  isActive?: boolean;
};

export type SubjectOfferingUpdateInput = {
  isActive?: boolean;
};

export const subjectService = {
  // === Core Subject Endpoints (Global) ===

  /**
   * Fetches a paginated list of all core subjects (global catalog).
   */
  getAllSubjects: async (params?: {
    page?: number;
    pageSize?: number;
    name?: string;
    code?: string;
    category?: string;
    curriculum?: string;
  }): Promise<PaginatedResponse<Subject>> => {
    const response = await api.get('/subjects', { params });
    return response.data;
  },
  
  /**
   * Creates a new core subject (global catalog).
   */
  createSubject: async (data: SubjectCreateInput): Promise<Subject> => {
    const response = await api.post<ApiResponse<Subject>>('/subjects', data);
    return response.data.data!;
  },

  /**
   * Updates an existing core subject.
   */
  updateSubject: async (id: string, data: SubjectUpdateInput): Promise<Subject> => {
    const response = await api.put<ApiResponse<Subject>>(`/subjects/${id}`, data);
    return response.data.data!;
  },

  /**
   * Deletes a core subject.
   */
  deleteSubject: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
  
  /**
   * Gets subject by code
   */
  getSubjectByCode: async (code: string): Promise<Subject> => {
    const response = await api.get<ApiResponse<Subject>>(`/subjects/code/${code}`);
    return response.data.data!;
  },
  
  /**
   * Gets subjects by curriculum
   */
  getSubjectsByCurriculum: async (curriculum: string): Promise<Subject[]> => {
    const response = await api.get<ApiResponse<Subject[]>>(`/subjects/curriculum/${curriculum}`);
    return response.data.data!;
  },
  
  // === Subject Offering Endpoints (School Specific) ===

  /**
   * Fetches a paginated list of subjects offered by a school.
   */
  getSchoolSubjectOfferings: async (schoolId: string, params?: {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<SubjectOffering>> => {
    const response = await api.get(`/subjects/schools/${schoolId}/offerings`, { params });
    return response.data;
  },
  
  /**
   * Adds a subject to a school's offerings.
   */
  addSubjectToSchool: async (data: SubjectOfferingCreateInput): Promise<SubjectOffering> => {
    const response = await api.post<ApiResponse<SubjectOffering>>('/subjects/offerings', data);
    return response.data.data!;
  },

  /**
   * Removes a subject from a school's offerings.
   */
  removeSubjectFromSchool: async (schoolId: string, subjectId: string): Promise<void> => {
    await api.delete(`/schools/${schoolId}/subjects/${subjectId}`);
  },

  /**
   * Toggles subject offering active status.
   */
  toggleSubjectOffering: async (id: string): Promise<SubjectOffering> => {
    const response = await api.patch<ApiResponse<SubjectOffering>>(`/subjects/offerings/${id}/toggle`);
    return response.data.data!;
  },
  
  // === Curriculum-specific queries ===
  
  /**
   * Gets CBC subjects by learning area
   */
  getCBCSubjectsByLearningArea: async (learningArea: string): Promise<Subject[]> => {
    const response = await api.get<ApiResponse<Subject[]>>(`/subjects/cbc/learning-area/${learningArea}`);
    return response.data.data!;
  },
  
  /**
   * Gets 8-4-4 subjects by group
   */
  get844SubjectsByGroup: async (subjectGroup: string): Promise<Subject[]> => {
    const response = await api.get<ApiResponse<Subject[]>>(`/subjects/844/group/${subjectGroup}`);
    return response.data.data!;
  },
  
  /**
   * Gets subject performance data
   */
  getSubjectPerformance: async (subjectId: string): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/subjects/${subjectId}/performance`);
    return response.data.data!;
  }
};