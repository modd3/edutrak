// src/components/timetable/PeriodFormModal.tsx
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
import { Switch } from '@/components/ui/switch';
import type { Period } from '@/types';
import type { CreatePeriodInput } from '@/api/timetable-api';

interface PeriodFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePeriodInput) => void;
  isLoading?: boolean;
  existing?: Period | null;
  nextOrderIndex?: number;
}

interface FormValues {
  name: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
  isBreak: boolean;
}

export function PeriodFormModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  existing,
  nextOrderIndex = 0,
}: PeriodFormModalProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      name: '',
      startTime: '08:00',
      endTime: '08:45',
      orderIndex: nextOrderIndex,
      isBreak: false,
    },
  });

  const isBreak = watch('isBreak');

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        startTime: existing.startTime,
        endTime: existing.endTime,
        orderIndex: existing.orderIndex,
        isBreak: existing.isBreak,
      });
    } else {
      reset({
        name: '',
        startTime: '08:00',
        endTime: '08:45',
        orderIndex: nextOrderIndex,
        isBreak: false,
      });
    }
  }, [existing, open, nextOrderIndex, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Period' : 'Add Period'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              placeholder="e.g. Period 1, Break, Lunch"
              {...register('name', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="p-start">Start Time</Label>
              <Input id="p-start" type="time" {...register('startTime', { required: true })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-end">End Time</Label>
              <Input id="p-end" type="time" {...register('endTime', { required: true })} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="p-order">Order</Label>
            <Input
              id="p-order"
              type="number"
              min={0}
              {...register('orderIndex', { required: true, valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="p-break"
              checked={isBreak}
              onCheckedChange={(v) => setValue('isBreak', v)}
            />
            <Label htmlFor="p-break">Non-instructional (break / lunch)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : existing ? 'Save' : 'Add Period'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
