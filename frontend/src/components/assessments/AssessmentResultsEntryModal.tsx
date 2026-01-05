// src/components/assessments/AssessmentResultsEntryModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { useEnrollmentsByClass } from '@/hooks/use-class-students';
import { useCreateAssessmentResult } from '@/hooks/use-assessments';
import { toast } from 'sonner';

const resultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  marks: z.number().min(0, 'Marks must be positive'),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

type ResultFormData = z.infer<typeof resultSchema>;

interface AssessmentResultsEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  maxMarks?: number;
  classId?: string;
}

export function AssessmentResultsEntryModal({
  open,
  onOpenChange,
  assessmentId,
  maxMarks,
  classId,
}: AssessmentResultsEntryModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { data: students } = useEnrollmentsByClass(classId || '', { enabled: !!classId });
  const { mutate: createResult, isPending: isCreating } = useCreateAssessmentResult();

  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentId: '',
      marks: 0,
      grade: '',
      remarks: '',
    },
  });

  const handleGradeCalc = (marks: number) => {
    if (!maxMarks) return '';
    const percentage = (marks / maxMarks) * 100;

    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  };

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const marks = parseFloat(e.target.value) || 0;
    form.setValue('marks', marks);
    if (maxMarks) {
      form.setValue('grade', handleGradeCalc(marks));
    }
  };

  const onSubmit = (data: ResultFormData) => {
    createResult(
      {
        assessmentId,
        ...data,
      },
      {
        onSuccess: () => {
          form.reset();
          setSelectedStudent('');
          toast.success('Result recorded successfully');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Assessment Results</DialogTitle>
          <DialogDescription>
            Enter marks and grades for students
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="studentId">Student *</Label>
            <Select
              value={form.watch('studentId')}
              onValueChange={(value) => {
                form.setValue('studentId', value);
                setSelectedStudent(value);
              }}
            >
              <SelectTrigger id="studentId">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((enrollment: any) => (
                  <SelectItem key={enrollment.studentId} value={enrollment.studentId}>
                    {enrollment.student?.firstName} {enrollment.student?.lastName} (
                    {enrollment.student?.admissionNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.studentId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.studentId.message}
              </p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marks">
                Marks {maxMarks && `(out of ${maxMarks})`} *
              </Label>
              <Input
                id="marks"
                type="number"
                min="0"
                max={maxMarks}
                placeholder="0"
                onChange={handleMarksChange}
                value={form.watch('marks')}
                disabled={isCreating}
              />
              {form.formState.errors.marks && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.marks.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                placeholder="Auto-calculated"
                {...form.register('grade')}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              placeholder="Optional remarks or feedback"
              {...form.register('remarks')}
              disabled={isCreating}
              className="w-full min-h-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !selectedStudent}>
              {isCreating ? 'Saving...' : 'Record Result'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
