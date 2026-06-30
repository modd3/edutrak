// src/pages/timetable/TimetablePage.tsx
import { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
  Clock,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { DayOfWeek, Period, PeriodSlot, Timetable, TimetableDetail } from '@/types';
import type { CreateTimetableInput, UpsertSlotInput } from '@/api/timetable-api';
import {
  useTimetables,
  useTimetable,
  useCreateTimetable,
  useUpdateTimetable,
  useDeleteTimetable,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
  useUpsertSlot,
  useDeleteSlot,
} from '@/hooks/use-timetable';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TimetableFormModal } from '@/components/timetable/TimetableFormModal';
import { PeriodFormModal } from '@/components/timetable/PeriodFormModal';
import { SlotEditorModal } from '@/components/timetable/SlotEditorModal';
import { TimetableView } from '@/components/timetable/TimetableView';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlotTarget {
  period: Period;
  day: DayOfWeek;
  existing: PeriodSlot | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const SLOT_COLOURS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-teal-50 border-teal-200 text-teal-800',
];

function subjectColour(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return SLOT_COLOURS[h % SLOT_COLOURS.length];
}

// ─── EditableGrid ─────────────────────────────────────────────────────────────
// Inline editable timetable grid — clicking a cell opens SlotEditorModal.

interface EditableGridProps {
  timetable: TimetableDetail;
  canEdit: boolean;
  onCellClick: (target: SlotTarget) => void;
}

