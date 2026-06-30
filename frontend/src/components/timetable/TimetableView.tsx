// src/components/timetable/TimetableView.tsx
//
// Read-only week grid.  Shows all periods (rows) × weekdays (columns).
// Accepts a TimetableDetail (already fetched) and renders the grid.
// Used by TeacherDashboard, StudentDashboard, and the admin TimetablePage.
//
import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimetableDetail, Period, PeriodSlot, DayOfWeek } from '@/types';

// Days we actually render (Mon–Fri is default; Sat/Sun shown only if slots exist)
const WEEKDAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

// Colour palette cycling through subjects for visual variety
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

// Deterministically pick a colour based on subject name
function slotColour(subjectName: string): string {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = (hash * 31 + subjectName.charCodeAt(i)) & 0xffff;
  }
  return SLOT_COLOURS[hash % SLOT_COLOURS.length];
}

// Build a lookup: periodId → dayOfWeek → PeriodSlot
function buildSlotMap(
  periods: Period[]
): Map<string, Map<DayOfWeek, PeriodSlot>> {
  const map = new Map<string, Map<DayOfWeek, PeriodSlot>>();
  for (const period of periods) {
    const dayMap = new Map<DayOfWeek, PeriodSlot>();
    for (const slot of period.slots ?? []) {
      dayMap.set(slot.dayOfWeek, slot);
    }
    map.set(period.id, dayMap);
  }
  return map;
}

// Which days actually have any slots? (to decide whether to add Sat/Sun)
function activeDays(periods: Period[]): DayOfWeek[] {
  const found = new Set<DayOfWeek>(WEEKDAYS);
  for (const p of periods) {
    for (const s of p.slots ?? []) {
      found.add(s.dayOfWeek);
    }
  }
  // Keep ordered: Mon…Sun, filtered to only days that have data
  const order: DayOfWeek[] = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
  ];
  return order.filter((d) => found.has(d));
}

// ─── SlotCell ─────────────────────────────────────────────────────────────────

interface SlotCellProps {
  slot: PeriodSlot | undefined;
  isBreak: boolean;
}

function SlotCell({ slot, isBreak }: SlotCellProps) {
  if (isBreak) {
    return (
      <div className="flex items-center justify-center h-full min-h-[52px] text-slate-400">
        <Coffee size={14} className="mr-1 opacity-60" />
        <span className="text-xs italic">Break</span>
      </div>
    );
  }

  if (!slot?.classSubject?.subject) {
    return (
      <div className="h-full min-h-[52px] rounded border border-dashed border-slate-200 bg-slate-50" />
    );
  }

  const subjectName = slot.classSubject.subject.name;
  const teacherUser = slot.classSubject.teacherProfile?.user ?? slot.teacher?.user;
  const teacherName = teacherUser
    ? `${teacherUser.firstName} ${teacherUser.lastName}`
    : null;

  const colourCls = slotColour(subjectName);

  return (
    <div
      className={cn(
        'rounded border p-1.5 h-full min-h-[52px] flex flex-col justify-between',
        colourCls
      )}
    >
      <p className="text-xs font-semibold leading-tight truncate">{subjectName}</p>
      {slot.room && (
        <p className="text-[10px] opacity-70 truncate">{slot.room}</p>
      )}
      {teacherName && (
        <p className="text-[10px] opacity-60 truncate">{teacherName}</p>
      )}
    </div>
  );
}

// ─── TimetableView ────────────────────────────────────────────────────────────

interface TimetableViewProps {
  timetable: TimetableDetail;
  /** Highlight a specific day column (e.g. today) */
  highlightDay?: DayOfWeek;
  className?: string;
}

export function TimetableView({ timetable, highlightDay, className }: TimetableViewProps) {
  const { periods } = timetable;

  if (!periods || periods.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
        No periods have been configured for this timetable yet.
      </div>
    );
  }

  const days = activeDays(periods);
  const slotMap = buildSlotMap(periods);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {/* Period label column */}
            <th className="sticky left-0 z-10 bg-white dark:bg-slate-900 text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200 dark:border-slate-700 w-28 min-w-[7rem]">
              Period
            </th>
            {days.map((day) => (
              <th
                key={day}
                className={cn(
                  'px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 min-w-[100px]',
                  highlightDay === day
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <span className="hidden sm:inline">{DAY_LABELS_FULL[day]}</span>
                <span className="sm:hidden">{DAY_LABELS[day]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const dayMap = slotMap.get(period.id);
            return (
              <tr
                key={period.id}
                className={cn(
                  'border-b border-slate-100 dark:border-slate-800',
                  period.isBreak && 'bg-slate-50 dark:bg-slate-800/40'
                )}
              >
                {/* Period label */}
                <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2 border-r border-slate-200 dark:border-slate-700 align-top">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {period.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {period.startTime} – {period.endTime}
                  </p>
                </td>
                {days.map((day) => (
                  <td
                    key={day}
                    className={cn(
                      'px-1.5 py-1.5 align-top',
                      highlightDay === day &&
                        'bg-blue-50/50 dark:bg-blue-900/10'
                    )}
                  >
                    <SlotCell
                      slot={dayMap?.get(day)}
                      isBreak={period.isBreak}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
