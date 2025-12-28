import api from '@/lib/api-client';
import { StudentClass, ApiResponse, PaginatedResponse, Student } from '@/types';

// --- Enrollment Types ---
export type EnrollmentCreateInput = Omit<StudentClass, 'id' | 'createdAt' | 'updatedAt' | 'student' | 'class' | 'stream' | 'academicYear' | 'promotedTo'>;
export type EnrollmentUpdateInput = Partial<Omit<EnrollmentCreateInput, 'studentId'>>;

export const enrollmentService = {
  /**
   * Enrolls a single student into a class.
   */
  enrollStudent: async (data: EnrollmentCreateInput): Promise<StudentClass> => {
    const response = await api.post<ApiResponse<StudentClass>>('/enrollments', data);
    if (!response.data.data) {
      throw new Error('Failed to enroll student');
    }
    return response.data.data;
  },

  /**
   * Fetches all enrollments for a specific student.
   */
  getStudentEnrollments: async (studentId: string): Promise<StudentClass[]> => {
    const response = await api.get<ApiResponse<StudentClass[]>>(`/students/${studentId}/enrollments`);
    return response.data.data || [];
  },

  /**
   * Fetches all enrolled students for a specific class.
   */
  getClassEnrollments: async (
    classId: string,
    params?: {
      page?: number;
      pageSize?: number;
      academicYearId?: string;
      status?: string;
    }
  ): Promise<PaginatedResponse<StudentClass>> => {
    const response = await api.get(`/classes/${classId}/enrollments`, { params });
    return response.data;
  },

  /**
   * Updates an existing enrollment record.
   */
  updateEnrollment: async (enrollmentId: string, data: EnrollmentUpdateInput): Promise<StudentClass> => {
    const response = await api.put<ApiResponse<StudentClass>>(`/enrollments/${enrollmentId}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update enrollment');
    }
    return response.data.data;
  },

  /**
   * Promotes a student or a group of students to a new class.
   */
  promoteStudents: async (data: { enrollmentIds: string[]; newClassId: string; academicYearId: string }): Promise<{ count: number }> => {
    const response = await api.post('/enrollments/promote', data);
    return response.data.data!;
  },
};