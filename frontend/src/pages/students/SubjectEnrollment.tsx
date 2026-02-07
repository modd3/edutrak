// src/pages/students/[studentId]/subjects/StudentSubjectEnrollmentPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStudent } from '@/hooks/use-students';
import {
  useAllStudentSubjectEnrollments,
  useDropStudentFromSubject,
  useUpdateSubjectEnrollmentStatus,
} from '@/hooks/use-student-subject-enrollment';
import { ElectiveSubjectSelectionDialog } from '@/components/subjects/ElectiveSubjectSelectionDialog';
import { useSchoolContext } from '@/hooks/use-school-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function StudentSubjectEnrollmentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const [showElectiveDialog, setShowElectiveDialog] = useState(false);
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [subjectToDrop, setSubjectToDrop] = useState<any>(null);

  const { mutate: dropSubject, isPending: isDropping } =
    useDropStudentFromSubject();

  const { mutate: updateStatus, isPending: isUpdating } = useUpdateSubjectEnrollmentStatus();

  const handleReEnroll = (enrollment: any) => {
    updateStatus({
      enrollmentId: enrollment.id,
      status: 'ACTIVE',
      schoolId: schoolId!,
    });
  };

  const handleDropSubject = (enrollment: any) => {
    setSubjectToDrop(enrollment);
    setShowDropConfirm(true);
  };

  const confirmDrop = () => {
    if (subjectToDrop) {
      dropSubject(
        {
          enrollmentId: subjectToDrop.enrollmentId,
          classSubjectId: subjectToDrop.classSubjectId,
          schoolId: schoolId!,
        },
        {
          onSuccess: () => {
            setShowDropConfirm(false);
            setSubjectToDrop(null);
          },
        }
      );
    }
  };


  // Get student details
  const { data: studentData, isLoading: isLoadingStudent } = useStudent(studentId as string);
  const student = studentData;

  // Get student's subject enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useAllStudentSubjectEnrollments(studentId);
  const enrollments = enrollmentsData?.data || [];

  // Find the student's active class enrollment (not subject enrollment)
  const activeClassEnrollment = student?.enrollments?.find(
    (e: any) => e.status === 'ACTIVE'
  );

  // Group enrollments by status
  const activeEnrollments = enrollments.filter((e: any) => e.status === 'ACTIVE');
  const droppedEnrollments = enrollments.filter((e: any) => e.status === 'DROPPED');

  // Group by class
  const enrollmentsByClass: Record<string, any[]> = {};
  activeEnrollments.forEach((enrollment: any) => {
    const className = 
      enrollment.classSubject?.class?.name || 
      (enrollment.enrollmentId === activeClassEnrollment?.id ? activeClassEnrollment?.class?.name : null) ||
      'Unknown Class';
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
            onClick={() => navigate(`/students/`)}
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
                                {(() => {
                                  const user = enrollment.classSubject?.teacherProfile?.user || enrollment.classSubject?.teacher?.user;
                                  return user ? `${user.firstName} ${user.lastName}` : 'Not assigned';
                                })()}
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
                        {enrollment.classSubject?.subjectCategory !== 'CORE' && (
                          <CardFooter>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDropSubject(enrollment)}
                              disabled={isDropping}
                            >
                              Drop Subject
                            </Button>
                          </CardFooter>
                        )}
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
                      <div className="pt-2 mt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleReEnroll(enrollment)}
                          disabled={isUpdating}
                        >
                          Re-enroll Subject
                        </Button>
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
      {activeClassEnrollment && schoolId && (activeClassEnrollment.classId || activeClassEnrollment.class?.id) && (
        <ElectiveSubjectSelectionDialog
          open={showElectiveDialog}
          onOpenChange={setShowElectiveDialog}
          classId={activeClassEnrollment.classId || activeClassEnrollment.class?.id!}
          studentId={studentId!}
          enrollmentId={activeClassEnrollment.id}
          schoolId={schoolId}
          onSuccess={() => {
            // Refresh enrollments data
            window.location.reload();
          }}
        />
      )}

      {/* Confirmation Dialog for Dropping Subject */}
      <AlertDialog open={showDropConfirm} onOpenChange={setShowDropConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the subject{' '}
              <span className="font-semibold">
                {subjectToDrop?.classSubject?.subject?.name}
              </span>{' '}
              as DROPPED for {student.firstName}. You can re-enroll the student
              later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDropping}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDrop}
              disabled={isDropping}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDropping ? 'Dropping...' : 'Confirm Drop'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}