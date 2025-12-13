import api from '@/api';
import { School } from '@/types';
// Define the shape for creating/updating a school based on your schema
export type CreateSchoolDto = Omit<School, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSchoolDto  = Partial<CreateSchoolDto>;




export interface SchoolFilters {
  type?: School['type'];
  county?: string;
  ownership?: School['ownership'];
  gender?: School['gender'];
  search?: string;
  page?: number;
  limit?: number;
}

export interface SchoolStats {
  totalSchools: number;
  byType: {
    type: string;
    count: number;
  }[];
  byCounty: {
    county: string;
    count: number;
  }[];
  byOwnership: {
    ownership: string;
    count: number;
  }[];
}

export const schoolService = {
  /**
   * Get all schools with optional filters
   */
  getAll: (params?: SchoolFilters) =>
    api.get<{
      success: boolean;
      message: string;
      data: School[];
      count: number;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>('/schools', { params }),

  /**
   * Get a single school by ID
   */
  getById: (id: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: School;
    }>(`/schools/${id}`),

  /**
   * Get school by registration number
   */
  getByRegistrationNo: (registrationNo: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: School;
    }>(`/schools/registration/${registrationNo}`),

  /**
   * Create a new school
   */
  create: (data: CreateSchoolDto) =>
    api.post<{
      success: boolean;
      message: string;
      data: School;
    }>('/schools', data),

  /**
   * Update a school
   */
  update: (id: string, data: UpdateSchoolDto) =>
    api.put<{
      success: boolean;
      message: string;
      data: School;
    }>(`/schools/${id}`, data),

  /**
   * Delete a school
   */
  delete: (id: string) =>
    api.delete<{
      success: boolean;
      message: string;
    }>(`/schools/${id}`),

    /**
   * Get school statistics
   */
  getStatistics: (schoolId?: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: SchoolStats;
    }>('/schools/statistics', {
      params: { schoolId },
    }),

  /**
   * Get schools by county
   */
  getByCounty: (county: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: School[];
      count: number;
    }>(`/schools/county/${county}`),

  /**
   * Get school users (students, teachers, staff)
   */
  getSchoolUsers: (schoolId: string, role?: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: any[];
      count: number;
    }>(`/schools/${schoolId}/users`, {
      params: { role },
    }),
    /**
   * Get school classes
   */
  getSchoolClasses: (schoolId: string, academicYearId?: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: any[];
      count: number;
    }>(`/schools/${schoolId}/classes`, {
      params: { academicYearId },
    }),

  /**
   * Get school students
   */
  getSchoolStudents: (schoolId: string, filters?: {
    classId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{
      success: boolean;
      message: string;
      data: any[];
      count: number;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/schools/${schoolId}/students`, {
      params: filters,
    }),

  /**
   * Get school teachers
   */
  getSchoolTeachers: (schoolId: string, filters?: {
    employmentType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{
      success: boolean;
      message: string;
      data: any[];
      count: number;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/schools/${schoolId}/teachers`, {
      params: filters,
    }),

  /**
   * Check if registration number exists
   */
  checkRegistrationNo: (registrationNo: string) =>
    api.get<{
      success: boolean;
      message: string;
      data: { exists: boolean };
    }>(`/schools/check-registration/${registrationNo}`),

    /**
     * Check if KNEC code exists
     */
    checkKnecCode: (knecCode: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: { exists: boolean };
      }>(`/schools/check-knec/${knecCode}`),
  
    /**
     * Check if KEMIS code exists
     */
    checkKemisCode: (kemisCode: string) =>
      api.get<{
        success: boolean;
        message: string;
        data: { exists: boolean };
      }>(`/schools/check-kemis/${kemisCode}`),
  
    /**
     * Bulk import schools
     */
    bulkImport: (schools: CreateSchoolDto[]) =>
      api.post<{
        success: boolean;
        message: string;
        data: {
          successful: School[];
          failed: Array<{
            data: CreateSchoolDto;
            error: string;
          }>;
        };
      }>('/schools/bulk-import', { schools }),
  
    /**
     * Export schools
     */
    export: (params?: SchoolFilters) =>
      api.get('/schools/export', {
        params,
        responseType: 'blob',
      }),
  };

