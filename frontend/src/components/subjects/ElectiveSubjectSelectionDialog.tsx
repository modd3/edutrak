// src/components/subjects/ElectiveSubjectSelectionDialog.tsx

import { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAvailableSubjectsForStudent, useEnrollStudentInSubject, useBulkEnrollStudentsInSubject } from '@/hooks/use-student-subject-enrollment';

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface ClassSubject {
  id: string;
  subject: Subject;
  subjectCategory: 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'TECHNICAL' | 'APPLIED';
}

interface ElectiveSubjectSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  studentId: string;
  enrollmentId: string;
  schoolId: string;
  onSuccess?: () => void;
}

export function ElectiveSubjectSelectionDialog({
  open,
  onOpenChange,
  classId,
  studentId,
  enrollmentId,
  schoolId,
  onSuccess,
}: ElectiveSubjectSelectionDialogProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available elective subjects
  const { data: availableSubjectsData, isLoading: isLoadingSubjects, error: subjectsError } = 
    useAvailableSubjectsForStudent(enrollmentId, classId, schoolId);
  
  const electiveSubjects = availableSubjectsData?.data || [];
  console.log("Available subjects data: ", availableSubjectsData);

  // Hooks for enrollment
  const { mutate: enrollSingleSubject } = useEnrollStudentInSubject();
  const { mutate: enrollBulkSubjects } = useBulkEnrollStudentsInSubject();

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSubjects([]);
    }
  }, [open]);

  const handleSubjectToggle = (classSubjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(classSubjectId)
        ? prev.filter((id) => id !== classSubjectId)
        : [...prev, classSubjectId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      // Allow closing without selecting any subjects
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Enroll student in each selected subject
      const enrollmentPromises = selectedSubjects.map(
        (classSubjectId) =>
          new Promise<void>((resolve, reject) => {
            enrollSingleSubject(
              {
                studentId,
                classSubjectId,
                enrollmentId,
                schoolId,
              },
              {
                onSuccess: () => resolve(),
                onError: (error: any) => {
                  toast.error(`Failed to enroll in subject: ${error.message}`);
                  reject(error);
                },
              }
            );
          })
      );

      await Promise.all(enrollmentPromises);
      
      toast.success(`Successfully enrolled in ${selectedSubjects.length} subject(s)`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error('Failed to complete subject enrollment');
      console.error('Subject enrollment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Allow students to skip elective selection
    toast.info('You can select electives later');
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Select Optional Subjects
          </DialogTitle>
          <DialogDescription>
            You have been automatically enrolled in all core subjects. 
            Select any elective or optional subjects you'd like to take.
          </DialogDescription>
        </DialogHeader>

        {subjectsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load subjects. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {isLoadingSubjects && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoadingSubjects && electiveSubjects.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No optional subjects available for this class.
            </AlertDescription>
          </Alert>
        )}

        {!isLoadingSubjects && electiveSubjects.length > 0 && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {electiveSubjects.map((classSubject: ClassSubject) => (
              <div
                key={classSubject.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => handleSubjectToggle(classSubject.id)}
              >
                <Checkbox
                  id={classSubject.id}
                  checked={selectedSubjects.includes(classSubject.id)}
                  onCheckedChange={() => handleSubjectToggle(classSubject.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={classSubject.id}
                    className="block font-medium text-sm cursor-pointer mb-1"
                  >
                    {classSubject.subject.name}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {classSubject.subject.code}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {classSubject.subjectCategory}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingSubjects}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {selectedSubjects.length > 0
              ? `Confirm (${selectedSubjects.length})`
              : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
