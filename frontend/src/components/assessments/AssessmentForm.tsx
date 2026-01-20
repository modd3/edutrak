// src/components/assessments/AssessmentForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AssessmentType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateAssessment, useUpdateAssessment } from '@/hooks/use-assessments';

const assessmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.nativeEnum(AssessmentType),
  maxMarks: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  termId: z.string().uuid('Invalid term'),
  classSubjectId: z.string().uuid('Invalid class subject'),
  strandId: z.string().optional(),
  academicYearId: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AssessmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  assessment?: any;
  termId: string;
  classSubjectId: string;
  academicYearId?: string;
}

const ASSESSMENT_TYPES = [
  { value: 'CAT', label: 'CAT' },
  { value: 'MIDTERM', label: 'Mid-Term Exam' },
  { value: 'END_OF_TERM', label: 'End of Term Exam' },
  { value: 'MOCK', label: 'Mock Exam' },
  { value: 'NATIONAL_EXAM', label: 'National Exam' },
  { value: 'COMPETENCY_BASED', label: 'Competency Assessment' },
];

export function AssessmentForm({
  open,
  onOpenChange,
  mode,
  assessment,
  termId,
  classSubjectId,
  academicYearId,
}: AssessmentFormProps) {
  const createMutation = useCreateAssessment();
  const updateMutation = useUpdateAssessment();

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: assessment?.name || '',
      type: assessment?.type || 'CAT',
      maxMarks: assessment?.maxMarks?.toString() || '',
      termId: assessment?.termId || termId,
      classSubjectId: assessment?.classSubjectId || classSubjectId,
      academicYearId: assessment?.academicYearId || academicYearId,
    },
  });

  const onSubmit = async (data: AssessmentFormData) => {
    if (mode === 'create') {
      await createMutation.mutateAsync(data as any);
    } else {
      await updateMutation.mutateAsync({
        id: assessment.id,
        data: data as any,
      });
    }
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Assessment' : 'Edit Assessment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new assessment for this subject'
              : 'Update assessment details'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CAT 1, Mid-Term Exam" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxMarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Marks (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Create Assessment'
                    : 'Update Assessment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
