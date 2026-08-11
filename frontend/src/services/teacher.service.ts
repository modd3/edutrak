import api from '@/api';
import { Teacher, ApiResponse, PaginatedResponse } from '@/types';

interface CreateTeacherUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  idNumber?: string;
  role?: string;
  schoolId?: string;
  tscNumber?: string;
  employeeNumber?: string;
  employmentType?: string;
  qualification?: string;
  specialization?: string;
  dateJoined?: string | Date;
}

export const teacherService = {
  getAll: async (params?: {
    schoolId?: string;
    employmentType?: string;
    search?: string;
    page?: number,
    limit?: number
  }): Promise<PaginatedResponse<Teacher>> => {
    const response = await api.get<PaginatedResponse<Teacher>>('/teachers', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await api.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    return response.data.data!;
  },

  create: async (data: Partial<Teacher>): Promise<Teacher> => {
    const response = await api.post<ApiResponse<Teacher>>('/teachers', data);
    return response.data.data!;
  },

  create_user: async (data: CreateTeacherUserData): Promise<Teacher> => {
    // Delegate to UserCreationService via POST /api/users
    // Teacher+User creation is now handled exclusively by UserCreationService
    const response = await api.post<ApiResponse<Teacher>>('/users', {
      user: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        idNumber: data.idNumber,
        role: 'TEACHER',
        schoolId: data.schoolId,
      },
      profile: {
        tscNumber: data.tscNumber,
        employeeNumber: data.employeeNumber,
        employmentType: data.employmentType,
        qualification: data.qualification,
        specialization: data.specialization,
        dateJoined: data.dateJoined,
      },
    });
    return response.data.data!;
  },

  update: async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    const response = await api.put<ApiResponse<Teacher>>(`/teachers/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },

  assignSubjects: async (teacherId: string, subjectIds: string[]): Promise<void> => {
    await api.post(`/teachers/${teacherId}/subjects`, { subjectIds });
  },

  assignSubjectToClass: async (data: {
    teacherId: string;
    classId: string;
    subjectId: string;
    termId: string;
    academicYearId: string;
  }): Promise<any> => {
    const response = await api.post('/teachers/assign-subject', data);
    return response.data?.data || response.data;
  },

  getWorkload: async (teacherId: string): Promise<any> => {
    const response = await api.get(`/teachers/${teacherId}/workload`);
    return response.data.data;
  },
};