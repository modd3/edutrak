import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth-store';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds (increased from 30s to account for email sending)
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
  
        try {
          const refreshToken = useAuthStore.getState().refreshToken;
  
          if (refreshToken) {
            // Try to refresh token
            const response = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
              { refreshToken }
            );
  
            if (response.data.success) {
              const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
  
              // Update tokens in store
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                useAuthStore.getState().setAuth(currentUser, newToken, newRefreshToken);
              }
  
              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed - logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: any) =>
    api.post('/auth/register', data),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  requestPasswordReset: (email: string) =>
    api.post('/auth/request-password-reset', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),

  getProfile: () =>
    api.get('/auth/profile'),
};


export const studentsApi = {
    getAll: (params?: any) =>
      api.get('/students', { params }),
  
    getById: (id: string) =>
      api.get(`/students/${id}`),
  
    create: (data: any) =>
      api.post('/students', data),
  
    update: (id: string, data: any) =>
      api.put(`/students/${id}`, data),
  
    delete: (id: string) =>
      api.delete(`/students/${id}`),
  
    enroll: (data: any) =>
      api.post('/students/enroll', data),

    updateEnrollment: (id: string ,data: any) =>
      api.put(`/students/enrollment/${id}`, data),
  
    promote: (data: any) =>
      api.post('/students/promote', data),
  };
  
export const teachersApi = {
    getAll: (params?: any) =>
      api.get('/teachers', { params }),
  
    getById: (id: string) =>
      api.get(`/teachers/${id}`),
  
    create: (data: any) =>
      api.post('/teachers', data),
  
    update: (id: string, data: any) =>

        api.put(`/teachers/${id}`, data),

  delete: (id: string) =>
    api.delete(`/teachers/${id}`),

  assignSubject: (data: any) =>
    api.post('/teachers/assign-subject', data),
};

export const classesApi = {
  getAll: (params?: any) =>
    api.get('/classes', { params }),

  getById: (id: string) =>
    api.get(`/classes/${id}`),

  create: (data: any) =>
    api.post('/classes', data),

  update: (id: string, data: any) =>
    api.put(`/classes/${id}`, data),

  delete: (id: string) =>
    api.delete(`/classes/${id}`),

  getStudents: (id: string) =>
    api.get(`/classes/${id}/students`),
};

export const subjectsApi = {
  getAll: (params?: any) => 
    api.get('/subjects', { params }),
    
  getById: (id: string) => 
    api.get(`/subjects/${id}`),
};

export const classSubjectsApi = {
  // Assign a subject to a class
  assign: (data: {
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId: string;
    teacherId?: string;
    streamId?: string; // Optional
    subjectCategory: string; // 'CORE' | 'ELECTIVE' etc.
  }) => api.post('/academic/class-subject', data),

  // Assign/Update a teacher for an existing class subject
  assignTeacher: (classSubjectId: string, teacherId: string) =>
    api.patch(`/academic/class-subject/${classSubjectId}/teacher`, { teacherId }),

  // Get subjects for a specific class
  getByClass: (classId: string, params: { academicYearId: string; termId: string }) =>
    api.get(`/academic/class-subject/class/${classId}`, { params }),
};

export const assessmentsApi = {
  // Assessment Definitions
  createDefinition: (data: any) =>
    api.post('/assessments/definitions', data),

  getDefinition: (id: string) =>
    api.get(`/assessments/definitions/${id}`),

  getClassSubjectDefinitions: (classSubjectId: string) =>
    api.get(`/assessments/definitions/class-subject/${classSubjectId}`),

  // Assessment Results
  createResult: (data: any) =>
    api.post('/assessments/results', data),

  createBulkResults: (results: any[]) =>
    api.post('/assessments/results/bulk', { results }),

  getResult: (id: string) =>
    api.get(`/assessments/results/${id}`),

  updateResult: (id: string, data: any) =>
    api.put(`/assessments/results/${id}`, data),

  getStudentResults: (studentId: string, params?: any) =>
    api.get(`/assessments/results/student/${studentId}`, { params }),

  // Statistics
  getStudentTermAverage: (studentId: string, termId: string) =>
    api.get(`/assessments/statistics/student/${studentId}/term/${termId}`),

  getClassSubjectStatistics: (classSubjectId: string, termId?: string) =>
    api.get(`/assessments/statistics/class-subject/${classSubjectId}`, {
      params: { termId },
    }),

  generateTermReport: (studentId: string, termId: string) =>
    api.get(`/assessments/reports/student/${studentId}/term/${termId}`),
};

export const reportsApi = {
  getPerformance: (params?: any) =>
    api.get('/reports/performance', { params }),

  getTermReport: (params?: any) =>
    api.get('/reports/term', { params }),

  getClassAnalysis: (classId: string) =>
    api.get(`/reports/class-analysis/${classId}`),
};

export const usersApi = {
  getAll: (params?: any) =>
    api.get('/users', { params }),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  create: (data: any) =>
    api.post('/users', data),

  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),

  activate: (id: string) =>
    api.post(`/users/${id}/activate`),

  deactivate: (id: string) =>
    api.post(`/users/${id}/deactivate`),
};

export default api;