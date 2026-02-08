// src/pages/assessments/GradeEntryPage.tsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Users } from 'lucide-react';
import { useAssessment } from '@/hooks/use-assessments';
import { useSubjectEnrollmentCount } from '@/hooks/use-student-subject-enrollment';
import { SubjectEnrollmentStatus } from '@/types';
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
import { Alert, AlertDescription } from '@/components/ui/alert';

export function GradeEntryPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  // Fetch assessment details
  const { data: assessmentData, isLoading: assessmentLoading } = useAssessment(assessmentId);
  const assessment = assessmentData?.data;

  // Fetch student count for this subject
  const { data: countData, isLoading: countLoading } = useSubjectEnrollmentCount(
    assessment?.classSubjectId,
    SubjectEnrollmentStatus.ACTIVE
  );
  const studentCount = countData?.count || 0;

  const isLoading = assessmentLoading || countLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assessment) {
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

  const isCoreSubject = assessment.classSubject?.subjectCategory === 'CORE';

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
              {assessment.classSubject?.stream && ` (${assessment.classSubject.stream.name})`}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <Badge className="mt-1">
                {assessment.type.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Subject Category</p>
              <Badge 
                variant={isCoreSubject ? "default" : "secondary"}
                className="mt-1"
              >
                {assessment.classSubject?.subjectCategory}
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
                {assessment._count?.results || 0} / {studentCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Count Alert */}
      {studentCount === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            {isCoreSubject 
              ? "No students enrolled in this class yet."
              : "No students have selected this subject. Students need to select elective subjects during enrollment."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            {isCoreSubject
              ? `${studentCount} students enrolled (Core subject - all students)`
              : `${studentCount} students have selected this subject`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Grade Entry Table */}
      {studentCount > 0 && (
        <GradeEntryTable
          assessmentId={assessmentId!}
          classSubjectId={assessment.classSubjectId}
          maxMarks={assessment.maxMarks || 100}
        />
      )}

      {/* CSV Upload Modal */}
      <CSVUpload
        open={showCSVUpload}
        onOpenChange={setShowCSVUpload}
        assessmentId={assessmentId!}
      />
    </div>
  );
}