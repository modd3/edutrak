// frontend/src/api/student-class-subject-api.ts
/**
 * Student Class Subject API - New relational model for subject enrollments
 * Replaces the deprecated selectedSubjects JSON array approach
 */

import api from '.';
import { EnrollmentStatus } from '@/types';

export interface StudentSubjectEnrollment {
  id: string;
  studentId: string;
  classSubjectId: string;
  enrollmentId: string;
  schoolId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  droppedAt?: string;
}

export interface StudentSubjectEnrollmentWithDetails extends StudentSubjectEnrollment {
  classSubject: {
    id: string;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    teacherProfile?: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface StudentSubjectRoster {
  data: Array<{
    student: {
      id: string;
      admissionNo: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      gender: string;
    };
  }>;
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Student Class Subject API Client
 */
export const studentClassSubjectApi = {
  /**
   * Enroll a student in a specific subject
   */
  enrollStudentInSubject: async (data: {
    studentId: string;
    classSubjectId: string;
    enrollmentId: string;
    schoolId: string;
  }): Promise<StudentSubjectEnrollment> => {
    const response = await api.post(
      '/academic/student-class-subject/enroll',
      data
    );
    return response.data.data;
  },

  /**
   * Bulk enroll students in a subject
   */
  bulkEnrollStudentsInSubject: async (data: {
    enrollmentIds: string[];
    classSubjectId: string;
    schoolId: string;
  }): Promise<{ enrolled: number; failed: number; enrollments: StudentSubjectEnrollment[] }> => {
    const response = await api.post(
      '/academic/student-class-subject/bulk-enroll',
      data
    );
    return response.data.data;
  },

  /**
   * Drop a student from a subject
   */
  dropStudentFromSubject: async (data: {
    enrollmentId: string;
    classSubjectId: string;
    schoolId: string;
  }): Promise<StudentSubjectEnrollment> => {
    const response = await api.post(
      '/academic/student-class-subject/drop',
      data
    );
    return response.data.data;
  },

  /**
   * Get all subjects a student is enrolled in for a specific class enrollment
   */
  getStudentSubjectEnrollments: async (
    enrollmentId: string,
    params?: {
      status?: EnrollmentStatus;
    }
  ): Promise<{ data: StudentSubjectEnrollmentWithDetails[]; total: number }> => {
    const response = await api.get(
      '/academic/student-class-subject/enrollment/' + enrollmentId,
      { params }
    );
    return response.data.data;
  },

  /**
   * Get all subjects a student is enrolled in across all classes
   */
  getAllStudentSubjectEnrollments: async (
    studentId: string
  ): Promise<{ data: StudentSubjectEnrollmentWithDetails[]; total: number }> => {
    const response = await api.get(
      '/academic/student-class-subject/students/' + studentId
    );
    return response.data.data;
  },

  /**
   * Get students enrolled in a specific subject (roster for grade entry)
   */
  getStudentsEnrolledInSubject: async (
    classSubjectId: string,
    params?: {
      status?: EnrollmentStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<StudentSubjectRoster> => {
    const response = await api.get(
      '/academic/student-class-subject/subject-roster',
      { params: { classSubjectId, ...params } }
    );
    return response.data.data;
  },

  /**
   * Get enrollment count for a subject
   */
  getSubjectEnrollmentCount: async (
    classSubjectId: string,
    status?: EnrollmentStatus
  ): Promise<{ classSubjectId: string; count: number }> => {
    const response = await api.get(
      '/academic/student-class-subject/count',
      { params: { classSubjectId, status } }
    );
    return response.data.data;
  },

  /**
   * Update subject enrollment status
   */
  updateSubjectEnrollmentStatus: async (data: {
    enrollmentId: string;
    classSubjectId: string;
    schoolId: string;
    status: EnrollmentStatus;
  }): Promise<StudentSubjectEnrollment> => {
    const response = await api.patch(
      '/academic/student-class-subject/status',
      data
    );
    return response.data.data;
  },

  /**
   * Bulk update subject enrollment statuses
   */
  bulkUpdateSubjectStatus: async (data: {
    updates: Array<{
      enrollmentId: string;
      classSubjectId: string;
      status: EnrollmentStatus;
    }>;
    schoolId: string;
  }): Promise<{ updated: number; results: StudentSubjectEnrollment[] }> => {
    const response = await api.patch(
      '/academic/student-class-subject/bulk-status',
      data
    );
    return response.data.data;
  },
};
