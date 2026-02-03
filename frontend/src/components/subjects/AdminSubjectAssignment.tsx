// src/components/subjects/AdminSubjectAssignmentDialog.tsx
import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Users, BookOpen } from 'lucide-react';
import { useClassSubjects } from '@/hooks/use-class-subjects';
import { useClassStudents } from '@/hooks/use-class-students';
import { useBulkEnrollStudentsInSubject } from '@/hooks/use-student-subject-enrollment';

interface AdminSubjectAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  academicYearId: string;
  termId: string;
  schoolId: string;
}

export function AdminSubjectAssignmentDialog({
  open,
  onOpenChange,
  classId,
  academicYearId,
  termId,
  schoolId,
}: AdminSubjectAssignmentDialogProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get class subjects
  const { data: classSubjectsData, isLoading: isLoadingSubjects } = useClassSubjects(
    classId,
    academicYearId,
    termId
  );

  // Get students in class
  const { data: studentsData, isLoading: isLoadingStudents } = useClassStudents(
    classId,
    academicYearId,
    termId
  );

  const { mutate: bulkEnroll } = useBulkEnrollStudentsInSubject();

  const classSubjects = classSubjectsData?.data?.data || [];
  const students = studentsData?.data?.data || [];

  // Filter subjects by category
  const electiveSubjects = classSubjects.filter(
    (cs: any) => ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'].includes(cs.subjectCategory)
  );
  const coreSubjects = classSubjects.filter(
    (cs: any) => cs.subjectCategory === 'CORE'
  );

  const selectedSubjectData = classSubjects.find((cs: any) => cs.id === selectedSubject);
  const isCoreSubject = selectedSubjectData?.subjectCategory === 'CORE';

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSubject('');
      setSelectedStudents([]);
      setSelectAll(false);
    }
  }, [open]);

  // Toggle select all students
  useEffect(() => {
    if (selectAll && students.length > 0) {
      setSelectedStudents(students.map((s: any) => s.id));
    } else if (!selectAll) {
      setSelectedStudents([]);
    }
  }, [selectAll, students]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (selectedStudents.length === 0 && !isCoreSubject) {
      toast.error('Please select at least one student');
      return;
    }

    setIsSubmitting(true);

    const enrollmentIds = isCoreSubject
      ? students.map((s: any) => s.id) // For core subjects, enroll all students
      : selectedStudents;

    bulkEnroll(
      {
        enrollmentIds,
        classSubjectId: selectedSubject,
        schoolId,
      },
      {
        onSuccess: () => {
          toast.success(
            `${enrollmentIds.length} student(s) enrolled in ${selectedSubjectData?.subject?.name}`
          );
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || 'Failed to enroll students'
          );
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Subject to Students</DialogTitle>
          <DialogDescription>
            Assign subjects to students in this class. Core subjects are automatically assigned to all students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subject Selection */}
          <div className="space-y-3">
            <Label>Select Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-gray-500">Core Subjects</p>
                </div>
                {coreSubjects.map((cs: any) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        CORE
                      </Badge>
                      <span>{cs.subject?.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-gray-500">Elective/Optional Subjects</p>
                </div>
                {electiveSubjects.map((cs: any) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {cs.subjectCategory}
                      </Badge>
                      <span>{cs.subject?.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubjectData && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedSubjectData.subject?.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedSubjectData.subject?.code} • {selectedSubjectData.subjectCategory}
                    </p>
                  </div>
                  <Badge
                    variant={isCoreSubject ? 'default' : 'outline'}
                    className="ml-auto"
                  >
                    {isCoreSubject ? 'Auto-assign to all' : 'Select specific students'}
                  </Badge>
                </div>
                {selectedSubjectData.teacherProfile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Teacher: {selectedSubjectData.teacherProfile.user.firstName}{' '}
                    {selectedSubjectData.teacherProfile.user.lastName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Student Selection (only for elective subjects) */}
          {!isCoreSubject && selectedSubject && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Students</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => setSelectAll(checked as boolean)}
                  />
                  <Label htmlFor="select-all" className="text-sm cursor-pointer">
                    Select all ({students.length} students)
                  </Label>
                </div>
              </div>

              {isLoadingStudents ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  {students.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No students enrolled in this class</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {students.map((student: any) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleStudentToggle(student.id)}
                        >
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {student.student?.firstName} {student.student?.lastName}
                            </Label>
                            <p className="text-sm text-gray-500">
                              Admission: {student.student?.admissionNo}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Core Subject Info */}
          {isCoreSubject && selectedSubject && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  Core Subject - Will be assigned to all {students.length} students
                </p>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                All students in this class will automatically be enrolled in this subject.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSubject || (isLoadingSubjects || isLoadingStudents)}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isCoreSubject
              ? `Assign to All Students (${students.length})`
              : `Assign to Selected Students (${selectedStudents.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}