// src/components/subjects/SubjectFormModal.tsx
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Subject } from '@/types';
import { useCreateSubject, useUpdateSubject } from '@/hooks/use-subjects';
import { toast } from 'sonner';

const subjectSchema = z.object({
  code: z.string().min(1, 'Subject code is required').max(10),
  name: z.string().min(1, 'Subject name is required'),
  category: z.enum(['CORE', 'ELECTIVE', 'COMPETENCY']),
  learningArea: z.string().optional(),
  subjectGroup: z.string().optional(),
  curriculum: z.array(z.enum(['8_4_4', 'CBC'])).min(1, 'Select at least one curriculum'),
  description: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subject?: Subject;
}

const CURRICULA = [
  { value: '8_4_4', label: '8-4-4' },
  { value: 'CBC', label: 'CBC (Competency Based)' },
];

const LEARNING_AREAS = [
  'Languages',
  'Mathematics',
  'Science',
  'Social Studies',
  'Expressive Arts',
  'Physical Education',
  'Emerging',
];

export function SubjectFormModal({
  open,
  onOpenChange,
  mode,
  subject,
}: SubjectFormModalProps) {
  const { mutate: createSubject, isPending: isCreating } = useCreateSubject();
  const { mutate: updateSubject, isPending: isUpdating } = useUpdateSubject();
  const isLoading = isCreating || isUpdating;

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      code: '',
      name: '',
      category: 'CORE',
      curriculum: ['CBC'],
      description: '',
    },
  });

  useEffect(() => {
    if (subject && mode === 'edit') {
      form.reset({
        code: subject.code,
        name: subject.name,
        category: subject.category as 'CORE' | 'ELECTIVE' | 'COMPETENCY',
        learningArea: subject.learningArea || '',
        subjectGroup: subject.subjectGroup || '',
        curriculum: (subject.curriculum as any[]) || ['CBC'],
        description: subject.description || '',
      });
    } else {
      form.reset();
    }
  }, [subject, mode, open, form]);

  const onSubmit = (data: SubjectFormData) => {
    if (mode === 'create') {
      createSubject(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    } else if (subject) {
      updateSubject(
        { id: subject.id, data },
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Subject' : 'Edit Subject'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new subject to your curriculum'
              : 'Update the subject information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                placeholder="e.g., ENG, MAT"
                {...form.register('code')}
                disabled={isLoading}
              />
              {form.formState.errors.code && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                placeholder="e.g., English, Mathematics"
                {...form.register('name')}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) =>
                  form.setValue('category', value as 'CORE' | 'ELECTIVE' | 'COMPETENCY')
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                  <SelectItem value="COMPETENCY">Competency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="learningArea">Learning Area</Label>
              <Select
                value={form.watch('learningArea') || ''}
                onValueChange={(value) => form.setValue('learningArea', value)}
              >
                <SelectTrigger id="learningArea">
                  <SelectValue placeholder="Select learning area" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Curriculum *</Label>
            <div className="space-y-2">
              {CURRICULA.map((curr) => (
                <div key={curr.value} className="flex items-center">
                  <Checkbox
                    id={curr.value}
                    checked={form.watch('curriculum').includes(curr.value as any)}
                    onCheckedChange={(checked) => {
                      const current = form.watch('curriculum');
                      if (checked) {
                        form.setValue('curriculum', [...current, curr.value as any]);
                      } else {
                        form.setValue(
                          'curriculum',
                          current.filter((c) => c !== curr.value)
                        );
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Label htmlFor={curr.value} className="ml-2 cursor-pointer">
                    {curr.label}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.curriculum && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.curriculum.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Subject description"
              {...form.register('description')}
              disabled={isLoading}
              className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
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
                ? 'Create Subject'
                : 'Update Subject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
