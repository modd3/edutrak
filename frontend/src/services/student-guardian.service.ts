// src/services/student-guardian.service.ts
// Service for centralized student-guardian relationship management API
import api from '@/api';
import { ApiResponse } from '@/types';

export interface StudentGuardianLinkInput {
  studentId: string;
  guardianId: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CreateGuardianAndLinkInput {
  studentId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  relationship: string;
  occupation?: string;
  employer?: string;
  workPhone?: string;
  isPrimary?: boolean;
}

export interface UpdateRelationshipInput {
  relationship?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

export interface StudentGuardianResponse {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedById: string | null;
  createdAt: string;
  updatedAt: string;
  guardian: {
    id: string;
    userId: string;
    relationship: string;
    occupation: string | null;
    employer: string | null;
    workPhone: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
    };
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    enrollments?: Array<{
      class?: { id: string; name: string; level: string };
      stream?: { id: string; name: string };
      academicYear?: { id: string; year: number };
    }>;
  };
}

export const studentGuardianService = {
  /**
   * Link an existing guardian to a student
   */
  linkGuardianToStudent: async (data: StudentGuardianLinkInput): Promise<StudentGuardianResponse> => {
    const response = await api.post<ApiResponse<StudentGuardianResponse>>(
      '/student-guardians/link',
      data
    );
    return response.data.data!;
  },

  /**
   * Create a new guardian and link to student in one step
   */
  createGuardianAndLink: async (data: CreateGuardianAndLinkInput): Promise<{ guardian: any; link: any }> => {
    const response = await api.post<ApiResponse<{ guardian: any; link: any }>>(
      '/student-guardians/create-and-link',
      data
    );
    return response.data.data!;
  },

  /**
   * Update relationship (isPrimary, relationship type, verification)
   */
  updateRelationship: async (
    studentId: string,
    guardianId: string,
    data: UpdateRelationshipInput
  ): Promise<StudentGuardianResponse> => {
    const response = await api.patch<ApiResponse<StudentGuardianResponse>>(
      `/student-guardians/${studentId}/${guardianId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Verify a relationship
   */
  verifyRelationship: async (studentId: string, guardianId: string): Promise<StudentGuardianResponse> => {
    const response = await api.post<ApiResponse<StudentGuardianResponse>>(
      `/student-guardians/${studentId}/${guardianId}/verify`
    );
    return response.data.data!;
  },

  /**
   * Unlink a guardian from a student
   */
  unlinkGuardian: async (studentId: string, guardianId: string): Promise<void> => {
    await api.delete(`/student-guardians/${studentId}/${guardianId}`);
  },

  /**
   * Get all guardians for a student
   */
  getStudentGuardians: async (studentId: string): Promise<StudentGuardianResponse[]> => {
    const response = await api.get<ApiResponse<StudentGuardianResponse[]>>(
      `/student-guardians/student/${studentId}`
    );
    return response.data.data || [];
  },

  /**
   * Get all students for a guardian
   */
  getGuardianStudents: async (guardianId: string): Promise<StudentGuardianResponse[]> => {
    const response = await api.get<ApiResponse<StudentGuardianResponse[]>>(
      `/student-guardians/guardian/${guardianId}`
    );
    return response.data.data || [];
  },
};