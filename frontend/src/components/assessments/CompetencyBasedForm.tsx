import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { calculateCBCGrade } from '@/lib/grade-calculator';

const competencySchema = z.object({
  marksObtained: z.number()
    .min(0, 'Marks cannot be negative')
    .max(100, 'Marks cannot exceed maximum'),
  maxMarks: z.number()
    .min(1, 'Maximum marks must be at least 1'),
  remarks: z.string().min(1, 'Remarks are required for CBC assessment'),
});

interface CompetencyBasedFormProps {
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function CompetencyBasedForm({ onSubmit, defaultValues, isLoading }: CompetencyBasedFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      marksObtained: defaultValues?.marksObtained || 0,
      maxMarks: defaultValues?.maxMarks || 100,
      remarks: defaultValues?.remarks || '',
    },
  });

  const marksObtained = watch('marksObtained');
  const maxMarks = watch('maxMarks');
  const [cbcResult, setCbcResult] = useState<ReturnType<typeof calculateCBCGrade> | null>(null);

  useEffect(() => {
    if (marksObtained && maxMarks && maxMarks > 0) {
      const result = calculateCBCGrade(marksObtained, maxMarks);
      setCbcResult(result);
    }
  }, [marksObtained, maxMarks]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="marksObtained">Marks Obtained</Label>
          <Input
            id="marksObtained"
            type="number"
            min="0"
            step="0.5"
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
            min="1"
            step="0.5"
            {...register('maxMarks', { valueAsNumber: true })}
          />
          {errors.maxMarks && (
            <p className="text-sm text-destructive">
              {errors.maxMarks.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Auto-calculated CBC result */}
      {cbcResult && marksObtained > 0 && (
        <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
          <div className="flex items-center gap-3">
            <Badge className={cbcResult.color}>
              Grade: {cbcResult.grade}
            </Badge>
            <Badge className={cbcResult.color}>
              {cbcResult.shortLabel}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{cbcResult.label}</p>
          <p className="text-xs text-gray-500">{cbcResult.description}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="remarks">Detailed Remarks</Label>
        <Textarea
          id="remarks"
          rows={4}
          placeholder="Provide detailed observations and recommendations..."
          {...register('remarks')}
        />
        {errors.remarks && (
          <p className="text-sm text-destructive">
            {errors.remarks.message as string}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Assessment'}
      </Button>
    </form>
  );
}
