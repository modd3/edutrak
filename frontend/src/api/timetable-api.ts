// src/api/timetable-api.ts
import api from '.';
import type {
  Timetable,
  TimetableDetail,
  Period,
  PeriodSlot,
  DayOfWeek,
} from '@/types';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateTimetableInput {
  academicYearId: string;
  termId?: string;
  classId: string;
  streamId?: string;
  name: string;
  effectiveFrom: string; // ISO datetime
  effectiveTo?: string;
}

export interface UpdateTimetableInput {
  name?: string;
  termId?: string | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
}

export interface CreatePeriodInput {
  name: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  orderIndex: number;
  isBreak?: boolean;
}

export interface UpdatePeriodInput extends Partial<CreatePeriodInput> {}

export interface UpsertSlotInput {
  periodId: string;
  dayOfWeek: DayOfWeek;
  classSubjectId?: string | null;
  teacherId?: string | null;
  room?: string | null;
  notes?: string | null;
}

export interface DeleteSlotInput {
  periodId: string;
  dayOfWeek: DayOfWeek;
}

export interface TimetableFilters {
  academicYearId?: string;
  termId?: string;
  classId?: string;
  isActive?: boolean;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const timetableApi = {
  // Timetables

  list: async (filters?: TimetableFilters): Promise<{ data: Timetable[] }> => {
    const params: Record<string, string> = {};
    if (filters?.academicYearId) params.academicYearId = filters.academicYearId;
    if (filters?.termId) params.termId = filters.termId;
    if (filters?.classId) params.classId = filters.classId;
    if (filters?.isActive !== undefined) params.isActive = String(filters.isActive);
    const res = await api.get('/timetables', { params });
    return res.data;
  },

  getById: async (id: string): Promise<{ data: TimetableDetail }> => {
    const res = await api.get(`/timetables/${id}`);
    return res.data;
  },

  getActiveForClass: async (classId: string, streamId?: string): Promise<{ data: TimetableDetail }> => {
    const res = await api.get(`/timetables/class/${classId}/active`, {
      params: streamId ? { streamId } : {},
    });
    return res.data;
  },

  getTeacherSchedule: async (teacherId: string): Promise<{ data: PeriodSlot[] }> => {
    const res = await api.get(`/timetables/teacher/${teacherId}/schedule`);
    return res.data;
  },

  create: async (data: CreateTimetableInput): Promise<{ data: Timetable }> => {
    const res = await api.post('/timetables', data);
    return res.data;
  },

  update: async (id: string, data: UpdateTimetableInput): Promise<{ data: Timetable }> => {
    const res = await api.patch(`/timetables/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/timetables/${id}`);
  },

  // Periods

  createPeriod: async (timetableId: string, data: CreatePeriodInput): Promise<{ data: Period }> => {
    const res = await api.post(`/timetables/${timetableId}/periods`, data);
    return res.data;
  },

  updatePeriod: async (timetableId: string, periodId: string, data: UpdatePeriodInput): Promise<{ data: Period }> => {
    const res = await api.patch(`/timetables/${timetableId}/periods/${periodId}`, data);
    return res.data;
  },

  deletePeriod: async (timetableId: string, periodId: string): Promise<void> => {
    await api.delete(`/timetables/${timetableId}/periods/${periodId}`);
  },

  // Slots

  upsertSlot: async (timetableId: string, data: UpsertSlotInput): Promise<{ data: PeriodSlot }> => {
    const res = await api.put(`/timetables/${timetableId}/slots`, data);
    return res.data;
  },

  deleteSlot: async (timetableId: string, data: DeleteSlotInput): Promise<void> => {
    await api.delete(`/timetables/${timetableId}/slots`, { data });
  },
};
