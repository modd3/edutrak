import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { calculateGrade } from '@/lib/grade-calculator';

const gradeBasedSchema = z.object({
  marksObtained: z.number()
    .min(0, 'Marks cannot be negative')
    .max(100, 'Marks cannot exceed maximum'),
  maxMarks: z.number()
    .min(1, 'Maximum marks must be at least 1')
    .max(100, 'Maximum marks cannot exceed 100'),
  remarks: z.string().optional(),
});

interface GradeBasedFormProps {
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function GradeBasedForm({ onSubmit, defaultValues, isLoading }: GradeBasedFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(gradeBasedSchema),
    defaultValues: {
      marksObtained: defaultValues?.marksObtained || 0,
      maxMarks: defaultValues?.maxMarks || 100,
      remarks: defaultValues?.remarks || '',
    },
  });

  const marksObtained = watch('marksObtained');
  const maxMarks = watch('maxMarks');

  useEffect(() => {
    if (marksObtained && maxMarks) {
      const { grade, remarks } = calculateGrade(marksObtained, maxMarks);
      setValue('grade', grade);
      if (!defaultValues?.remarks) {
        setValue('remarks', remarks);
      }
    }
  }, [marksObtained, maxMarks, setValue, defaultValues?.remarks]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marksObtained">Marks Obtained</Label>
          <Input
            id="marksObtained"
            type="number"
            {...register('marksObtained', { valueAsNumber: true })}
          />
          {errors.marksObtained && (
            <p className="text-sm text-destructive">
              {errors.marksObtained.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxMarks">Maximum Marks</Label>
          <Input
            id="maxMarks"
            type="number"
            {...register('maxMarks', { valueAsNumber: true })}
          />
          {errors.maxMarks && (
            <p className="text-sm text-destructive">
              {errors.maxMarks.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Input
            id="remarks"
            {...register('remarks')}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Assessment'}
      </Button>
    </form>
  );
}