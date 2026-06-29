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

  const rubricLevels = [
    { code: 'EE', label: 'Exceeding Expectations', percent: 92, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    { code: 'ME', label: 'Meeting Expectations', percent: 76, tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
    { code: 'AE', label: 'Approaching Expectations', percent: 58, tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
    { code: 'BE', label: 'Below Expectations', percent: 38, tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
  ];

  const applyRubricLevel = (percent: number, label: string) => {
    const computedMarks = Math.round(((maxMarks || 100) * percent) / 100);
    setValue('marksObtained', computedMarks, { shouldDirty: true, shouldValidate: true });
    setValue('remarks', `${label}: learner evidence captured against the CBC rubric.`, { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    if (marksObtained && maxMarks && maxMarks > 0) {
      const result = calculateCBCGrade(marksObtained, maxMarks);
      setCbcResult(result);
    }
  }, [marksObtained, maxMarks]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="font-semibold text-slate-900">CBC rubric matrix</h3>
          <p className="text-sm text-slate-500">One-tap grading for EE, ME, AE and BE competency levels.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rubricLevels.map((level) => (
            <button
              key={level.code}
              type="button"
              onClick={() => applyRubricLevel(level.percent, level.label)}
              className={`rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${level.tone}`}
            >
              <span className="text-2xl font-black">{level.code}</span>
              <span className="mt-2 block text-sm font-semibold">{level.label}</span>
              <span className="mt-1 block text-xs opacity-80">Sets marks to ~{level.percent}%</span>
            </button>
          ))}
        </div>
      </div>

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
