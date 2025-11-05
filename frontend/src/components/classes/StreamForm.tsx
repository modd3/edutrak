import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useTeachers } from '@/hooks/use-teachers';
import { useAuthStore } from '@/store/auth-store';
import { StreamCreateInput } from '@/services/class.service';

const streamSchema = z.object({
  name: z.string().min(1, 'Stream name is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  streamTeacherId: z.string().optional(),
});

type StreamFormData = z.infer<typeof streamSchema>;

interface StreamFormProps {
  classId: string;
  initialData?: Partial<StreamFormData>;
  onSubmit: (data: StreamCreateInput) => void;
  isLoading?: boolean;
}

export function StreamForm({ classId, initialData, onSubmit, isLoading }: StreamFormProps) {
  const { user } = useAuthStore();
  const { data: teachers } = useTeachers({ schoolId: user?.schoolId });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StreamFormData>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      ...initialData,
    },
  });

  const handleFormSubmit = (data: StreamFormData) => {
    onSubmit({
      ...data,
      classId,
      schoolId: user?.schoolId!,
      streamTeacherId: data.streamTeacherId ? Number(data.streamTeacherId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Stream Name</Label>
        <Input
          id="name"
          {...register('name')}
          error={errors.name?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
          error={errors.capacity?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="streamTeacherId">Stream Teacher</Label>
        <Select
          name="streamTeacherId"
          onValueChange={(value) => register('streamTeacherId').onChange({ target: { value } })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stream teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Not Assigned</SelectItem>
            {teachers?.data.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                {teacher.user.firstName} {teacher.user.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Stream'}
      </Button>
    </form>
  );
}