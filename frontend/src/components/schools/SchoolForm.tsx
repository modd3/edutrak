import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KENYAN_COUNTIES, SCHOOL_TYPES } from '@/lib/constants';
import { School, SchoolType, Ownership, BoardingStatus, SchoolGender } from '@/types';

// Zod schema based on prisma.schema [cite: 3, 4, 5, 6, 7] and types/index.ts 
const schoolSchema = z.object({
  name: z.string().min(3, 'School name is required'),
  registrationNo: z.string().optional(),
  type: z.nativeEnum(SchoolType),
  county: z.string().min(1, 'County is required'),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  knecCode: z.string().optional(),
  nemisCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  ownership: z.nativeEnum(Ownership),
  boardingStatus: z.nativeEnum(BoardingStatus),
  gender: z.nativeEnum(SchoolGender),
});

export type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  onSubmit: (data: SchoolFormData) => void;
  defaultValues?: Partial<School>;
  isLoading: boolean;
  submitButtonText?: string;
}

// Manually define enum objects for iteration [cite: 3, 7]
const ownershipOptions = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  FAITH_BASED: 'Faith Based',
  NGO: 'NGO',
};

const boardingStatusOptions = {
  DAY: 'Day',
  BOARDING: 'Boarding',
  BOTH: 'Day & Boarding',
};

const schoolGenderOptions = {
  BOYS: 'Boys Only',
  GIRLS: 'Girls Only',
  MIXED: 'Mixed',
};

export function SchoolForm({
  onSubmit,
  defaultValues,
  isLoading,
  submitButtonText = 'Submit',
}: SchoolFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      ...defaultValues,
      email: defaultValues?.email || '', // Ensure email is controlled
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Fill in the basic details of the school.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="name">School Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">School Type</Label>
            <Select onValueChange={(value) => control.setValue('type', value as SchoolType)} defaultValue={defaultValues?.type}>
              <SelectTrigger>
                <SelectValue placeholder="Select school type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCHOOL_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Select onValueChange={(value) => control.setValue('county', value)} defaultValue={defaultValues?.county}>
              <SelectTrigger>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {KENYAN_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>{county}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.county && <p className="text-sm text-destructive">{errors.county.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subCounty">Sub-County</Label>
            <Input id="subCounty" {...register('subCounty')} />
            {errors.subCounty && <p className="text-sm text-destructive">{errors.subCounty.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ward">Ward</Label>
            <Input id="ward" {...register('ward')} />
            {errors.ward && <p className="text-sm text-destructive">{errors.ward.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">School Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">School Phone</Label>
            <Input id="phone" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownership">Ownership</Label>
            <Select onValueChange={(value) => control.setValue('ownership', value as Ownership)} defaultValue={defaultValues?.ownership}>
              <SelectTrigger>
                <SelectValue placeholder="Select ownership type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ownershipOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ownership && <p className="text-sm text-destructive">{errors.ownership.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="boardingStatus">Boarding Status</Label>
            <Select onValueChange={(value) => control.setValue('boardingStatus', value as BoardingStatus)} defaultValue={defaultValues?.boardingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select boarding status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(boardingStatusOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.boardingStatus && <p className="text-sm text-destructive">{errors.boardingStatus.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">School Gender</Label>
            <Select onValueChange={(value) => control.setValue('gender', value as SchoolGender)} defaultValue={defaultValues?.gender}>
              <SelectTrigger>
                <SelectValue placeholder="Select school gender" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(schoolGenderOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNo">Registration No.</Label>
            <Input id="registrationNo" {...register('registrationNo')} />
            {errors.registrationNo && <p className="text-sm text-destructive">{errors.registrationNo.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="knecCode">KNEC Code</Label>
            <Input id="knecCode" {...register('knecCode')} />
            {errors.knecCode && <p className="text-sm text-destructive">{errors.knecCode.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nemisCode">NEMIS Code</Label>
            <Input id="nemisCode" {...register('nemisCode')} />
            {errors.nemisCode && <p className="text-sm text-destructive">{errors.nemisCode.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
}