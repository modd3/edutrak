import { useNavigate, useParams } from 'react-router-dom';
import { useTeacher, useTeacherWorkload } from '@/hooks/use-teachers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PencilIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TeacherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: teacher, isLoading } = useTeacher(id!);
  const { data: workload, isLoading: isLoadingWorkload } = useTeacherWorkload(id!);

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

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/teachers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {teacher.user.firstName} {teacher.user.lastName}
            </h1>
            <p className="text-muted-foreground">
              TSC Number: {teacher.tscNumber}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/teachers/${id}/edit`)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Teacher
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-lg font-medium">
                    {teacher.user.firstName} {teacher.user.middleName}{' '}
                    {teacher.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Type</p>
                  <Badge variant="secondary" className="mt-1">
                    {teacher.employmentType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-medium">{teacher.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-lg font-medium">{teacher.user.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">TSC Number</p>
                  <p className="text-lg font-medium">{teacher.tscNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualification</p>
                  <p className="text-lg font-medium">{teacher.qualification}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialization</p>
                  <p className="text-lg font-medium">
                    {teacher.specialization || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Joined</p>
                  <p className="text-lg font-medium">
                    {teacher.dateJoined
                      ? new Date(teacher.dateJoined).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Workload</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingWorkload ? (
                <Skeleton className="h-40 w-full" />
              ) : workload ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Assigned Subjects</p>
                      <p className="text-2xl font-bold">{workload.subjectCount}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Assigned Classes</p>
                      <p className="text-2xl font-bold">{workload.classCount}</p>
                    </div>
                  </div>
                  <h4 className="font-semibold">Subject Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workload.subjects.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.subject.name}</TableCell>
                          <TableCell>{s.class.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{s.subjectCategory}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p>No workload information available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle>Class Timetable</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Implement timetable display here */}
              <p>Teacher's timetable will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
