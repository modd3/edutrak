// src/components/classes/ClassFormModal.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Class, Curriculum, Pathway } from '@/types';
import { 
   useAcademicYears, 
   useActiveAcademicYear,
   useCreateClass,
   useUpdateClass 
   } from '@/hooks/use-academic';
import { useTeachers } from '@/hooks/use-teachers';
import { useSchoolContext } from '@/hooks/use-school-context';
import { GraduationCap } from 'lucide-react';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  level: z.string().min(1, 'Level is required'),
  curriculum: z.enum(['CBC', 'EIGHT_FOUR_FOUR', 'TVET', 'IGCSE', 'IB']),
  pathway: z.enum(['STEM', 'ARTS_SPORTS', 'SOCIAL_SCIENCES']).optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classTeacherId: z.string().optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  classData?: Class;
}

const CURRICULUM_OPTIONS = [
  { value: 'CBC', label: 'CBC (Competency Based)' },
  { value: 'EIGHT_FOUR_FOUR', label: '8-4-4 System' },
  { value: 'TVET', label: 'TVET' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'IB', label: 'IB (International Baccalaureate)' },
];

const PATHWAY_OPTIONS = [
  { value: 'STEM', label: 'STEM' },
  { value: 'ARTS_SPORTS', label: 'Arts & Sports' },
  { value: 'SOCIAL_SCIENCES', label: 'Social Sciences' },
];

const CBC_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

const EIGHT_FOUR_FOUR_LEVELS = [
  'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 
  'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8',
  'Form 1', 'Form 2', 'Form 3', 'Form 4'
];

export function ClassFormModal({ open, onOpenChange, mode, classData }: ClassFormModalProps) {
  const { schoolId } = useSchoolContext();
  const { mutate: createClass, isPending: isCreating } = useCreateClass();
  const { mutate: updateClass, isPending: isUpdating } = useUpdateClass();
  const { data: academicYearsData } = useAcademicYears();
  const { data: activeAcademicYear } = useActiveAcademicYear();
  const { data: teachersData } = useTeachers({ schoolId });
  
  const isLoading = isCreating || isUpdating;
  const academicYears = academicYearsData?.data || [];
  const teachers = teachersData?.data || [];

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      level: '',
      curriculum: 'CBC',
      pathway: undefined,
      academicYearId: activeAcademicYear?.data?.id || '',
      classTeacherId: '',
    },
  });

  const watchedCurriculum = form.watch('curriculum');

  useEffect(() => {
    if (open && mode === 'create') {
      form.reset({
        name: '',
        level: '',
        curriculum: 'CBC',
        pathway: undefined,
        academicYearId: activeAcademicYear?.data?.id || '',
        classTeacherId: '',
      });
    }
  }, [open, mode, activeAcademicYear, form]);

  useEffect(() => {
    if (mode === 'edit' && classData && open) {
      form.reset({
        name: classData.name,
        level: classData.level,
        curriculum: classData.curriculum,
        pathway: classData.pathway || undefined,
        academicYearId: classData.academicYearId,
        classTeacherId: classData.classTeacherId || '',
      });
    }
  }, [mode, classData, open, form]);

  const onSubmit = async (data: ClassFormData) => {
    const requestBody = {
      ...data,
      schoolId,
      classTeacherId: data.classTeacherId || null,
      pathway: data.pathway || null,
    };

    if (mode === 'create') {
      createClass(requestBody, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    } else if (classData) {
      updateClass({ id: classData.id, data: requestBody }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const getLevelOptions = () => {
    if (watchedCurriculum === 'CBC') {
      return CBC_LEVELS;
    } else if (watchedCurriculum === 'EIGHT_FOUR_FOUR') {
      return EIGHT_FOUR_FOUR_LEVELS;
    }
    return [];
  };

  const showPathway = watchedCurriculum === 'CBC' && 
    (form.watch('level')?.includes('7') || 
     form.watch('level')?.includes('8') || 
     form.watch('level')?.includes('9'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            {mode === 'create' ? 'Create New Class' : 'Edit Class'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the class details below.'
              : 'Update class information.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input {...form.register('name')} placeholder="e.g., Grade 7 East" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Curriculum *</Label>
                <Controller
                  name="curriculum"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select curriculum" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRICULUM_OPTIONS.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.curriculum && (
                  <p className="text-sm text-destructive">{form.formState.errors.curriculum.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Level *</Label>
                <Controller
                  name="level"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {getLevelOptions().map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.level && (
                  <p className="text-sm text-destructive">{form.formState.errors.level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Controller
                  name="academicYearId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.year} {year.isActive && '(Active)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.academicYearId && (
                  <p className="text-sm text-destructive">{form.formState.errors.academicYearId.message}</p>
                )}
              </div>

              {showPathway && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Pathway (CBC Junior Secondary)</Label>
                  <Controller
                    name="pathway"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pathway" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- No Pathway --</SelectItem>
                          {PATHWAY_OPTIONS.map((pathway) => (
                            <SelectItem key={pathway.value} value={pathway.value}>
                              {pathway.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select pathway for CBC Junior Secondary classes
                  </p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label>Class Teacher</Label>
                <Controller
                  name="classTeacherId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class teacher (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Class Teacher --</SelectItem>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.user?.firstName} {teacher.user?.lastName} - {teacher.tscNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Class' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
