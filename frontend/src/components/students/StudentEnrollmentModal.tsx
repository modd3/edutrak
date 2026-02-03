// src/components/students/StudentEnrollmentModal.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Student } from '@/types';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { useClasses } from '@/hooks/use-classes';
import { useClassStreams } from '@/hooks/use-academic';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUpdateEnrollment } from '@/hooks/use-students';
import { ElectiveSubjectSelectionDialog } from '@/components/subjects/ElectiveSubjectSelectionDialog';
import api from '@/api';
import { toast } from 'sonner';
import { UserPlus, Info, Pencil } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

const enrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  // Note: selectedSubjects removed - handled via StudentClassSubjectService
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface StudentEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  enrollment?: any; // For edit mode
  mode?: 'create' | 'edit';
}

export function StudentEnrollmentModal({ 
  open, 
  onOpenChange, 
  student,
  enrollment,
  mode = 'create'
}: StudentEnrollmentModalProps) {
  const { schoolId } = useSchoolContext();
  const queryClient = useQueryClient();
  
  // State for subject selection dialog
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const [newEnrollmentData, setNewEnrollmentData] = useState<any>(null);
  
  const { data: activeYearData, isLoading: isLoadingYear, error: yearError } = useActiveAcademicYear();
  const activeAcademicYear = activeYearData?.data || activeYearData;

  const { data: classesData, isLoading: isLoadingClasses, error: classesError } = useClasses({
    schoolId,
    academicYearId: activeAcademicYear?.id,
  });

  const { mutate: updateEnrollment, isPending: isUpdating } = useUpdateEnrollment();

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
  const { data: streamsResponse, isLoading: isLoadingStreams, error: streamsError } = useClassStreams(watchedClassId);
  
  // Extract streams data properly from React Query response
  const streamsData = streamsResponse?.data?.data || streamsResponse?.data || streamsResponse;
  const streams = Array.isArray(streamsData) ? streamsData : [];
  
  // Extract classes data properly
  const classes = Array.isArray(classesData) ? classesData : classesData?.data?.data || [];
  
  // Enroll mutation (create)
  const { mutate: createEnrollment, isPending: isCreating } = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const response = await api.post('/students/enroll', {
        studentId: data.studentId,
        classId: data.classId,
        streamId: data.streamId === 'none' ? undefined : data.streamId,
        academicYearId: data.academicYearId,
        schoolId,
      });
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      // Store enrollment data and show subject selection dialog
      setNewEnrollmentData(data);
      setShowSubjectSelection(true);
      toast.success('Student enrolled in class. Now select elective subjects.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error: any) => {
      console.error('Enrollment error:', error);
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    },
  });

  // Set form values when modal opens
  useEffect(() => {
    if (open && student) {
      form.setValue('studentId', student.id);
      
      if (mode === 'edit' && enrollment) {
        // Pre-fill form with existing enrollment data
        form.setValue('classId', enrollment.class?.id || enrollment.classId || '');
        form.setValue('streamId', enrollment.stream?.id || enrollment.streamId || '');
        form.setValue('academicYearId', enrollment.academicYear?.id || enrollment.academicYearId || '');
      } else {
        // Reset for create mode
        form.setValue('classId', '');
        form.setValue('streamId', '');
        form.setValue('academicYearId', activeAcademicYear?.id || '');
      }
    }
  }, [open, student, enrollment, mode, form, activeAcademicYear]);

  // Set academic year when it loads
  useEffect(() => {
    if (activeAcademicYear?.id && !enrollment) {
      form.setValue('academicYearId', activeAcademicYear.id);
    }
  }, [activeAcademicYear, form, enrollment]);

  // Reset stream when class changes
  useEffect(() => {
    if (mode === 'create') {
      form.setValue('streamId', '');
    }
  }, [watchedClassId, form, mode]);

  const onSubmit = async (data: EnrollmentFormData) => {
    if (mode === 'create') {
      createEnrollment(data);
    } else if (mode === 'edit' && enrollment) {
      updateEnrollment({
        enrollmentId: enrollment.id,
        data: {
          classId: data.classId,
          streamId: data.streamId,
          academicYearId: data.academicYearId,
        }
      });
    }
  };

  const isLoading = mode === 'create' ? isCreating : isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <UserPlus className="h-5 w-5" />
            ) : (
              <Pencil className="h-5 w-5" />
            )}
            {mode === 'create' ? 'Enroll Student' : 'Edit Enrollment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Assign student to a class and stream for the current academic year.'
              : 'Update student enrollment details.'}
          </DialogDescription>
        </DialogHeader>

        {(yearError || classesError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {yearError?.message || classesError?.message || 'Failed to load enrollment data'}
            </AlertDescription>
          </Alert>
        )}

        {!activeAcademicYear && !isLoadingYear && (
          <Alert variant="destructive">
            <AlertDescription>
              No active academic year found. Please set an active academic year first.
            </AlertDescription>
          </Alert>
        )}

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

          {/* Current Enrollment Info (Edit mode) */}
          {mode === 'edit' && enrollment && (
            <Alert variant="outline">
              <AlertDescription className="text-sm">
                <strong>Current Enrollment:</strong> {enrollment.class?.name}
                {enrollment.stream && ` - ${enrollment.stream.name}`}
                <br />
                <strong>Academic Year:</strong> {enrollment.academicYear?.year}
                <br />
                <strong>Status:</strong> {enrollment.status}
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
                    disabled={mode === 'edit'} // Can't change academic year in edit mode
                  >
                    <SelectTrigger className={mode === 'edit' ? 'bg-muted' : ''}>
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
              {mode === 'edit' 
                ? 'Academic year cannot be changed'
                : 'Students are enrolled in the active academic year'}
            </p>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Class *</Label>
            <Controller
              name="classId"
              control={form.control}
              render={({ field }) => (
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isLoadingClasses || !activeAcademicYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClasses ? "Loading classes..." : "Select class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {isLoadingClasses ? "Loading classes..." : "No classes available"}
                      </SelectItem>
                    ) : (
                      classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.level ? `- ${cls.level}` : ''}
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
          {(watchedClassId || (mode === 'edit' && enrollment?.streamId)) && (
            <div className="space-y-2">
              <Label>Stream (Optional)</Label>
              <Controller
                name="streamId"
                control={form.control}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                    disabled={isLoadingStreams}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingStreams ? "Loading streams..." : "Select stream (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Stream --</SelectItem>
                      {streams.length === 0 ? (
                        <SelectItem value="no-streams" disabled>
                          {isLoadingStreams ? "Loading streams..." : "No streams in this class"}
                        </SelectItem>
                      ) : (
                        streams.map((stream: any) => (
                          <SelectItem key={stream.id} value={stream.id}>
                            {stream.name}
                            {stream.capacity ? ` (Capacity: ${stream.capacity})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {streamsError && (
                <p className="text-sm text-destructive">
                  Failed to load streams: {streamsError.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Select a stream if the class is divided into streams
              </p>
            </div>
          )}

          {/* Info Alert */}
          {mode === 'create' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                The student will be enrolled with <strong>ACTIVE</strong> status. 
                You can modify subjects and other details after enrollment.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading || isLoadingYear || isLoadingClasses}
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={isLoading || !activeAcademicYear || isLoadingYear || isLoadingClasses || classes.length === 0}
          >
            {isLoading ? 'Saving...' : mode === 'create' ? 'Enroll Student' : 'Update Enrollment'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Subject Selection Dialog - shown after enrollment success */}
      {newEnrollmentData && (
        <ElectiveSubjectSelectionDialog
          open={showSubjectSelection}
          onOpenChange={setShowSubjectSelection}
          classId={newEnrollmentData.classId}
          studentId={newEnrollmentData.studentId}
          enrollmentId={newEnrollmentData.id}
          schoolId={schoolId}
          onSuccess={() => {
            // Close enrollment modal after subject selection is complete
            setNewEnrollmentData(null);
            onOpenChange(false);
            form.reset();
          }}
        />
      )}
    </Dialog>
  );
}