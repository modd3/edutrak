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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SCHOOL_TYPES } from '@/lib/constants';
import { School, SchoolType, Ownership, BoardingStatus, SchoolGender } from '@/types';
import { useCreateSchool, useUpdateSchool } from '@/hooks/use-schools';
import { toast } from 'sonner';
import { KENYAN_COUNTIES, KENYAN_COUNTIES_WITH_SUBCOUNTIES } from '@/lib/kenyanData';
import { useEffect, useState } from 'react';
import { SchoolIcon } from 'lucide-react';

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

interface SchoolFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  school?: School;
}

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

export function SchoolFormModal({ open, onOpenChange, mode, school }: SchoolFormModalProps) {
  const [availableSubCounties, setAvailableSubCounties] = useState<string[]>([]);

  const { mutate: createSchool, isPending: isCreating } = useCreateSchool();
  const { mutate: updateSchool, isPending: isUpdating } = useUpdateSchool();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: school
      ? {
          name: school.name,
          registrationNo: school.registrationNo || '',
          type: school.type,
          county: school.county,
          subCounty: school.subCounty || '',
          ward: school.ward || '',
          knecCode: school.knecCode || '',
          kemisCode: school.kemisCode || '',
          phone: school.phone || '',
          email: school.email || '',
          address: school.address || '',
          ownership: school.ownership,
          boardingStatus: school.boardingStatus,
          gender: school.gender,
        }
      : undefined,
  });

  const selectedCounty = watch('county');

  // Update available sub-counties when county changes
  useEffect(() => {
    if (selectedCounty && KENYAN_COUNTIES_WITH_SUBCOUNTIES[selectedCounty]) {
      setAvailableSubCounties(KENYAN_COUNTIES_WITH_SUBCOUNTIES[selectedCounty]);
    } else {
      setAvailableSubCounties([]);
    }
  }, [selectedCounty]);

  const onSubmit = (data: SchoolFormData) => {
    if (mode === 'create') {
      createSchool(data, {
        onSuccess: () => {
          toast.success('School created successfully');
          reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to create school');
        },
      });
    } else if (school) {
      updateSchool(
        { id: school.id, data },
        {
          onSuccess: () => {
            toast.success('School updated successfully');
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to update school');
          },
        }
      );
    }
  };

   // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setAvailableSubCounties([]);
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle><SchoolIcon className="mr-2 h-6 w-6" />{mode === 'create' ? 'Create New School' : 'Edit School'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new school.'
              : 'Update the school information below.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form id="school-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="name">School Name <span className="text-destructive">*</span></Label>
                <Input id="name" {...register('name')} placeholder="Enter school name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* School Type */}
              <div className="space-y-2">
                <Label htmlFor="type">School Type <span className="text-destructive">*</span></Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                <Label htmlFor="county">County <span className="text-destructive">*</span></Label>
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
              </div>

              {/* Ownership */}
              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership <span className="text-destructive">*</span></Label>
                <Controller
                  name="ownership"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ownership" />
                      </SelectTrigger>
                      <SelectContent>
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
                <Label htmlFor="boardingStatus">Boarding Status <span className='text-destructive'>*</span></Label>
                <Controller
                  name="boardingStatus"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
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

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">School Gender <span className='text-destructive'>*</span></Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
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

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="school@example.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="0712345678" />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register('address')} placeholder="Physical address" />
              </div>

              {/* Registration No */}
              <div className="space-y-2">
                <Label htmlFor="registrationNo">Registration No.</Label>
                <Input id="registrationNo" {...register('registrationNo')} placeholder="REG12345" />
              </div>

              {/* KNEC Code */}
              <div className="space-y-2">
                <Label htmlFor="knecCode">KNEC Code</Label>
                <Input id="knecCode" {...register('knecCode')} placeholder="KNEC code" />
              </div>

              {/* KEMIS Code */}
              <div className="space-y-2">
                <Label htmlFor="kemisCode">KEMIS Code</Label>
                <Input id="kemisCode" {...register('kemisCode')} placeholder="KEMIS code" />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="school-form" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create School' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}