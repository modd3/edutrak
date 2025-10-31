import apiClient from '@/lib/api-client';
import { AcademicYear, Term, ApiResponse, PaginatedResponse } from '@/types';

// --- Academic Year Types ---
export type AcademicYearCreateInput = Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt' | 'terms'>;
export type AcademicYearUpdateInput = Partial<AcademicYearCreateInput>;

// --- Term Types ---
// We'll typically create terms along with the year or add them to an existing year
export type TermCreateInput = Omit<Term, 'id' | 'createdAt' | 'updatedAt' | 'academicYear'>;

export const academicYearService = {
  // === Academic Year Endpoints ===

  /**
   * Fetches a paginated list of academic years.
   */
  getAllYears: async (params?: {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
  }): Promise<PaginatedResponse<AcademicYear>> => {
    const response = await apiClient.get('/academic/years', { params });
    return response.data;
  },

  /**
   * Fetches a single academic year by its ID.
   */
  getYearById: async (id: string): Promise<AcademicYear> => {
    const response = await apiClient.get<ApiResponse<AcademicYear>>(`/academic/years/${id}`);
    if (!response.data.data) {
      throw new Error('Academic Year not found');
    }
    return response.data.data;
  },

  /**
   * Creates a new academic year.
   * The backend should ideally handle creating the 3 default terms in this transaction.
   */
  createYear: async (data: AcademicYearCreateInput): Promise<AcademicYear> => {
    const response = await apiClient.post<ApiResponse<AcademicYear>>('/academic/years', data);
    if (!response.data.data) {
      throw new Error('Failed to create academic year');
    }
    return response.data.data;
  },

  /**
   * Updates an existing academic year.
   */
  updateYear: async (id: string, data: AcademicYearUpdateInput): Promise<AcademicYear> => {
    const response = await apiClient.put<ApiResponse<AcademicYear>>(`/academic/years/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update academic year');
    }
    return response.data.data;
  },

  /**
   * Deletes an academic year by its ID.
   */
  deleteYear: async (id: string): Promise<void> => {
    await apiClient.delete(`/academic/years/${id}`);
  },

  /**
   * Sets a specific academic year as active.
   * This is a common operation.
   */
  setActiveYear: async (id: string): Promise<AcademicYear> => {
    const response = await apiClient.patch<ApiResponse<AcademicYear>>(`/academic/years/${id}/set-active`);
    return response.data.data!;
  },

  // === Term Endpoints ===

  /**
   * Fetches all terms for a specific academic year.
   */
  getTermsByYear: async (academicYearId: string): Promise<Term[]> => {
    const response = await apiClient.get<ApiResponse<Term[]>>(`/academic/years/${academicYearId}/terms`);
    return response.data.data || [];
  },

  /**
   * Creates a new term for an existing academic year.
   * (May not be needed if the backend creates 3 terms by default).
   */
  createTerm: async (data: TermCreateInput): Promise<Term> => {
    const response = await apiClient.post<ApiResponse<Term>>('/academic/terms', data);
    return response.data.data!;
  },

  /**
   * Updates an existing term (e.g., to set dates).
   */
  updateTerm: async (id: string, data: Partial<TermCreateInput>): Promise<Term> => {
    const response = await apiClient.put<ApiResponse<Term>>(`/academic/terms/${id}`, data);
    return response.data.data!;
  },
};