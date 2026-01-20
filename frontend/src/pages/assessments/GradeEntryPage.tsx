// src/pages/assessments/GradeEntryPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useAssessment } from '@/hooks/use-assessments';
import { GradeEntryTable } from '@/components/grades/GradeEntryTable';
import { CSVUpload } from '@/components/grades/CSVUpload';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function GradeEntryPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  const { data, isLoading } = useAssessment(assessmentId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Assessment not found</p>
          <Button onClick={() => navigate('/assessments')} className="mt-4">
            Back to Assessments
          </Button>
        </CardContent>
      </Card>
    );
  }

  const assessment = data.data;

  // TODO: Fetch students from the class
  const students = [
    {
      id: '1',
      admissionNo: 'STU-2024-00001',
      firstName: 'John',
      lastName: 'Doe',
    },
    {
      id: '2',
      admissionNo: 'STU-2024-00002',
      firstName: 'Jane',
      lastName: 'Smith',
    },
    // ... more students
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/assessments')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{assessment.name}</h1>
            <p className="text-gray-500 mt-1">
              {assessment.classSubject?.subject?.name} -{' '}
              {assessment.classSubject?.class?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCSVUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      {/* Assessment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <Badge className="mt-1">
                {assessment.type.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maximum Marks</p>
              <p className="font-semibold mt-1">
                {assessment.maxMarks || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Term</p>
              <p className="font-semibold mt-1">{assessment.term?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Results Entered</p>
              <p className="font-semibold mt-1">
                {assessment._count?.results || 0} / {students.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry Table */}
      <GradeEntryTable
        assessmentId={assessmentId!}
        students={students}
        maxMarks={assessment.maxMarks || 100}
      />

      {/* CSV Upload Modal */}
      <CSVUpload
        open={showCSVUpload}
        onOpenChange={setShowCSVUpload}
        assessmentId={assessmentId!}
      />
    </div>
  );
}
