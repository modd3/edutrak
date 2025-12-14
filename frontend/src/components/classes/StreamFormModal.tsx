// src/components/classes/StreamFormModal.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Stream } from '@/types';
import { useCreateStream, useUpdateStream } from '@/hooks/use-classes';
import { useTeachers } from '@/hooks/use-teachers';
import { useSchoolContext } from '@/hooks/use-school-context';
import { Users } from 'lucide-react';

const streamSchema = z.object({
  name: z.string().min(1, 'Stream name is required'),
  capacity: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  streamTeacherId: z.string().optional(),
});

type StreamFormData = z.infer<typeof streamSchema>;

interface StreamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  classId: string;
  streamData?: Stream | null;
}

export function StreamFormModal({ 
  open, 
  onOpenChange, 
  mode, 
  classId,
  streamData 
}: StreamFormModalProps) {
  const { schoolId } = useSchoolContext();
  const { mutate: createStream, isPending: isCreating } = useCreateStream();
  const { mutate: updateStream, isPending: isUpdating } = useUpdateStream();
  const { data: teachersData } = useTeachers({ schoolId });
  
  const isLoading = isCreating || isUpdating;
  const teachers = teachersData?.data || [];

  const form = useForm<StreamFormData>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      name: '',
      capacity: '',
      classId: classId,
      streamTeacherId: '',
    },
  });

  useEffect(() => {
    if (open && mode === 'create') {
      form.reset({
        name: '',
        capacity: '',
        classId: classId,
        streamTeacherId: '',
      });
    }
  }, [open, mode, classId, form]);

  useEffect(() => {
    if (mode === 'edit' && streamData && open) {
      form.reset({
        name: streamData.name,
        capacity: streamData.capacity?.toString() || '',
        classId: streamData.classId,
        streamTeacherId: streamData.streamTeacherId || '',
      });
    }
  }, [mode, streamData, open, form]);

  const onSubmit = async (data: StreamFormData) => {
    const requestBody = {
      ...data,
      classId,
      schoolId,
      capacity: data.capacity ? parseInt(data.capacity) : undefined,
      streamTeacherId: data.streamTeacherId || null,
    };

    if (mode === 'create') {
      createStream(requestBody, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    } else if (streamData) {
      updateStream({ id: streamData.id, data: requestBody }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {mode === 'create' ? 'Create New Stream' : 'Edit Stream'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the stream details below.'
              : 'Update stream information.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Stream Name *</Label>
            <Input 
              {...form.register('name')} 
              placeholder="e.g., North, South, East, West, A, B" 
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Common names: North, South, East, West, or letters A, B, C, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Capacity (Optional)</Label>
            <Input 
              {...form.register('capacity')} 
              type="number" 
              placeholder="e.g., 40"
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of students in this stream (leave empty for unlimited)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Stream Teacher (Optional)</Label>
            <Controller
              name="streamTeacherId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stream teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Stream Teacher --</SelectItem>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.user?.firstName} {teacher.user?.lastName} - {teacher.tscNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Stream' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}