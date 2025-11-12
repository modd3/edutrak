import { useForm, Controller } from 'react-hook-form';
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
import { KENYAN_COUNTIES, KENYAN_COUNTIES_WITH_SUBCOUNTIES } from '@/lib/kenyanData';
import { SCHOOL_TYPES } from '@/lib/constants';
import { School, SchoolType, Ownership, BoardingStatus, SchoolGender } from '@/types';
import { useEffect, useState } from 'react';

// Zod schema based on prisma.schema
const schoolSchema = z.object({
  name: z.string().min(3, 'School name is required'),
  registrationNo: z.string().optional(),
  type: z.nativeEnum(SchoolType),
  county: z.string().min(1, 'County is required'),
  subCounty: z.string().optional(),
  ward: z.string().optional(),
  knecCode: z.string().optional(),
  kemisCode: z.string().optional(), 
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

// Manually define enum objects for iteration
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
  const [availableSubCounties, setAvailableSubCounties] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      ...defaultValues,
      email: defaultValues?.email || '',
    },
  });

  const selectedCounty = watch('county');

  useEffect(() => {
    if (selectedCounty && KENYAN_COUNTIES_WITH_SUBCOUNTIES[selectedCounty]) {
      setAvailableSubCounties(KENYAN_COUNTIES_WITH_SUBCOUNTIES[selectedCounty]);
    } else {
      setAvailableSubCounties([]);
    }
  }, [selectedCounty]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Fill in the basic details of the school.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* School Name */}
          <div className="space-y-2">
            <Label htmlFor="name">School Name *</Label>
            <Input id="name" {...register('name')} placeholder="Enter school name" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* School Type */}
          <div className="space-y-2">
            <Label htmlFor="type">School Type *</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {Object.entries(SCHOOL_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>

          {/* County */}
          <div className="space-y-2">
            <Label htmlFor="county">County *</Label>
            <Controller
              name="county"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {KENYAN_COUNTIES.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.county && <p className="text-sm text-destructive">{errors.county.message}</p>}
          </div>

          {/* Sub-County */}
          <div className="space-y-2">
            <Label htmlFor="subCounty">Sub-County</Label>
            <Controller
              name="subCounty"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedCounty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedCounty ? "Select sub-county" : "Select county first"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableSubCounties.map((subCounty) => (
                      <SelectItem key={subCounty} value={subCounty}>
                        {subCounty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subCounty && <p className="text-sm text-destructive">{errors.subCounty.message}</p>}
          </div>
          
          {/* Ward */}
          <div className="space-y-2">
            <Label htmlFor="ward">Ward</Label>
            <Input id="ward" {...register('ward')} placeholder="Enter ward" />
            {errors.ward && <p className="text-sm text-destructive">{errors.ward.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">School Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="school@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">School Phone</Label>
            <Input id="phone" {...register('phone')} placeholder="0712345678" />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} placeholder="Physical address" />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          {/* Ownership */}
          <div className="space-y-2">
            <Label htmlFor="ownership">Ownership *</Label>
            <Controller
              name="ownership"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {Object.entries(ownershipOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.ownership && <p className="text-sm text-destructive">{errors.ownership.message}</p>}
          </div>

          {/* Boarding Status */}
          <div className="space-y-2">
            <Label htmlFor="boardingStatus">Boarding Status *</Label>
            <Controller
              name="boardingStatus"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select boarding status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {Object.entries(boardingStatusOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.boardingStatus && (
              <p className="text-sm text-destructive">{errors.boardingStatus.message}</p>
            )}
          </div>

          {/* School Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">School Gender *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school gender" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {Object.entries(schoolGenderOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>

          {/* Registration No */}
          <div className="space-y-2">
            <Label htmlFor="registrationNo">Registration No.</Label>
            <Input
              id="registrationNo"
              {...register('registrationNo')}
              placeholder="School registration number"
            />
            {errors.registrationNo && (
              <p className="text-sm text-destructive">{errors.registrationNo.message}</p>
            )}
          </div>

          {/* KNEC Code */}
          <div className="space-y-2">
            <Label htmlFor="knecCode">KNEC Code</Label>
            <Input id="knecCode" {...register('knecCode')} placeholder="KNEC code" />
            {errors.knecCode && <p className="text-sm text-destructive">{errors.knecCode.message}</p>}
          </div>

          {/* KEMIS Code */}
          <div className="space-y-2">
            <Label htmlFor="kemisCode">KEMIS Code</Label>
            <Input id="kemisCode" {...register('kemisCode')} placeholder="KEMIS code" />
            {errors.kemisCode && <p className="text-sm text-destructive">{errors.kemisCode.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-4">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
}