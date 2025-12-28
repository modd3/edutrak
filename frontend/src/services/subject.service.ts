import api from '@/lib/api-client';
import { Subject, SubjectOffering, ApiResponse, PaginatedResponse } from '@/types';

// --- Subject Types ---
export type SubjectCreateInput = Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'offerings'>;
export type SubjectUpdateInput = Partial<SubjectCreateInput>;

// --- Subject Offering Types ---
export type SubjectOfferingCreateInput = Omit<SubjectOffering, 'id' | 'createdAt' | 'updatedAt' | 'subject' | 'school'>;
export type SubjectOfferingUpdateInput = Partial<SubjectOfferingCreateInput>;


export const subjectService = {
  // === Core Subject Endpoints (Admin/Global) ===

  /**
   * Fetches a paginated list of all core subjects (independent of school).
   */
  getAllSubjects: async (params?: {
    page?: number;
    pageSize?: number;
    name?: string;
  }): Promise<PaginatedResponse<Subject>> => {
    const response = await api.get('/subjects/core', { params });
    return response.data;
  },
  
  /**
   * Creates a new core subject.
   */
  createSubject: async (data: SubjectCreateInput): Promise<Subject> => {
    const response = await api.post<ApiResponse<Subject>>('/subjects/core', data);
    return response.data.data!;
  },

  /**
   * Updates an existing core subject.
   */
  updateSubject: async (id: string, data: SubjectUpdateInput): Promise<Subject> => {
    const response = await api.put<ApiResponse<Subject>>(`/subjects/core/${id}`, data);
    return response.data.data!;
  },
  
  // === Subject Offering Endpoints (School Specific) ===

  /**
   * Fetches a paginated list of subjects offered by the active school.
   */
  getSchoolSubjectOfferings: async (schoolId: string, params?: {
    page?: number;
    pageSize?: number;
    level?: CurriculumLevel;
  }): Promise<PaginatedResponse<SubjectOffering>> => {
    // Note: Assuming the API is structured to filter by schoolId via context or path
    const response = await api.get(`/schools/${schoolId}/subjects`, { params });
    return response.data;
  },
  
  /**
   * Creates a new subject offering for a school.
   * This links a core subject to a school and defines its properties (e.g., teaching level).
   */
  createSubjectOffering: async (data: SubjectOfferingCreateInput): Promise<SubjectOffering> => {
    const response = await api.post<ApiResponse<SubjectOffering>>('/subjects/offerings', data);
    return response.data.data!;
  },

  /**
   * Deletes a subject offering (unlinks it from the school).
   */
  deleteSubjectOffering: async (id: string): Promise<void> => {
    await api.delete(`/subjects/offerings/${id}`);
  },
};