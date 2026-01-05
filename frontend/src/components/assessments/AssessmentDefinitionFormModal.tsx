// src/components/assessments/AssessmentDefinitionFormModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { AssessmentDefinition } from '@/types';
import { useCreateAssessment, useUpdateAssessment } from '@/hooks/use-assessments';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { toast } from 'sonner';

const assessmentSchema = z.object({
  name: z.string().min(1, 'Assessment name is required'),
  type: z.enum(['COMPETENCY', 'GRADE_BASED', 'HOLISTIC']),
  maxMarks: z.number().optional(),
  classSubjectId: z.string().min(1, 'Class subject is required'),
  termId: z.string().min(1, 'Term is required'),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AssessmentDefinitionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  assessment?: AssessmentDefinition;
  termId?: string;
  classSubjectId?: string;
}

export function AssessmentDefinitionFormModal({
  open,
  onOpenChange,
  mode,
  assessment,
  termId,
  classSubjectId,
}: AssessmentDefinitionFormModalProps) {
  const { mutate: createAssessment, isPending: isCreating } = useCreateAssessment();
  const { mutate: updateAssessment, isPending: isUpdating } = useUpdateAssessment();
  const { data: classSubjects } = useClassSubjects();
  const isLoading = isCreating || isUpdating;

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: '',
      type: 'GRADE_BASED',
      maxMarks: 100,
      classSubjectId: classSubjectId || '',
      termId: termId || '',
    },
  });

  useEffect(() => {
    if (assessment && mode === 'edit') {
      form.reset({
        name: assessment.name,
        type: assessment.type as any,
        maxMarks: assessment.maxMarks || 100,
        classSubjectId: assessment.classSubjectId,
        termId: assessment.termId,
      });
    } else {
      form.reset({
        name: '',
        type: 'GRADE_BASED',
        maxMarks: 100,
        classSubjectId: classSubjectId || '',
        termId: termId || '',
      });
    }
  }, [assessment, mode, open, form, classSubjectId, termId]);

  const onSubmit = (data: AssessmentFormData) => {
    if (mode === 'create') {
      createAssessment(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (assessment) {
      updateAssessment(
        { id: assessment.id, data },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Assessment' : 'Edit Assessment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define a new assessment for a class subject'
              : 'Update assessment details'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Assessment Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Mid-term Exam, Quiz 1"
              {...form.register('name')}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Assessment Type *</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) =>
                  form.setValue('type', value as 'COMPETENCY' | 'GRADE_BASED' | 'HOLISTIC')
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPETENCY">Competency Based</SelectItem>
                  <SelectItem value="GRADE_BASED">Grade Based</SelectItem>
                  <SelectItem value="HOLISTIC">Holistic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                min="0"
                placeholder="100"
                {...form.register('maxMarks', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="termId">Term *</Label>
              <Input
                id="termId"
                placeholder="Term ID"
                {...form.register('termId')}
                disabled={isLoading}
                className="bg-gray-50"
              />
              {form.formState.errors.termId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.termId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="classSubjectId">Class Subject *</Label>
              <Select
                value={form.watch('classSubjectId')}
                onValueChange={(value) => form.setValue('classSubjectId', value)}
              >
                <SelectTrigger id="classSubjectId">
                  <SelectValue placeholder="Select class subject" />
                </SelectTrigger>
                <SelectContent>
                  {classSubjects?.data?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject?.name} - {subject.class?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.classSubjectId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.classSubjectId.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : mode === 'create'
                ? 'Create Assessment'
                : 'Update Assessment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
