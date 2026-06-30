// src/components/timetable/SlotEditorModal.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DayOfWeek, Period, PeriodSlot } from '@/types';
import type { UpsertSlotInput } from '@/api/timetable-api';

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};

interface ClassSubjectOption {
  id: string;
  label: string; // "Mathematics – Mr. Doe"
}

interface SlotEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: UpsertSlotInput) => void;
  onClear?: () => void;
  isLoading?: boolean;
  period: Period | null;
  day: DayOfWeek | null;
  existingSlot?: PeriodSlot | null;
  classSubjectOptions: ClassSubjectOption[];
}

interface FormValues {
  classSubjectId: string;
  room: string;
  notes: string;
}

export function SlotEditorModal({
  open,
  onClose,
  onSave,
  onClear,
  isLoading,
  period,
  day,
  existingSlot,
  classSubjectOptions,
}: SlotEditorModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { classSubjectId: '', room: '', notes: '' },
  });

  const selectedCSId = watch('classSubjectId');

  useEffect(() => {
    if (open) {
      reset({
        classSubjectId: existingSlot?.classSubjectId ?? '',
        room: existingSlot?.room ?? '',
        notes: existingSlot?.notes ?? '',
      });
    }
  }, [open, existingSlot, reset]);

  const handleFormSubmit = (values: FormValues) => {
    if (!day || !period) return;
    onSave({
      periodId: period.id,
      dayOfWeek: day,
      classSubjectId: values.classSubjectId || null,
      room: values.room || null,
      notes: values.notes || null,
    });
  };

  if (!period || !day) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {DAY_LABELS[day]} — {period.name}
            <span className="ml-2 text-xs font-normal text-slate-400">
              {period.startTime}–{period.endTime}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Subject / Class</Label>
            <Select
              value={selectedCSId}
              onValueChange={(v) => setValue('classSubjectId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {classSubjectOptions.map((cs) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    {cs.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="slot-room">Room (optional)</Label>
            <Input id="slot-room" placeholder="e.g. Lab 2, Room 14" {...register('room')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="slot-notes">Notes (optional)</Label>
            <Input id="slot-notes" placeholder="Any note…" {...register('notes')} />
          </div>

          <DialogFooter className="flex justify-between">
            {existingSlot && onClear && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
              >
                Clear slot
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
