import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { StudentCreateInput, StudentUpdateInput } from '@/services/student.service';
import { GENDERS, KENYAN_COUNTIES } from '@/lib/constants';

const studentSchema = z.object({
  admissionNo: z.string().min(1, 'Admission Number is required'),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  middleName: z.string().optional(),
  gender: z.nativeEnum({ MALE: 'MALE', FEMALE: 'FEMALE' }),
  dob: z.string().optional(), // Consider using a date picker component
  county: z.string().optional(),
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsType: z.string().optional(),
  medicalCondition: z.string().optional(),
  allergies: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  initialData?: Partial<StudentFormData>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

export const StudentForm = ({ onSubmit, initialData, isLoading, isEditMode = false }: StudentFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData,
  });

  const hasSpecialNeeds = watch('hasSpecialNeeds');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Student' : 'Create New Student'}</CardTitle>
          <CardDescription>Fill in the details below to {isEditMode ? 'update the' : 'add a new'} student.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Personal Details */}
          <div className="space-y-2">
            <Label htmlFor="admissionNo">Admission Number</Label>
            <Input id="admissionNo" {...register('admissionNo')} />
            {errors.admissionNo && <p className="text-sm text-destructive">{errors.admissionNo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input id="middleName" {...register('middleName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select onValueChange={(value) => control.setValue('gender', value as 'MALE' | 'FEMALE')} defaultValue={initialData?.gender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GENDERS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" {...register('dob')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select onValueChange={(value) => control.setValue('county', value)} defaultValue={initialData?.county}>
              <SelectTrigger id="county">
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {KENYAN_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special Needs & Medical */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox id="hasSpecialNeeds" checked={hasSpecialNeeds} onCheckedChange={(checked: any) => control.setValue('hasSpecialNeeds', !!checked)} />
              <Label htmlFor="hasSpecialNeeds">Has Special Needs?</Label>
            </div>
            {hasSpecialNeeds && (
              <div className="space-y-2">
                <Label htmlFor="specialNeedsType">Type of Special Need</Label>
                <Input id="specialNeedsType" {...register('specialNeedsType')} placeholder="e.g., Visual, Hearing" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalCondition">Known Medical Conditions</Label>
            <Input id="medicalCondition" {...register('medicalCondition')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Input id="allergies" {...register('allergies')} />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Student')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};