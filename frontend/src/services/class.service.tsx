import apiClient from '@/lib/api-client';
import { 
  Class, Stream, ClassSubject, ApiResponse, PaginatedResponse, 
  Curriculum, SubjectOffering 
} from '@/types';

// --- Class Types ---
export type ClassCreateInput = Omit<Class, 'id' | 'createdAt' | 'updatedAt' | 'streams' | 'classSubjects' | 'school'>;
export type ClassUpdateInput = Partial<ClassCreateInput>;

// --- Stream Types ---
export type StreamCreateInput = Omit<Stream, 'id' | 'createdAt' | 'updatedAt' | 'class' | 'school' | 'enrollments'>;

// --- ClassSubject Types (linking a stream to a subject) ---
export type ClassSubjectCreateInput = Omit<ClassSubject, 'id' | 'createdAt' | 'updatedAt' | 'class' | 'stream' | 'subjectOffering' | 'assessments'>;


export const classService = {
  // === Class Endpoints (Grade 1, Form 4, etc.) ===

  /**
   * Fetches all classes for a given school.
   */
  getAllClasses: async (schoolId: string): Promise<Class[]> => {
    const response = await apiClient.get<ApiResponse<Class[]>>(`/schools/${schoolId}/classes`);
    return response.data.data || [];
  },

  /**
   * Fetches a single class by ID.
   */
  getClassById: async (id: string): Promise<Class> => {
    const response = await apiClient.get<ApiResponse<Class>>(`/classes/${id}`);
    return response.data.data!;
  },
  
  /**
   * Creates a new class (e.g., Grade 1).
   */
  createClass: async (data: ClassCreateInput): Promise<Class> => {
    const response = await apiClient.post<ApiResponse<Class>>('/classes', data);
    return response.data.data!;
  },

  /**
   * Deletes a class.
   */
  deleteClass: async (id: string): Promise<void> => {
    await apiClient.delete(`/classes/${id}`);
  },

  // === Stream Endpoints (Grade 1 A, Form 4 North, etc.) ===

  /**
   * Fetches all streams for a specific class.
   */
  getStreamsByClass: async (classId: string): Promise<Stream[]> => {
    const response = await apiClient.get<ApiResponse<Stream[]>>(`/classes/${classId}/streams`);
    return response.data.data || [];
  },

  /**
   * Creates a new stream for a class.
   */
  createStream: async (data: StreamCreateInput): Promise<Stream> => {
    const response = await apiClient.post<ApiResponse<Stream>>('/streams', data);
    return response.data.data!;
  },

  /**
   * Deletes a stream.
   */
  deleteStream: async (id: string): Promise<void> => {
    await apiClient.delete(`/streams/${id}`);
  },

  // === ClassSubject Endpoints (Linking Stream/Class to Subject) ===

  /**
   * Fetches all subjects taught in a specific class.
   */
  getClassSubjects: async (classId: string): Promise<ClassSubject[]> => {
    const response = await apiClient.get<ApiResponse<ClassSubject[]>>(`/classes/${classId}/subjects`);
    return response.data.data || [];
  },

  /**
   * Adds a subject to a class (creates a ClassSubject).
   * Note: This usually only requires classId and subjectOfferingId.
   */
  addClassSubject: async (data: ClassSubjectCreateInput): Promise<ClassSubject> => {
    const response = await apiClient.post<ApiResponse<ClassSubject>>('/class-subjects', data);
    return response.data.data!;
  },

  /**
   * Removes a subject from a class (deletes a ClassSubject).
   */
  removeClassSubject: async (id: string): Promise<void> => {
    await apiClient.delete(`/class-subjects/${id}`);
  },
};