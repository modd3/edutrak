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

// Update schema to match Prisma schema
const subjectSchema = z.object({
  code: z.string().min(1, 'Subject code is required').max(10),
  name: z.string().min(1, 'Subject name is required'),
  category: z.enum(['CORE', 'ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED']),
  learningArea: z.string().optional(),
  subjectGroup: z.string().optional(),
  curriculum: z.array(z.string()).min(1, 'Select at least one curriculum'),
  description: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

interface SubjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subject?: Subject;
}

// Update to match Prisma enums
const CURRICULA = [
  { value: 'CBC', label: 'CBC (Competency Based)' },
  { value: 'EIGHT_FOUR_FOUR', label: '8-4-4' },
  { value: 'TVET', label: 'TVET' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'IB', label: 'International Baccalaureate' },
];

// Update to match Prisma enums
const LEARNING_AREAS = [
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'SCIENCE_TECHNOLOGY', label: 'Science & Technology' },
  { value: 'SOCIAL_STUDIES', label: 'Social Studies' },
  { value: 'RELIGIOUS_EDUCATION', label: 'Religious Education' },
  { value: 'CREATIVE_ARTS', label: 'Creative Arts' },
  { value: 'PHYSICAL_HEALTH_EDUCATION', label: 'Physical Health Education' },
  { value: 'PRE_TECHNICAL_STUDIES', label: 'Pre-Technical Studies' },
];

// Update to match Prisma enums
const SUBJECT_GROUPS = [
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'SCIENCES', label: 'Sciences' },
  { value: 'HUMANITIES', label: 'Humanities' },
  { value: 'TECHNICAL_APPLIED', label: 'Technical & Applied' },
  { value: 'BUSINESS_STUDIES', label: 'Business Studies' },
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
      learningArea: '',
      subjectGroup: '',
    },
  });

  // Reset form when modal opens/closes or subject changes
  useEffect(() => {
    if (open && mode === 'edit' && subject) {
      form.reset({
        code: subject.code,
        name: subject.name,
        category: subject.category as SubjectFormData['category'],
        learningArea: subject.learningArea || '',
        subjectGroup: subject.subjectGroup || '',
        curriculum: Array.isArray(subject.curriculum) 
          ? subject.curriculum 
          : subject.curriculum ? [subject.curriculum] : ['CBC'],
        description: subject.description || '',
      });
    } else if (open && mode === 'create') {
      form.reset({
        code: '',
        name: '',
        category: 'CORE',
        curriculum: ['CBC'],
        description: '',
        learningArea: '',
        subjectGroup: '',
      });
    }
  }, [open, mode, subject, form]);

  const onSubmit = (data: SubjectFormData) => {
    // Transform curriculum from array to enum values if needed
    const submitData = {
      ...data,
      // Ensure curriculum is properly formatted for backend
      curriculum: data.curriculum,
    };

    console.log('Submitting subject:', submitData);

    if (mode === 'create') {
      createSubject(submitData, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error: any) => {
          console.error('Create subject error:', error);
          toast.error(error.response?.data?.message || 'Failed to create subject');
        },
      });
    } else if (subject) {
      updateSubject({
        id: subject.id,
        data: submitData
      }, {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error: any) => {
          console.error('Update subject error:', error);
          toast.error(error.response?.data?.message || 'Failed to update subject');
        },
      });
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
                  form.setValue('category', value as SubjectFormData['category'])
                }
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORE">Core</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="learningArea">Learning Area (CBC)</Label>
              <Select
                value={form.watch('learningArea') || ''}
                onValueChange={(value) => form.setValue('learningArea', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="learningArea">
                  <SelectValue placeholder="Select learning area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Learning Area --</SelectItem>
                  {LEARNING_AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subjectGroup">Subject Group (8-4-4)</Label>
              <Select
                value={form.watch('subjectGroup') || ''}
                onValueChange={(value) => form.setValue('subjectGroup', value)}
                disabled={isLoading}
              >
                <SelectTrigger id="subjectGroup">
                  <SelectValue placeholder="Select subject group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">-- Select Group --</SelectItem>
                  {SUBJECT_GROUPS.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
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
                    checked={form.watch('curriculum').includes(curr.value)}
                    onCheckedChange={(checked) => {
                      const current = form.watch('curriculum');
                      if (checked) {
                        form.setValue('curriculum', [...current, curr.value]);
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