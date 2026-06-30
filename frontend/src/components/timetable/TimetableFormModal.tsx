// src/components/timetable/TimetableFormModal.tsx
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
import type { Timetable } from '@/types';
import type { CreateTimetableInput } from '@/api/timetable-api';
import { useClasses, useActiveAcademicYear } from '@/hooks/use-academic';
import { useSchoolContext } from '@/hooks/use-school-context';

interface TimetableFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTimetableInput) => void;
  isLoading?: boolean;
  existing?: Timetable | null;
}

interface FormValues {
  name: string;
  classId: string;
  streamId: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export function TimetableFormModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  existing,
}: TimetableFormModalProps) {
  const { schoolId } = useSchoolContext();
  const { data: activeYear } = useActiveAcademicYear();
  const { data: classesData } = useClasses(activeYear?.id ?? '');
  const classes = classesData ?? [];

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      name: '',
      classId: '',
      streamId: '',
      effectiveFrom: '',
      effectiveTo: '',
    },
  });

  const selectedClassId = watch('classId');
  const selectedClass = classes.find((c: any) => c.id === selectedClassId);
  const streams: any[] = selectedClass?.streams ?? [];

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        classId: existing.classId,
        streamId: existing.streamId ?? '',
        effectiveFrom: existing.effectiveFrom
          ? new Date(existing.effectiveFrom).toISOString().slice(0, 10)
          : '',
        effectiveTo: existing.effectiveTo
          ? new Date(existing.effectiveTo).toISOString().slice(0, 10)
          : '',
      });
    } else {
      reset({ name: '', classId: '', streamId: '', effectiveFrom: '', effectiveTo: '' });
    }
  }, [existing, open, reset]);

  const handleFormSubmit = (values: FormValues) => {
    if (!activeYear) return;
    onSubmit({
      name: values.name,
      classId: values.classId,
      academicYearId: activeYear.id,
      streamId: values.streamId || undefined,
      effectiveFrom: values.effectiveFrom
        ? new Date(values.effectiveFrom).toISOString()
        : new Date().toISOString(),
      effectiveTo: values.effectiveTo
        ? new Date(values.effectiveTo).toISOString()
        : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Timetable' : 'New Timetable'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tt-name">Name</Label>
            <Input
              id="tt-name"
              placeholder="e.g. Form 3 North – Term 2 2025"
              {...register('name', { required: true })}
            />
          </div>

          <div className="space-y-1">
            <Label>Class</Label>
            <Select
              value={selectedClassId}
              onValueChange={(v) => { setValue('classId', v); setValue('streamId', ''); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class…" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {streams.length > 0 && (
            <div className="space-y-1">
              <Label>Stream (optional)</Label>
              <Select
                value={watch('streamId')}
                onValueChange={(v) => setValue('streamId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All streams</SelectItem>
                  {streams.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tt-from">Effective From</Label>
              <Input id="tt-from" type="date" {...register('effectiveFrom')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tt-to">Effective To (optional)</Label>
              <Input id="tt-to" type="date" {...register('effectiveTo')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : existing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
