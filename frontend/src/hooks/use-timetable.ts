// src/hooks/use-timetable.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  timetableApi,
  type CreateTimetableInput,
  type UpdateTimetableInput,
  type CreatePeriodInput,
  type UpdatePeriodInput,
  type UpsertSlotInput,
  type DeleteSlotInput,
  type TimetableFilters,
} from '@/api/timetable-api';

// ─── Query keys ───────────────────────────────────────────────────────────────
export const timetableKeys = {
  all: ['timetables'] as const,
  lists: () => [...timetableKeys.all, 'list'] as const,
  list: (filters?: TimetableFilters) => [...timetableKeys.lists(), filters] as const,
  details: () => [...timetableKeys.all, 'detail'] as const,
  detail: (id: string) => [...timetableKeys.details(), id] as const,
  activeForClass: (classId: string, streamId?: string) =>
    [...timetableKeys.all, 'active', classId, streamId ?? ''] as const,
  teacherSchedule: (teacherId: string) =>
    [...timetableKeys.all, 'teacher', teacherId] as const,
};

// ─── Timetable queries ────────────────────────────────────────────────────────

export function useTimetables(filters?: TimetableFilters) {
  return useQuery({
    queryKey: timetableKeys.list(filters),
    queryFn: () => timetableApi.list(filters),
    select: (res) => res.data,
  });
}

export function useTimetable(id: string) {
  return useQuery({
    queryKey: timetableKeys.detail(id),
    queryFn: () => timetableApi.getById(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useActiveTimetableForClass(classId: string, streamId?: string) {
  return useQuery({
    queryKey: timetableKeys.activeForClass(classId, streamId),
    queryFn: () => timetableApi.getActiveForClass(classId, streamId),
    enabled: !!classId,
    select: (res) => res.data,
  });
}

export function useTeacherSchedule(teacherId: string) {
  return useQuery({
    queryKey: timetableKeys.teacherSchedule(teacherId),
    queryFn: () => timetableApi.getTeacherSchedule(teacherId),
    enabled: !!teacherId,
    select: (res) => res.data,
  });
}

// ─── Timetable mutations ──────────────────────────────────────────────────────

export function useCreateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimetableInput) => timetableApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.lists() });
      toast.success('Timetable created successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create timetable');
    },
  });
}

export function useUpdateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimetableInput }) =>
      timetableApi.update(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: timetableKeys.lists() });
      qc.invalidateQueries({ queryKey: timetableKeys.detail(id) });
      toast.success('Timetable updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update timetable');
    },
  });
}

export function useDeleteTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.lists() });
      toast.success('Timetable deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete timetable');
    },
  });
}

// ─── Period mutations ─────────────────────────────────────────────────────────

export function useCreatePeriod(timetableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePeriodInput) => timetableApi.createPeriod(timetableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.detail(timetableId) });
      toast.success('Period added');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to add period');
    },
  });
}

export function useUpdatePeriod(timetableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, data }: { periodId: string; data: UpdatePeriodInput }) =>
      timetableApi.updatePeriod(timetableId, periodId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.detail(timetableId) });
      toast.success('Period updated');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to update period');
    },
  });
}

export function useDeletePeriod(timetableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => timetableApi.deletePeriod(timetableId, periodId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.detail(timetableId) });
      toast.success('Period deleted');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete period');
    },
  });
}

// ─── Slot mutations ───────────────────────────────────────────────────────────

export function useUpsertSlot(timetableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertSlotInput) => timetableApi.upsertSlot(timetableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.detail(timetableId) });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save slot');
    },
  });
}

export function useDeleteSlot(timetableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DeleteSlotInput) => timetableApi.deleteSlot(timetableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: timetableKeys.detail(timetableId) });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to clear slot');
    },
  });
}
