// src/components/timetable/TimetableWidget.tsx
//
// Compact timetable widget for dashboards.
// - Teacher variant: shows "My Schedule" across all active timetables (teacher-centric slots)
// - Student variant: shows the weekly grid for a given class/stream
// - Admin variant: shows any teacher's schedule
//
import { useMemo, useState } from 'react';
import { Calendar, Clock, ExternalLink, Coffee, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeacherSchedule, useActiveTimetableForClass } from '@/hooks/use-timetable';
import { DayOfWeek } from '@/types';
import type { PeriodSlot } from '@/types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY];

const DAY_LABEL: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Mon', [DayOfWeek.TUESDAY]: 'Tue', [DayOfWeek.WEDNESDAY]: 'Wed',
  [DayOfWeek.THURSDAY]: 'Thu', [DayOfWeek.FRIDAY]: 'Fri', [DayOfWeek.SATURDAY]: 'Sat', [DayOfWeek.SUNDAY]: 'Sun',
};

const DAY_FULL: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday', [DayOfWeek.TUESDAY]: 'Tuesday', [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday', [DayOfWeek.FRIDAY]: 'Friday', [DayOfWeek.SATURDAY]: 'Saturday', [DayOfWeek.SUNDAY]: 'Sunday',
};

function todayDow(): DayOfWeek {
  const d = new Date().getDay(); // 0 = Sun
  const map: Record<number, DayOfWeek> = {
    1: DayOfWeek.MONDAY, 2: DayOfWeek.TUESDAY, 3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY, 5: DayOfWeek.FRIDAY, 6: DayOfWeek.SATURDAY, 0: DayOfWeek.SUNDAY,
  };
  return map[d] ?? 'MONDAY';
}

const SLOT_COLOURS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-teal-100 text-teal-800 border-teal-200',
];

