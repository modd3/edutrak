import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const competencySchema = z.object({
  competencyLevel: z.enum([
    'EXCEEDING_EXPECTATIONS',
    'MEETING_EXPECTATIONS',
    'APPROACHING_EXPECTATIONS',
    'BELOW_EXPECTATIONS',
  ]),
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(competencySchema),
    defaultValues: {
      competencyLevel: defaultValues?.competencyLevel || '',
      remarks: defaultValues?.remarks || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="competencyLevel">Competency Level</Label>
          <Select
            name="competencyLevel"
            defaultValue={defaultValues?.competencyLevel}
            onValueChange={(value) => register('competencyLevel').onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select competency level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCEEDING_EXPECTATIONS">
                Exceeding Expectations
              </SelectItem>
              <SelectItem value="MEETING_EXPECTATIONS">
                Meeting Expectations
              </SelectItem>
              <SelectItem value="APPROACHING_EXPECTATIONS">
                Approaching Expectations
              </SelectItem>
              <SelectItem value="BELOW_EXPECTATIONS">
                Below Expectations
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.competencyLevel && (
            <p className="text-sm text-destructive">
              {errors.competencyLevel.message as string}
            </p>
          )}
        </div>

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
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Assessment'}
      </Button>
    </form>
  );
}