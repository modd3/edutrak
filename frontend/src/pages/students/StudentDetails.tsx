import { useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '@/hooks/use-students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PencilIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Assessment } from '@/types';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/students')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">
              Admission No: {student.admissionNo}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/students/${id}/edit`)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Student
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-medium">
                    {student.firstName} {student.middleName} {student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <Badge variant="secondary" className="mt-1">
                    {student.gender}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-lg font-medium">
                    {student.dob ? format(new Date(student.dob), 'dd MMMM yyyy') : 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Birth Certificate No.</p>
                  <p className="text-lg font-medium">
                    {student.birthCertNo || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NEMIS UPI</p>
                  <p className="text-lg font-medium">
                    {student.nemisUpi || 'Not provided'}
                  </p>
                </div>
              </div>

              {student.hasSpecialNeeds && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Special Needs Information</h3>
                  <div className="mt-2 space-y-2">
                    <p>Type: {student.specialNeedsType}</p>
                    <p>Medical Condition: {student.medicalCondition}</p>
                    <p>Allergies: {student.allergies}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Current Enrollment</CardTitle>
            </CardHeader>
            <CardContent>
              {student.enrollments && student.enrollments.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Class</p>
                      <p className="text-lg font-medium">
                        {student.enrollments[0].class.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stream</p>
                      <p className="text-lg font-medium">
                        {student.enrollments[0].stream?.name || 'Not Assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Academic Year</p>
                      <p className="text-lg font-medium">
                        {student.enrollments[0].academicYear.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant={student.enrollments[0].status === 'ACTIVE' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {student.enrollments[0].status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p>No current enrollment found</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
            </CardHeader>
            <CardContent>
              {student.enrollments && student.enrollments.length > 0 ? (
                <div className="space-y-4">
                  {student.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Class</p>
                          <p className="font-medium">{enrollment.class.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Academic Year</p>
                          <p className="font-medium">{enrollment.academicYear.year}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="secondary">
                            {enrollment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No enrollment history found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {student.assessments && student.assessments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.name}</TableCell>
                        <TableCell>{assessment.classSubject?.subject?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{assessment.type.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          {assessment.marksObtained !== null && assessment.maxMarks
                            ? `${assessment.marksObtained} / ${assessment.maxMarks}`
                            : assessment.competencyLevel?.replace(/_/g, ' ') || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {assessment.assessedDate
                            ? format(new Date(assessment.assessedDate), 'dd MMM yyyy')
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No assessments found for this student.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians">
          <Card>
            <CardHeader>
              <CardTitle>Guardians Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Implement guardians information */}
              <p>Student guardians information will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