function subjectColour(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return SLOT_COLOURS[h % SLOT_COLOURS.length];
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hh = hours % 12 || 12;
  return `${hh}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// ─── TeacherTodayCard ─────────────────────────────────────────────────────────

interface TeacherLessonItem {
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
  streamName?: string;
  teacherName?: string;
  room?: string;
  studentCount?: number;
  isBreak?: boolean;
}

function TeacherTodayCard({ item }: { item: TeacherLessonItem }) {
  if (item.isBreak) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <Coffee size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
            {item.periodName}
          </p>
          <p className="text-xs text-slate-400">{item.startTime} – {item.endTime}</p>
        </div>
      </div>
    );
  }

  const colourCls = subjectColour(item.subjectName);

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl border', colourCls)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {item.className}
            {item.streamName && <span className="text-slate-500 font-normal"> › {item.streamName}</span>}
          </p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
          {item.subjectName}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          {item.periodName} · {formatTime(item.startTime)}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {item.studentCount !== undefined && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Users size={10} />
            {item.studentCount} students
          </Badge>
        )}
        {item.room && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
            <Clock size={8} />
            {item.room}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── StudentTodayCard ─────────────────────────────────────────────────────────

interface StudentLessonItem {
  periodName: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
  room?: string;
  isBreak?: boolean;
}

function StudentTodayCard({ item }: { item: StudentLessonItem }) {
  if (item.isBreak) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <Coffee size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
            {item.periodName}
          </p>
          <p className="text-xs text-slate-400">{item.startTime} – {item.endTime}</p>
        </div>
      </div>
    );
  }

  const colourCls = subjectColour(item.subjectName);

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl border', colourCls)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.subjectName}</p>
        <p className="text-xs opacity-70 mb-0.5">
          {item.periodName} · {formatTime(item.startTime)}
        </p>
        {item.teacherName && (
          <p className="text-[10px] opacity-60">{item.teacherName}</p>
        )}
      </div>
      {item.room && (
        <span className="shrink-0 text-[10px] opacity-60 flex items-center gap-0.5">
          <Clock size={8} />
          {item.room}
        </span>
      )}
    </div>
  );
}

// ─── MiniWeekGrid ─────────────────────────────────────────────────────────────
// Compact Mon-Fri grid that fits inside a dashboard card.

interface GridSlot {
  periodName: string;
  startTime: string;
  daySlots: Array<{ day: DayOfWeek; subjectName?: string; room?: string } | null>;
}

function MiniWeekGrid({ rows, today }: { rows: GridSlot[]; today: DayOfWeek }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-400 py-4 text-center">No periods configured.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="text-left px-1.5 py-1 text-slate-400 font-normal border-b border-slate-100 dark:border-slate-700 w-16">
              Period
            </th>
            {DAYS.map((d) => (
              <th
                key={d}
                className={cn(
                  'text-center px-1 py-1 font-medium border-b border-slate-100 dark:border-slate-700',
                  d === today
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400'
                )}
              >
                {DAY_LABEL[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-50 dark:border-slate-800">
              <td className="px-1.5 py-1 text-slate-500 whitespace-nowrap">
                <div className="font-medium">{row.periodName}</div>
                <div className="text-[9px] text-slate-400">{row.startTime}</div>
              </td>
              {DAYS.map((d) => {
                const cell = row.daySlots.find((s) => s?.day === d);
                if (!cell?.subjectName) {
                  return (
                    <td key={d} className={cn('px-1 py-1 text-center', d === today && 'bg-blue-50/50 dark:bg-blue-900/10')}>
                      <div className="h-7 rounded border border-dashed border-slate-100 dark:border-slate-700" />
                    </td>
                  );
                }
                const cc = subjectColour(cell.subjectName);
                return (
                  <td key={d} className={cn('px-1 py-1', d === today && 'bg-blue-50/50 dark:bg-blue-900/10')}>
                    <div className={cn('rounded border px-1 py-0.5 h-7 flex flex-col justify-center', cc)}>
                      <span className="truncate font-medium text-[10px] leading-tight">{cell.subjectName}</span>
                      {cell.room && <span className="truncate text-[8px] opacity-60">{cell.room}</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TeacherTimetableWidget ───────────────────────────────────────────────────

interface TeacherTimetableWidgetProps {
  teacherId: string;
}

export function TeacherTimetableWidget({ teacherId }: TeacherTimetableWidgetProps) {
  const { data: slots = [], isLoading } = useTeacherSchedule(teacherId);
  const today = todayDow();

  // Build today's lessons from teacher slots, sorted by period order
  const todayLessons = useMemo((): TeacherLessonItem[] => {
    const todaySlots = slots.filter((s: PeriodSlot) => s.dayOfWeek === today);
    todaySlots.sort((a: PeriodSlot, b: PeriodSlot) =>
      (a.period?.orderIndex ?? 0) - (b.period?.orderIndex ?? 0)
    );
    return todaySlots.map((s: PeriodSlot) => {
      const classInfo = s.timetable?.class;
      const streamInfo = s.timetable?.stream;
      return {
        periodName: s.period?.name ?? '',
        startTime: s.period?.startTime ?? '',
        endTime: s.period?.endTime ?? '',
        subjectName: s.classSubject?.subject?.name ?? 'Free',
        className: classInfo?.name ?? '',
        streamName: streamInfo?.name,
        teacherName: s.classSubject?.teacherProfile?.user
          ? `${s.classSubject.teacherProfile.user.firstName} ${s.classSubject.teacherProfile.user.lastName}`
          : s.teacher?.user
            ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}`
            : undefined,
        room: s.room ?? undefined,
        studentCount: (classInfo as any)?._count?.students,
        isBreak: s.period?.isBreak,
      };
    });
  }, [slots, today]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar size={17} className="text-blue-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Today's Schedule
          </h3>
          <Badge variant="outline" className="text-[10px]">{DAY_FULL[today]}</Badge>
        </div>
        <Link
          to="/classes/timetable"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          Full timetable <ExternalLink size={11} />
        </Link>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {todayLessons.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No classes scheduled today.
              </p>
            ) : (
              todayLessons.map((item, i) => (
                <TeacherTodayCard key={i} item={item} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StudentTimetableWidget ───────────────────────────────────────────────────

interface StudentTimetableWidgetProps {
  classId: string;
  streamId?: string;
}

export function StudentTimetableWidget({ classId, streamId }: StudentTimetableWidgetProps) {
  const { data: timetable, isLoading } = useActiveTimetableForClass(classId, streamId);
  const today = todayDow();

  // Build today's lessons from the timetable detail
  const todayLessons = useMemo((): StudentLessonItem[] => {
    if (!timetable) return [];
    const items: StudentLessonItem[] = [];
    for (const period of timetable.periods ?? []) {
      const slot = period.slots?.find((s) => s.dayOfWeek === today);
      if (period.isBreak) {
        items.push({
          periodName: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          subjectName: 'Break',
          isBreak: true,
        });
        continue;
      }
      const subject = slot?.classSubject?.subject;
      const teacherUser = slot?.classSubject?.teacherProfile?.user ?? slot?.teacher?.user;
      items.push({
        periodName: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        subjectName: subject?.name ?? '',
        teacherName: teacherUser ? `${teacherUser.firstName} ${teacherUser.lastName}` : undefined,
        room: slot?.room ?? undefined,
      });
    }
    return items.filter((i) => i.isBreak || i.subjectName);
  }, [timetable, today]);

  // Build mini-grid rows
  const gridRows = useMemo((): GridSlot[] => {
    if (!timetable) return [];
    return timetable.periods.map((period) => ({
      periodName: period.name,
      startTime: period.startTime,
      daySlots: DAYS.map((d) => {
        const slot = period.slots?.find((s) => s.dayOfWeek === d);
        const subject = slot?.classSubject?.subject;
        return subject
          ? { day: d, subjectName: subject.name, room: slot?.room ?? undefined }
          : null;
      }),
    }));
  }, [timetable]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar size={17} className="text-purple-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">My Timetable</h3>
          {timetable && (
            <Badge variant="outline" className="text-[10px]">{timetable.name}</Badge>
          )}
        </div>
        <Link
          to="/classes/timetable"
          className="flex items-center gap-1 text-xs text-purple-600 hover:underline"
        >
          Full view <ExternalLink size={11} />
        </Link>
      </div>

      {isLoading ? (
        <div className="p-5 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      ) : !timetable ? (
        <div className="px-5 py-8 text-center text-slate-400 text-sm">
          No active timetable found for your class.
        </div>
      ) : (
        <>
          {/* Today tab */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
              <Clock size={11} /> Today — {DAY_FULL[today]}
            </p>
            <div className="space-y-2">
              {todayLessons.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No classes scheduled today.
                </p>
              ) : (
                todayLessons.map((item, i) => (
                  <StudentTodayCard key={i} item={item} />
                ))
              )}
            </div>
          </div>

          {/* Mini week grid */}
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 mb-2">This Week</p>
            <MiniWeekGrid rows={gridRows} today={today} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── AdminTimetableWidget ─────────────────────────────────────────────────────

interface AdminTimetableWidgetProps {
  teachers: Array<{ id: string; name: string }>;
  defaultTeacherId?: string;
}

export function AdminTimetableWidget({ teachers, defaultTeacherId }: AdminTimetableWidgetProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(defaultTeacherId ?? teachers[0]?.id ?? '');
  const { data: slots = [], isLoading } = useTeacherSchedule(selectedTeacherId);
  const today = todayDow();

  const teacherName = teachers.find((t) => t.id === selectedTeacherId)?.name ?? '';

  // Reuse TeacherLessonItem shape for the admin view
  const todayLessons = useMemo((): TeacherLessonItem[] => {
    const todaySlots = slots.filter((s: PeriodSlot) => s.dayOfWeek === today);
    todaySlots.sort((a: PeriodSlot, b: PeriodSlot) =>
      (a.period?.orderIndex ?? 0) - (b.period?.orderIndex ?? 0)
    );
    return todaySlots.map((s: PeriodSlot) => {
      const classInfo = s.timetable?.class;
      const streamInfo = s.timetable?.stream;
      return {
        periodName: s.period?.name ?? '',
        startTime: s.period?.startTime ?? '',
        endTime: s.period?.endTime ?? '',
        subjectName: s.classSubject?.subject?.name ?? 'Free',
        className: classInfo?.name ?? '',
        streamName: streamInfo?.name,
        teacherName: s.classSubject?.teacherProfile?.user
          ? `${s.classSubject.teacherProfile.user.firstName} ${s.classSubject.teacherProfile.user.lastName}`
          : s.teacher?.user
            ? `${s.teacher.user.firstName} ${s.teacher.user.lastName}`
            : undefined,
        room: s.room ?? undefined,
        studentCount: (classInfo as any)?._count?.students,
        isBreak: s.period?.isBreak,
      };
    });
  }, [slots, today]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar size={17} className="text-emerald-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Teacher Schedule
          </h3>
          <Badge variant="outline" className="text-[10px]">{DAY_FULL[today]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {todayLessons.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                {teacherName ? `${teacherName} has no classes scheduled today.` : 'No classes scheduled today.'}
              </p>
            ) : (
              todayLessons.map((item, i) => (
                <TeacherTodayCard key={i} item={item} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}