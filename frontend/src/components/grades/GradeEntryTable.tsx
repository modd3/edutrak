// src/components/grades/GradeEntryTable.tsx

import { useState, useEffect } from 'react';
import { Save, Upload, Download, AlertCircle, Loader2 } from 'lucide-react';
import { useAssessmentResults } from '@/hooks/use-grades';
import { useBulkGradeEntry } from '@/hooks/use-grades';
import { useStudentsEnrolledInSubject } from '@/hooks/use-student-subject-enrollment';
import { SubjectEnrollmentStatus } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
}

interface GradeEntryTableProps {
  assessmentId: string;
  classSubjectId: string;  // ✅ Changed: now takes classSubjectId instead of students array
  maxMarks?: number;
  onClose?: () => void;
}

interface GradeEntry {
  studentId: string;
  marks: string;
  comment: string;
}

export function GradeEntryTable({
  assessmentId,
  classSubjectId,
  maxMarks = 100,
  onClose,
}: GradeEntryTableProps) {
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // ✅ NEW: Fetch students enrolled in this specific subject
  const { data: subjectRosterData, isLoading: isLoadingRoster, error: rosterError } = useStudentsEnrolledInSubject(classSubjectId, { status: SubjectEnrollmentStatus.ACTIVE });
  const students = subjectRosterData?.data?.map((item) => item.student) || [];
 
  const { data: existingResults, isLoading: isLoadingResults } = useAssessmentResults(assessmentId);
  const bulkEntryMutation = useBulkGradeEntry();

  // Initialize grades from existing results
  useEffect(() => {
    if (existingResults?.data) {
      const initialGrades: Record<string, GradeEntry> = {};
      existingResults.data.forEach((result: any) => {
        initialGrades[result.studentId] = {
          studentId: result.studentId,
          marks: result.numericValue?.toString() || '',
          comment: result.comment || '',
        };
      });
      setGrades(initialGrades);
    }
  }, [existingResults]);

  const handleMarksChange = (studentId: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        marks: value,
        comment: prev[studentId]?.comment || '',
      },
    }));
    setHasChanges(true);
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        marks: prev[studentId]?.marks || '',
        comment: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const entries = Object.values(grades)
      .filter((grade) => grade.marks !== '')
      .map((grade) => ({
        studentId: grade.studentId,
        marks: parseFloat(grade.marks),
        comment: grade.comment || undefined,
      }));

    if (entries.length === 0) {
      return;
    }

    await bulkEntryMutation.mutateAsync({
      assessmentDefId: assessmentId,
      entries,
    });

    setHasChanges(false);
  };

  const downloadTemplate = () => {
    const csv = [
      ['Admission No', 'Student Name', 'Marks', 'Comment'],
      ...students.map((student) => [
        student.admissionNo,
        `${student.firstName} ${student.lastName}`,
        '',
        '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grade_entry_template.csv';
    a.click();
  };

  const getGradeColor = (marks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLetterGrade = (marks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
  };

  if (isLoadingRoster || isLoadingResults) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Grade Entry</CardTitle>
            <CardDescription>
              Enter marks for {students.length} students (Max: {maxMarks})
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={isLoadingRoster || students.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || bulkEntryMutation.isPending || isLoadingRoster}
            >
              <Save className="mr-2 h-4 w-4" />
              {bulkEntryMutation.isPending ? 'Saving...' : 'Save Grades'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error state */}
        {rosterError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load student roster: {rosterError.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoadingRoster && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span>Loading enrolled students...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoadingRoster && students.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No students are enrolled in this subject yet.
            </AlertDescription>
          </Alert>
        )}

        {/* Grade entry table */}
        {!isLoadingRoster && students.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Adm No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">Marks</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const grade = grades[student.id];
                  const marks = grade?.marks ? parseFloat(grade.marks) : null;

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">
                      {student.admissionNo}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={maxMarks}
                        step="0.5"
                        value={grade?.marks || ''}
                        onChange={(e) =>
                          handleMarksChange(student.id, e.target.value)
                        }
                        placeholder="0"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      {marks !== null && (
                        <Badge
                          className={getGradeColor(marks)}
                          variant="secondary"
                        >
                          {getLetterGrade(marks)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={grade?.comment || ''}
                        onChange={(e) =>
                          handleCommentChange(student.id, e.target.value)
                        }
                        placeholder="Optional comment"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}

        {hasChanges && !isLoadingRoster && students.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save Grades" to save your entries.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
