// src/pages/students/[studentId]/subjects/StudentSubjectEnrollmentPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudent } from '@/hooks/use-students';
import { useAllStudentSubjectEnrollments } from '@/hooks/use-student-subject-enrollment';
import { ElectiveSubjectSelectionDialog } from '@/components/subjects/ElectiveSubjectSelectionDialog';
import { useSchoolContext } from '@/hooks/use-school-context';

export function StudentSubjectEnrollmentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const [showElectiveDialog, setShowElectiveDialog] = useState(false);

  // Get student details
  const { data: studentData, isLoading: isLoadingStudent } = useStudent(studentId as string);
  const student = studentData?.data;

  // Get student's subject enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useAllStudentSubjectEnrollments(studentId);
  const enrollments = enrollmentsData?.data || [];

  // Group enrollments by status
  const activeEnrollments = enrollments.filter((e: any) => e.status === 'ACTIVE');
  const droppedEnrollments = enrollments.filter((e: any) => e.status === 'DROPPED');

  // Group by class
  const enrollmentsByClass: Record<string, any[]> = {};
  activeEnrollments.forEach((enrollment: any) => {
    const className = enrollment.classSubject?.class?.name || 'Unknown Class';
    if (!enrollmentsByClass[className]) {
      enrollmentsByClass[className] = [];
    }
    enrollmentsByClass[className].push(enrollment);
  });

  if (isLoadingStudent || isLoadingEnrollments) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-96 bg-gray-200 rounded mt-2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Student not found</p>
          <Button onClick={() => navigate('/students')} className="mt-4">
            Back to Students
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/students/${studentId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-500 mt-1">
              Subject Enrollment Management • Admission: {student.admissionNo}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowElectiveDialog(true)}>
          <BookOpen className="w-4 h-4 mr-2" />
          Manage Electives
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Core Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEnrollments.filter((e: any) => 
                e.classSubject?.subjectCategory === 'CORE'
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Elective/Optional Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeEnrollments.filter((e: any) => 
                ['ELECTIVE', 'OPTIONAL', 'TECHNICAL', 'APPLIED'].includes(
                  e.classSubject?.subjectCategory
                )
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subject Enrollments</CardTitle>
          <CardDescription>
            Subjects this student is currently enrolled in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnrollments.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This student is not enrolled in any subjects.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {Object.entries(enrollmentsByClass).map(([className, classEnrollments]) => (
                <div key={className}>
                  <h3 className="font-semibold text-lg mb-3">{className}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classEnrollments.map((enrollment: any) => (
                      <Card key={enrollment.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {enrollment.classSubject?.subject?.name}
                              </CardTitle>
                              <CardDescription>
                                {enrollment.classSubject?.subject?.code}
                              </CardDescription>
                            </div>
                            <Badge variant={
                              enrollment.classSubject?.subjectCategory === 'CORE' 
                                ? 'default' 
                                : 'outline'
                            }>
                              {enrollment.classSubject?.subjectCategory}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Teacher:</span>
                              <span className="font-medium">
                                {enrollment.classSubject?.teacherProfile?.user?.firstName}{' '}
                                {enrollment.classSubject?.teacherProfile?.user?.lastName || 'Not assigned'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Enrolled:</span>
                              <span className="font-medium">
                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Status:</span>
                              <Badge variant="outline" className={
                                enrollment.status === 'ACTIVE' 
                                  ? 'bg-green-50 text-green-700' 
                                  : 'bg-red-50 text-red-700'
                              }>
                                {enrollment.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator className="my-6" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dropped Subjects */}
      {droppedEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dropped Subjects</CardTitle>
            <CardDescription>
              Subjects this student has dropped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {droppedEnrollments.map((enrollment: any) => (
                <Card key={enrollment.id} className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {enrollment.classSubject?.subject?.name}
                        </CardTitle>
                        <CardDescription>
                          {enrollment.classSubject?.subject?.code}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">DROPPED</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Dropped:</span>
                        <span className="font-medium">
                          {enrollment.droppedAt 
                            ? new Date(enrollment.droppedAt).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Elective Selection Dialog */}
      {student.currentEnrollmentId && (
        <ElectiveSubjectSelectionDialog
          open={showElectiveDialog}
          onOpenChange={setShowElectiveDialog}
          classId={student.currentClassId || ''}
          studentId={studentId!}
          enrollmentId={student.currentEnrollmentId}
          schoolId={schoolId}
          onSuccess={() => {
            // Refresh enrollments data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}