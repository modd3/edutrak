import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurriculumLevel } from '@/types';
import { useCreateClass } from '@/hooks/use-classes';
import { useAuthStore } from '@/store/auth-store';
import { CURRICULUM_LEVELS } from '@/lib/constants'; // Assuming you add this constant

// Update constants.ts with this if not present
/*
// src/lib/constants.ts
export const CURRICULUM_LEVELS: { [key in CurriculumLevel]: string } = {
    PRE_PRIMARY: 'Pre-Primary',
    LOWER_PRIMARY: 'Lower Primary',
    UPPER_PRIMARY: 'Upper Primary',
    LOWER_SECONDARY: 'Lower Secondary',
    UPPER_SECONDARY: 'Upper Secondary',
    TVET: 'TVET',
    SPECIAL_NEEDS: 'Special Needs',
};
*/

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required (e.g., Grade 1)'),
  level: z.nativeEnum(CurriculumLevel),
  academicYearId: z.string().min(1, 'Academic Year is required'),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassDialogProps {
  // In a real app, you'd fetch active academic years
  academicYears: { id: string; year: number }[]; 
}

export function CreateClassDialog({ academicYears }: CreateClassDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || ''; // Active school ID

  const { mutate: createClass, isPending } = useCreateClass(schoolId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
        academicYearId: academicYears.find(y => y.year === new Date().getFullYear() - 1)?.id || '', // Attempt to default to previous or current year
    }
  });

  const onSubmit = (data: CreateClassFormData) => {
    createClass(data, {
      onSuccess: () => {
        reset();
        setIsOpen(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Academic Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name (e.g., Grade 1, Form 4)</Label>
            <Input id="name" {...register('name')} disabled={isPending} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Curriculum Level</Label>
            <Select onValueChange={(val) => setValue('level', val as CurriculumLevel)} disabled={isPending} defaultValue={register('level').defaultValue}>
              <SelectTrigger id="level">
                <SelectValue placeholder="Select curriculum level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRICULUM_LEVELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="text-sm text-destructive">{errors.level.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="academicYearId">Academic Year</Label>
            <Select onValueChange={(val) => setValue('academicYearId', val)} disabled={isPending} defaultValue={register('academicYearId').defaultValue}>
              <SelectTrigger id="academicYearId">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.academicYearId && (
              <p className="text-sm text-destructive">{errors.academicYearId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}