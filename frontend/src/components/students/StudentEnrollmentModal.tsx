// src/components/students/StudentEnrollmentModal.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Student } from '@/types';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useClasses } from '@/hooks/use-classes';
import { useClassStreams } from '@/hooks/use-classes';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';
import { toast } from 'sonner';
import { UserPlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface StudentEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
}

export function StudentEnrollmentModal({ 
  open, 
  onOpenChange, 
  student 
}: StudentEnrollmentModalProps) {
  const { schoolId } = useSchoolContext();
  const queryClient = useQueryClient();
  
  const { data: activeYearData } = useActiveAcademicYear();
  const activeAcademicYear = activeYearData?.data;

  const { data: classesData } = useClasses({
    schoolId,
    academicYearId: activeAcademicYear?.id,
  });

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentId: student?.id || '',
      classId: '',
      streamId: '',
      academicYearId: activeAcademicYear?.id || '',
    },
  });

  const watchedClassId = form.watch('classId');

  // Fetch streams when class is selected
  const { data: streamsData } = useClassStreams(watchedClassId, {
    enabled: !!watchedClassId,
  });

  const classes = classesData?.data || [];
  const streams = streamsData || [];

  // Enroll mutation
  const { mutate: enrollStudent, isPending: isEnrolling } = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const response = await api.post('/students/enroll', {
        ...data,
        schoolId,
        status: 'ACTIVE',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student enrolled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    },
  });

  // Set student ID when modal opens
  useEffect(() => {
    if (open && student) {
      form.setValue('studentId', student.id);
    }
  }, [open, student, form]);

  // Set academic year when it loads
  useEffect(() => {
    if (activeAcademicYear?.id) {
      form.setValue('academicYearId', activeAcademicYear.id);
    }
  }, [activeAcademicYear, form]);

  // Reset stream when class changes
  useEffect(() => {
    form.setValue('streamId', '');
  }, [watchedClassId, form]);

  const onSubmit = async (data: EnrollmentFormData) => {
    enrollStudent({
      ...data,
      streamId: data.streamId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Enroll Student
          </DialogTitle>
          <DialogDescription>
            Assign student to a class and stream for the current academic year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Student Info */}
          {student && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Student:</strong> {student.firstName} {student.lastName}
                <br />
                <strong>Admission No:</strong> {student.admissionNo}
              </AlertDescription>
            </Alert>
          )}

          {/* Academic Year */}
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Controller
              name="academicYearId"
              control={form.control}
              render={({ field }) => (
                <div className="relative">
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAcademicYear && (
                        <SelectItem value={activeAcademicYear.id}>
                          {activeAcademicYear.year} (Active)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Students are enrolled in the active academic year
            </p>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Class *</Label>
            <Controller
              name="classId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
                          {cls.name} - {cls.level}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.classId && (
              <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>
            )}
          </div>

          {/* Stream Selection */}
          {watchedClassId && (
            <div className="space-y-2">
              <Label>Stream (Optional)</Label>
              <Controller
                name="streamId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Stream --</SelectItem>
                      {streams.length === 0 ? (
                        <SelectItem value="no-streams" disabled>
                          No streams in this class
                        </SelectItem>
                      ) : (
                        streams.map((stream: any) => (
                          <SelectItem key={stream.id} value={stream.id}>
                            {stream.name}
                            {stream.capacity && ` (Capacity: ${stream.capacity})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Select a stream if the class is divided into streams
              </p>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              The student will be enrolled with <strong>ACTIVE</strong> status. 
              You can modify subjects and other details after enrollment.
            </AlertDescription>
          </Alert>
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isEnrolling}
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isEnrolling || !activeAcademicYear}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}