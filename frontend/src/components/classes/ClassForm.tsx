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
import { ClassCreateInput } from '@/services/class.service';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  level: z.string().min(1, 'Level is required'),
  curriculum: z.enum(['CBC', 'EIGHT_FOUR_FOUR', 'TVET', 'IGCSE', 'IB']),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classTeacherId: z.string().optional(),
  pathway: z.enum(['STEM', 'ARTS_SPORTS', 'SOCIAL_SCIENCES']).optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormProps {
  initialData?: Partial<ClassFormData>;
  onSubmit: (data: ClassCreateInput) => void;
  isLoading?: boolean;
}

export function ClassForm({ initialData, onSubmit, isLoading }: ClassFormProps) {
  const { user } = useAuthStore();
  const { data: teachers } = useTeachers({ schoolId: user?.schoolId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      ...initialData,
    },
  });

  const selectedCurriculum = watch('curriculum');

  const handleFormSubmit = (data: ClassFormData) => {
    onSubmit({
      ...data,
      schoolId: user?.schoolId!,
      classTeacherId: data.classTeacherId ? Number(data.classTeacherId) : undefined,
      academicYearId: Number(data.academicYearId),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Class Name</Label>
          <Input
            id="name"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Level</Label>
          <Input
            id="level"
            {...register('level')}
            error={errors.level?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="curriculum">Curriculum</Label>
          <Select
            name="curriculum"
            value={selectedCurriculum}
            onValueChange={(value) => register('curriculum').onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select curriculum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CBC">CBC (Competency Based)</SelectItem>
              <SelectItem value="EIGHT_FOUR_FOUR">8-4-4 System</SelectItem>
              <SelectItem value="TVET">TVET</SelectItem>
              <SelectItem value="IGCSE">IGCSE</SelectItem>
              <SelectItem value="IB">International Baccalaureate</SelectItem>
            </SelectContent>
          </Select>
          {errors.curriculum && (
            <p className="text-sm text-destructive">{errors.curriculum.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="classTeacherId">Class Teacher</Label>
          <Select
            name="classTeacherId"
            value={watch('classTeacherId')}
            onValueChange={(value) => register('classTeacherId').onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class teacher" />
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

        {selectedCurriculum === 'CBC' && (
          <div className="space-y-2">
            <Label htmlFor="pathway">Learning Pathway</Label>
            <Select
              name="pathway"
              value={watch('pathway')}
              onValueChange={(value) => register('pathway').onChange({ target: { value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pathway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STEM">STEM</SelectItem>
                <SelectItem value="ARTS_SPORTS">Arts & Sports Sciences</SelectItem>
                <SelectItem value="SOCIAL_SCIENCES">Social Sciences</SelectItem>
              </SelectContent>
            </Select>
            {errors.pathway && (
              <p className="text-sm text-destructive">{errors.pathway.message}</p>
            )}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Class'}
      </Button>
    </form>
  );
}
