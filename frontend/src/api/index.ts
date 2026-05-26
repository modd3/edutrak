import api from './client';
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
    api.get(`/students/class/${id}`),
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
    api.post('/assessments', data),

  getDefinition: (id: string) =>
    api.get(`/assessments/${id}`),

  getClassSubjectDefinitions: (classSubjectId: string) =>
    api.get(`/assessments/class-subject/${classSubjectId}`),

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
    api.get('/assessments/results', { params: { studentId, ...params } }),

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

export { feesApi } from './fees-api';
export { subscriptionsApi } from './subscriptions-api';
export { plansApi } from './plans-api';
export {billingAccountsApi} from './billing-accounts-api'

export default api;