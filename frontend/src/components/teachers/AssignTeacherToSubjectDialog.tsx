import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Loader2 } from 'lucide-react';
import { useTeachers } from '@/hooks/use-teachers';
import { useClasses } from '@/hooks/use-classes';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';

const assignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher is required'),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  termId: z.string().min(1, 'Term is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface ClassSubjectInfo {
  id: string;
  classId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  class: {
    id: string;
    name: string;
    level: string;
  };
}

interface AssignTeacherToSubjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AssignTeacherToSubjectDialog({ 
  open: externalOpen = false, 
  onOpenChange: externalOnOpenChange 
}: AssignTeacherToSubjectDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOnOpenChange ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classSubjects, setClassSubjects] = useState<ClassSubjectInfo[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const { schoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  const { data: activeYearData } = useActiveAcademicYear();
  const activeAcademicYear = activeYearData?.data;

  const { data: classesData } = useClasses({ schoolId });
  const { data: teachersData } = useTeachers({ schoolId });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      teacherId: '',
      classId: '',
      subjectId: '',
      termId: '',
      academicYearId: activeAcademicYear?.id || '',
    },
  });

  // Fetch class subjects when class is selected
  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    form.setValue('classId', classId);
    form.setValue('subjectId', '');
    setLoadingSubjects(true);

    try {
      const response = await api.get(`/classes/${classId}/subjects`);
      setClassSubjects(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching class subjects:', error);
      toast.error('Failed to load class subjects');
      setClassSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Assign teacher mutation
  const { mutate: assignTeacher, isPending: isAssigning } = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const response = await api.post('/teachers/assign-subject', {
        teacherId: data.teacherId,
        classId: data.classId,
        subjectId: data.subjectId,
        termId: data.termId,
        academicYearId: data.academicYearId,
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher assigned to subject successfully');
      if (externalOnOpenChange) {
        externalOnOpenChange(false);
      } else {
        setInternalOpen(false);
      }
      form.reset();
      setSelectedClass('');
      setClassSubjects([]);
    },
    onError: (error: any) => {
      console.error('Assignment error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to assign teacher to subject'
      );
    },
  });

  const onSubmit = async (data: AssignmentFormData) => {
    assignTeacher(data);
  };

  const classes = classesData?.data || [];
  const teachers = teachersData?.data || [];

  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Teacher to Subject</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label>Teacher *</Label>
            <Controller
              name="teacherId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No teachers available
                      </SelectItem>
                    ) : (
                      teachers.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user?.firstName} {teacher.user?.lastName}
                          {teacher.tscNumber && ` (${teacher.tscNumber})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.teacherId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.teacherId.message}
              </p>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Class *</Label>
            <Controller
              name="classId"
              control={form.control}
              render={({ field }) => (
                <Select
                  onValueChange={handleClassChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.level})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.classId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.classId.message}
              </p>
            )}
          </div>

          {/* Subject Selection */}
          {selectedClass && (
            <div className="space-y-2">
              <Label>Subject *</Label>
              {loadingSubjects ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading subjects...
                </div>
              ) : (
                <Controller
                  name="subjectId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSubjects.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No subjects in this class
                          </SelectItem>
                        ) : (
                          classSubjects.map((cs: ClassSubjectInfo) => (
                            <SelectItem key={cs.id} value={cs.subjectId}>
                              {cs.subject.name} ({cs.subject.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {form.formState.errors.subjectId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.subjectId.message}
                </p>
              )}
            </div>
          )}

          {/* Term Selection */}
          <div className="space-y-2">
            <Label>Term *</Label>
            <Controller
              name="termId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="term1">Term 1</SelectItem>
                    <SelectItem value="term2">Term 2</SelectItem>
                    <SelectItem value="term3">Term 3</SelectItem>
                    <SelectItem value="term4">Term 4</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.termId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.termId.message}
              </p>
            )}
          </div>

          {/* Academic Year (Read-only) */}
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">
                {activeAcademicYear?.year || 'N/A'}
              </span>
              <Badge variant="outline" className="ml-auto">
                Active
              </Badge>
            </div>
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This assignment links a teacher to teach a specific subject in a class for the selected term.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isAssigning || !activeAcademicYear}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Teacher'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