function EditableGrid({ timetable, canEdit, onCellClick }: EditableGridProps) {
  const { periods } = timetable;
  if (!periods.length) {
    return (
      <p className="text-slate-400 text-sm py-8 text-center">
        No periods yet. Add periods below to start building the grid.
      </p>
    );
  }

  // Build periodId → day → slot lookup
  const slotMap = useMemo(() => {
    const m = new Map<string, Map<DayOfWeek, PeriodSlot>>();
    for (const p of periods) {
      const dm = new Map<DayOfWeek, PeriodSlot>();
      for (const s of p.slots ?? []) dm.set(s.dayOfWeek, s);
      m.set(p.id, dm);
    }
    return m;
  }, [periods]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200 dark:border-slate-700 w-28">
              Period
            </th>
            {WEEKDAYS.map((day) => (
              <th key={day} className="px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 min-w-[110px]">
                {DAY_SHORT[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const dayMap = slotMap.get(period.id);
            return (
              <tr key={period.id} className={cn(
                'border-b border-slate-100 dark:border-slate-800',
                period.isBreak && 'bg-slate-50/70 dark:bg-slate-800/30'
              )}>
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2 border-r border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-xs text-slate-800 dark:text-slate-200">{period.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{period.startTime}–{period.endTime}</p>
                  {period.isBreak && (
                    <span className="text-[10px] text-amber-500 font-medium">Break</span>
                  )}
                </td>
                {WEEKDAYS.map((day) => {
                  const slot = dayMap?.get(day);
                  const subject = slot?.classSubject?.subject;
                  const teacherUser = slot?.classSubject?.teacherProfile?.user ?? slot?.teacher?.user;

                  if (period.isBreak) {
                    return (
                      <td key={day} className="px-1.5 py-1.5">
                        <div className="h-12 flex items-center justify-center text-xs text-slate-400 italic">—</div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="px-1.5 py-1.5">
                      <button
                        onClick={() => canEdit && onCellClick({ period, day, existing: slot ?? null })}
                        className={cn(
                          'w-full h-12 rounded border text-left px-2 py-1 flex flex-col justify-between transition-all',
                          canEdit && 'hover:opacity-80 hover:shadow-sm cursor-pointer',
                          !canEdit && 'cursor-default',
                          subject
                            ? subjectColour(subject.name)
                            : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-slate-600'
                        )}
                        type="button"
                        disabled={!canEdit}
                      >
                        {subject ? (
                          <>
                            <span className="text-[11px] font-semibold truncate leading-tight">{subject.name}</span>
                            {slot?.room && <span className="text-[9px] opacity-70 truncate">{slot.room}</span>}
                            {teacherUser && (
                              <span className="text-[9px] opacity-60 truncate">
                                {teacherUser.firstName} {teacherUser.lastName}
                              </span>
                            )}
                          </>
                        ) : (
                          canEdit && <span className="text-[10px] text-slate-300 dark:text-slate-600 m-auto">+ add</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── PeriodRow ────────────────────────────────────────────────────────────────

interface PeriodRowProps {
  period: Period;
  onEdit: () => void;
  onDelete: () => void;
}

function PeriodRow({ period, onEdit, onDelete }: PeriodRowProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{period.name}</p>
          <p className="text-xs text-slate-400">{period.startTime} – {period.endTime}</p>
        </div>
        {period.isBreak && (
          <Badge variant="outline" className="text-[10px] ml-1">break</Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Pencil size={13} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onDelete}>
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

// ─── TimetablePage ────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const { schoolId } = useSchoolContext();
  const { hasAccess: canManage } = useAuthGuard({ requiredRoles: ['SUPER_ADMIN', 'ADMIN'] });

  // ── list state ──
  const { data: timetables = [], isLoading: listLoading } = useTimetables();

  // ── selected timetable (drill-in) ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isLoading: detailLoading } = useTimetable(selectedId ?? '');

  // ── modals ──
  const [showTTForm, setShowTTForm] = useState(false);
  const [editingTT, setEditingTT] = useState<Timetable | null>(null);
  const [deletingTTId, setDeletingTTId] = useState<string | null>(null);

  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [deletingPeriodId, setDeletingPeriodId] = useState<string | null>(null);

  const [slotTarget, setSlotTarget] = useState<SlotTarget | null>(null);

  // ── mutations ──
  const createTT = useCreateTimetable();
  const updateTT = useUpdateTimetable();
  const deleteTT = useDeleteTimetable();
  const createPeriod = useCreatePeriod(selectedId ?? '');
  const updatePeriod = useUpdatePeriod(selectedId ?? '');
  const deletePeriod = useDeletePeriod(selectedId ?? '');
  const upsertSlot = useUpsertSlot(selectedId ?? '');
  const deleteSlot = useDeleteSlot(selectedId ?? '');

  // ── class-subject options for slot editor ──
  const classSubjectOptions = useMemo(() => {
    if (!detail) return [];
    // Gather all classSubjects referenced in slots + from periods
    const seen = new Map<string, { id: string; label: string }>();
    for (const p of detail.periods) {
      for (const s of p.slots ?? []) {
        if (s.classSubject?.id && s.classSubject.subject) {
          const cs = s.classSubject;
          const teacher = cs.teacherProfile?.user;
          seen.set(cs.id, {
            id: cs.id,
            label: teacher
              ? `${cs.subject!.name} — ${teacher.firstName} ${teacher.lastName}`
              : cs.subject!.name,
          });
        }
      }
    }
    return Array.from(seen.values());
  }, [detail]);

  // ── handlers ──
  const handleCreateTT = (data: CreateTimetableInput) => {
    createTT.mutate(data, { onSuccess: () => setShowTTForm(false) });
  };

  const handleUpdateTT = (data: CreateTimetableInput) => {
    if (!editingTT) return;
    updateTT.mutate(
      { id: editingTT.id, data: { ...data, termId: data.termId ?? null } },
      { onSuccess: () => { setShowTTForm(false); setEditingTT(null); } }
    );
  };

  const handleDeleteTT = () => {
    if (!deletingTTId) return;
    deleteTT.mutate(deletingTTId, {
      onSuccess: () => {
        setDeletingTTId(null);
        if (selectedId === deletingTTId) setSelectedId(null);
      },
    });
  };

  const handleSavePeriod = (data: any) => {
    if (editingPeriod) {
      updatePeriod.mutate(
        { periodId: editingPeriod.id, data },
        { onSuccess: () => { setShowPeriodForm(false); setEditingPeriod(null); } }
      );
    } else {
      createPeriod.mutate(data, { onSuccess: () => setShowPeriodForm(false) });
    }
  };

  const handleDeletePeriod = () => {
    if (!deletingPeriodId) return;
    deletePeriod.mutate(deletingPeriodId, {
      onSuccess: () => setDeletingPeriodId(null),
    });
  };

  const handleSaveSlot = (data: UpsertSlotInput) => {
    upsertSlot.mutate(data, { onSuccess: () => setSlotTarget(null) });
  };

  const handleClearSlot = () => {
    if (!slotTarget?.existing) return;
    deleteSlot.mutate(
      { periodId: slotTarget.period.id, dayOfWeek: slotTarget.day },
      { onSuccess: () => setSlotTarget(null) }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — List view
  // ─────────────────────────────────────────────────────────────────────────────
  if (!selectedId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              Timetables
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage class schedules and period configurations.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => { setEditingTT(null); setShowTTForm(true); }} className="gap-2">
              <Plus size={16} /> New Timetable
            </Button>
          )}
        </div>

        {/* Grid of timetable cards */}
        {listLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : timetables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <LayoutGrid size={40} className="opacity-30" />
            <p className="text-sm">No timetables yet.</p>
            {canManage && (
              <Button variant="outline" size="sm" onClick={() => setShowTTForm(true)}>
                Create your first timetable
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetables.map((tt) => (
              <div
                key={tt.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedId(tt.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{tt.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tt.class?.name}{tt.stream ? ` › ${tt.stream.name}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {tt.academicYear?.year} {tt.term ? `· ${tt.term.name.replace('_', ' ')}` : ''}
                    </p>
                  </div>
                  <Badge variant={tt.isActive ? 'default' : 'secondary'} className="ml-2 shrink-0">
                    {tt.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span>{tt._count?.periods ?? 0} periods</span>
                  <span>·</span>
                  <span>{tt._count?.slots ?? 0} slots filled</span>
                </div>
                {canManage && (
                  <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm" variant="ghost" className="h-7 text-xs gap-1"
                      onClick={() => { setEditingTT(tt); setShowTTForm(true); }}
                    >
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1 text-slate-500 hover:text-slate-700"
                      onClick={() => updateTT.mutate({ id: tt.id, data: { isActive: !tt.isActive } })}
                    >
                      {tt.isActive
                        ? <><ToggleRight size={12} className="text-green-500" /> Deactivate</>
                        : <><ToggleLeft size={12} /> Activate</>
                      }
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 text-xs gap-1 text-red-500 hover:text-red-600"
                      onClick={() => setDeletingTTId(tt.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <TimetableFormModal
          open={showTTForm}
          onClose={() => { setShowTTForm(false); setEditingTT(null); }}
          onSubmit={editingTT ? handleUpdateTT : handleCreateTT}
          isLoading={createTT.isPending || updateTT.isPending}
          existing={editingTT}
        />

        <AlertDialog open={!!deletingTTId} onOpenChange={(o) => !o && setDeletingTTId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete timetable?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the timetable and all its periods and slot assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTT} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — Detail / editor view
  // ─────────────────────────────────────────────────────────────────────────────
  if (detailLoading || !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const nextOrderIndex = detail.periods.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
          <ChevronLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            {detail.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {detail.class?.name}{detail.stream ? ` › ${detail.stream.name}` : ''} ·{' '}
            {detail.academicYear?.year}{detail.term ? ` · ${detail.term.name.replace('_', ' ')}` : ''}
          </p>
        </div>
        <Badge variant={detail.isActive ? 'default' : 'secondary'}>
          {detail.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Editable grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
            <LayoutGrid size={15} /> Weekly Schedule
          </h2>
          {canManage && (
            <p className="text-xs text-slate-400 italic">Click any cell to assign a subject</p>
          )}
        </div>
        <EditableGrid
          timetable={detail}
          canEdit={canManage}
          onCellClick={setSlotTarget}
        />
      </div>

      {/* Period management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
            <Clock size={15} /> Periods
          </h2>
          {canManage && (
            <Button
              size="sm" variant="outline" className="gap-1 h-7 text-xs"
              onClick={() => { setEditingPeriod(null); setShowPeriodForm(true); }}
            >
              <Plus size={13} /> Add Period
            </Button>
          )}
        </div>

        {detail.periods.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            No periods yet. Add time blocks to define your school day.
          </p>
        ) : (
          <div className="space-y-1.5">
            {detail.periods.map((p) => (
              <PeriodRow
                key={p.id}
                period={p}
                onEdit={() => { setEditingPeriod(p); setShowPeriodForm(true); }}
                onDelete={() => setDeletingPeriodId(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PeriodFormModal
        open={showPeriodForm}
        onClose={() => { setShowPeriodForm(false); setEditingPeriod(null); }}
        onSubmit={handleSavePeriod}
        isLoading={createPeriod.isPending || updatePeriod.isPending}
        existing={editingPeriod}
        nextOrderIndex={nextOrderIndex}
      />

      <SlotEditorModal
        open={!!slotTarget}
        onClose={() => setSlotTarget(null)}
        onSave={handleSaveSlot}
        onClear={slotTarget?.existing ? handleClearSlot : undefined}
        isLoading={upsertSlot.isPending || deleteSlot.isPending}
        period={slotTarget?.period ?? null}
        day={slotTarget?.day ?? null}
        existingSlot={slotTarget?.existing}
        classSubjectOptions={classSubjectOptions}
      />

      <AlertDialog open={!!deletingPeriodId} onOpenChange={(o) => !o && setDeletingPeriodId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete period?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the period and clear all slot assignments for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePeriod} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
