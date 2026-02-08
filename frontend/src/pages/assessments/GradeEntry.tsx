import React, { useState } from 'react';
import { Save, Upload, Download, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useClasses, useClassStreams } from '@/hooks/use-academic';
import { useAssessments, useCreateBulkAssessments } from '@/hooks/use-assessments';
import { toast } from 'sonner';
import { useSchoolContext } from '@/hooks/use-school-context';

interface GradeEntry {
  studentId: string;
  studentName: string;
  admissionNo: string;
  numericValue?: number;
  grade?: string;
  competencyLevel?: string;
  comment?: string;
}

export default function GradeEntry() {
  const { schoolId } = useSchoolContext();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch classes
  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];

  // Fetch streams for selected class
  const { data: streamsData } = useClassStreams(selectedClass);
  const streams = streamsData || [];

  // Fetch assessments for selected class
  const { data: assessmentsData } = useAssessments({
    classId: selectedClass,
  });
  const assessments = assessmentsData?.data || [];

  // Get students for selected class/stream
  const selectedClassData = classes.find(c => c.id === selectedClass);
  const studentsInClass = selectedClassData?.students || [];
  const filteredStudents = selectedStream
    ? studentsInClass.filter(s => s.streamId === selectedStream)
    : studentsInClass;

  const { mutate: createBulkAssessments } = useCreateBulkAssessments();

  // Initialize grade entries when students are loaded
  React.useEffect(() => {
    if (filteredStudents.length > 0) {
      const entries = filteredStudents.map(student => ({
        studentId: student.studentId,
        studentName: `${student.student.firstName} ${student.student.lastName}`,
        admissionNo: student.student.admissionNo,
        numericValue: undefined,
        grade: '',
        competencyLevel: '',
        comment: '',
      }));
      setGradeEntries(entries);
    }
  }, [filteredStudents]);

  const updateGradeEntry = (studentId: string, field: keyof GradeEntry, value: any) => {
    setGradeEntries(prev =>
      prev.map(entry =>
        entry.studentId === studentId
          ? { ...entry, [field]: value }
          : entry
      )
    );
  };

  const handleSaveGrades = () => {
    if (!selectedAssessment) {
      toast.error('Please select an assessment');
      return;
    }

    const validEntries = gradeEntries.filter(entry =>
      entry.numericValue !== undefined ||
      entry.grade ||
      entry.competencyLevel
    );

    if (validEntries.length === 0) {
      toast.error('Please enter at least one grade');
      return;
    }

    const assessmentData = {
      assessmentDefId: selectedAssessment,
      results: validEntries.map(entry => ({
        studentId: entry.studentId,
        numericValue: entry.numericValue,
        grade: entry.grade || undefined,
        competencyLevel: entry.competencyLevel as any || undefined,
        comment: entry.comment || undefined,
      })),
    };

    setIsSaving(true);
    createBulkAssessments(assessmentData, {
      onSuccess: () => {
        toast.success('Grades saved successfully');
        // Reset form
        setGradeEntries([]);
        setSelectedAssessment('');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to save grades');
      },
      onSettled: () => {
        setIsSaving(false);
      },
    });
  };

  const columns: ColumnDef<GradeEntry>[] = [
    {
      accessorKey: 'admissionNo',
      header: 'Admission No.',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('admissionNo')}</span>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'Student Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('studentName')}</span>
      ),
    },
    {
      accessorKey: 'numericValue',
      header: 'Marks',
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <Input
            type="number"
            placeholder="e.g., 85"
            value={entry.numericValue || ''}
            onChange={(e) => updateGradeEntry(entry.studentId, 'numericValue', parseFloat(e.target.value) || undefined)}
            className="w-20"
          />
        );
      },
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <Select
            value={entry.grade}
            onValueChange={(value) => updateGradeEntry(entry.studentId, 'grade', value)}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="A" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="C+">C+</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="C-">C-</SelectItem>
              <SelectItem value="D+">D+</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="E">E</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'competencyLevel',
      header: 'Competency',
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <Select
            value={entry.competencyLevel}
            onValueChange={(value) => updateGradeEntry(entry.studentId, 'competencyLevel', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCEEDING_EXPECTATIONS">Exceeding</SelectItem>
              <SelectItem value="MEETING_EXPECTATIONS">Meeting</SelectItem>
              <SelectItem value="APPROACHING_EXPECTATIONS">Approaching</SelectItem>
              <SelectItem value="BELOW_EXPECTATIONS">Below</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'comment',
      header: 'Comments',
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <Input
            placeholder="Optional comment"
            value={entry.comment}
            onChange={(e) => updateGradeEntry(entry.studentId, 'comment', e.target.value)}
            className="w-32"
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grade Entry</h1>
          <p className="text-muted-foreground">
            Enter assessment grades for students in bulk
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Template
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Grades
          </Button>
        </div>
      </div>

      {/* Selection Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream">Stream (Optional)</Label>
              <Select
                value={selectedStream}
                onValueChange={setSelectedStream}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All streams</SelectItem>
                  {streams.map((stream: any) => (
                    <SelectItem key={stream.id} value={stream.id}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment</Label>
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.name} ({assessment.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry Table */}
      {selectedClass && gradeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Enter Grades</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {gradeEntries.length} students
                </Badge>
                <Button
                  onClick={handleSaveGrades}
                  disabled={isSaving || !selectedAssessment}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Grades'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={gradeEntries}
              pageSize={50}
            />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>How to Enter Grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">1. Select Class & Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  Choose the class and specific assessment you want to grade.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Enter Grades</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in marks, grades, competency levels, and comments for each student.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Save Grades</h4>
                <p className="text-sm text-muted-foreground">
                  Review your entries and save all grades at once.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">4. Bulk Import (Optional)</h4>
                <p className="text-sm text-muted-foreground">
                  For large classes, use CSV import to speed up the process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}