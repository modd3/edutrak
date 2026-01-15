// src/components/streams/StreamFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Stream } from '@/types';
import { useCreateStream, useUpdateStream } from '@/hooks/use-academic';
import { useTeachers } from '@/hooks/use-teachers';
import { useSchoolContext } from '@/hooks/use-school-context';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

const streamSchema = z.object({
  name: z.string().min(1, 'Stream name is required').max(50),
  capacity: z.coerce.number().int().positive().optional(),
  classId: z.string().min(1, 'Class is required'),
  streamTeacherId: z.string().optional(),
});

type StreamFormData = z.infer<typeof streamSchema>;

interface StreamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  stream?: Stream;
  classId?: string; // For creating new streams within a class
}

export function StreamFormModal({ 
  open, 
  onOpenChange, 
  mode, 
  stream, 
  classId 
}: StreamFormModalProps) {
  const { schoolId } = useSchoolContext();
  const { mutate: createStream, isPending: isCreating } = useCreateStream();
  const { mutate: updateStream, isPending: isUpdating } = useUpdateStream();
  const { data: teachersData } = useTeachers({ schoolId });
  
  const isLoading = isCreating || isUpdating;
  const teachers = teachersData?.data || [];
  const [debugInfo, setDebugInfo] = useState<string>('');

  const form = useForm<StreamFormData>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      name: '',
      capacity: undefined,
      classId: classId || '',
      streamTeacherId: '',
    },
  });

  // Debug: Log current form values
  useEffect(() => {
    const subscription = form.watch((value) => {
      setDebugInfo(JSON.stringify(value, null, 2));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Reset form when modal opens/closes or when stream data changes
  useEffect(() => {
    if (open) {
      console.log('StreamFormModal opened:', { mode, stream, classId });
      
      if (mode === 'edit' && stream) {
        console.log('Setting form for edit mode:', {
          name: stream.name,
          capacity: stream.capacity,
          classId: stream.classId,
          streamTeacherId: stream.streamTeacherId,
          hasStreamTeacher: !!stream.streamTeacherId,
        });
        
        // Use setTimeout to ensure form reset happens after render
        setTimeout(() => {
          form.reset({
            name: stream.name,
            capacity: stream.capacity || undefined,
            classId: stream.classId,
            streamTeacherId: stream.streamTeacherId || '',
          });
        }, 0);
      } else if (mode === 'create') {
        console.log('Setting form for create mode:', { classId });
        form.reset({
          name: '',
          capacity: undefined,
          classId: classId || '',
          streamTeacherId: '',
        });
      }
    }
  }, [open, mode, stream, classId]);

  const onSubmit = async (data: StreamFormData) => {
    console.log('Form submitted:', data);
    console.log('Original stream data:', stream);
    
    const requestBody = {
      ...data,
      // Remove undefined values and handle "none" selection
      capacity: data.capacity || null,
      // Ensure streamTeacherId is null if empty string or "none"
      streamTeacherId: data.streamTeacherId && data.streamTeacherId !== 'none' ? data.streamTeacherId : null,
    };

    console.log('Request body:', requestBody);

    if (mode === 'create') {
      createStream(requestBody, {
        onSuccess: () => {
          toast.success('Stream created successfully');
          onOpenChange(false);
          form.reset();
        },
        onError: (error: any) => {
          console.error('Create stream error:', error);
          toast.error(error.response?.data?.message || 'Failed to create stream');
        },
      });
    } else if (stream) {
      updateStream({ 
        id: stream.id, 
        data: requestBody 
      }, {
        onSuccess: () => {
          toast.success('Stream updated successfully');
          onOpenChange(false);
        },
        onError: (error: any) => {
          console.error('Update stream error:', error);
          toast.error(error.response?.data?.message || 'Failed to update stream');
        },
      });
    }
  };

  // Get stream teacher display value
  const getStreamTeacherDisplay = () => {
    const teacherId = form.watch('streamTeacherId');
    console.log("Teacher Id for strem: ", teacherId);
    if (!teacherId || teacherId === 'none') return '-- Select stream teacher --';
    
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher 
      ? `${teacher.user?.firstName} ${teacher.user?.lastName}`
      : '-- Select stream teacher --';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {mode === 'create' ? 'Create New Stream' : 'Edit Stream'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new stream within a class. Stream teachers manage specific sections.'
              : 'Update stream information and teacher assignment.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Stream Name *</Label>
            <Input 
              {...form.register('name')} 
              placeholder="e.g., North, South, East, West" 
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Capacity (Optional)</Label>
            <Input 
              type="number"
              {...form.register('capacity')} 
              placeholder="Maximum number of students" 
              disabled={isLoading}
              min="1"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for unlimited capacity
            </p>
          </div>

          {mode === 'create' && !classId && (
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select 
                onValueChange={(value) => form.setValue('classId', value)}
                value={form.watch('classId')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {/* You would need to fetch classes here */}
                  <SelectItem value="placeholder">Loading classes...</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.classId && (
                <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Stream Teacher (Optional)</Label>
            <Select 
              onValueChange={(value) => {
                console.log('Stream teacher selected:', value);
                form.setValue('streamTeacherId', value === 'none' ? '' : value);
              }}
              value={form.watch('streamTeacherId') || 'none'}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign stream teacher">
                  {getStreamTeacherDisplay()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No stream teacher --</SelectItem>
                {teachers.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.user?.firstName} {teacher.user?.lastName} 
                    {teacher.tscNumber && ` - ${teacher.tscNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Stream teacher manages only this specific stream section
            </p>
          </div>

          {/* Debug section - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 border rounded bg-gray-50">
              <p className="text-xs font-mono text-gray-600">
                <strong>Debug:</strong> {debugInfo}
              </p>
              <p className="text-xs font-mono text-gray-600 mt-1">
                <strong>Current stream teacher ID:</strong> {form.watch('streamTeacherId') || 'empty'}
              </p>
              <p className="text-xs font-mono text-gray-600">
                <strong>Original stream teacher ID:</strong> {stream?.streamTeacherId || 'none'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                console.log('Cancel clicked');
                onOpenChange(false);
              }} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? 'Saving...' 
                : mode === 'create' 
                  ? 'Create Stream' 
                  : 'Save Changes'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}