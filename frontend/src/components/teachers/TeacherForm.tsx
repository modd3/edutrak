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
import { Teacher } from '@/types';

const teacherSchema = z.object({
  tscNumber: z.string().min(1, 'TSC Number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  employmentType: z.enum(['PERMANENT', 'CONTRACT', 'TEMPORARY', 'BOM', 'PTA']),
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.string().optional(),
  dateJoined: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

interface TeacherFormProps {
  teacher?: Teacher;
  onSubmit: (data: TeacherFormData) => void;
  isLoading?: boolean;
}

export function TeacherForm({ teacher, onSubmit, isLoading }: TeacherFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      tscNumber: teacher?.tscNumber || '',
      firstName: teacher?.user?.firstName || '',
      lastName: teacher?.user?.lastName || '',
      middleName: teacher?.user?.middleName || '',
      email: teacher?.user?.email || '',
      phone: teacher?.user?.phone || '',
      employmentType: teacher?.employmentType || 'PERMANENT',
      qualification: teacher?.qualification || '',
      specialization: teacher?.specialization || '',
      dateJoined: teacher?.dateJoined?.split('T')[0] || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tscNumber">TSC Number</Label>
          <Input
            id="tscNumber"
            {...register('tscNumber')}
            error={errors.tscNumber?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select
            name="employmentType"
            control={control}
            defaultValue={teacher?.employmentType || 'PERMANENT'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERMANENT">Permanent</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="TEMPORARY">Temporary</SelectItem>
              <SelectItem value="BOM">BOM</SelectItem>
              <SelectItem value="PTA">PTA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            {...register('middleName')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input
            id="qualification"
            {...register('qualification')}
            error={errors.qualification?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input
            id="specialization"
            {...register('specialization')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateJoined">Date Joined</Label>
          <Input
            id="dateJoined"
            type="date"
            {...register('dateJoined')}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Teacher'}
      </Button>
    </form>
  );
}