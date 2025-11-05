import { useNavigate, useParams } from 'react-router-dom';
import {useState} from 'react';
import { useClass, useClassStreams, useCreateStream, useDeleteStream } from '@/hooks/use-classes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PencilIcon, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {StudentClass} from '@/types'
import { ClassSubject } from '@/types';
import { StreamForm } from '@/components/classes/StreamForm';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/shared/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { Stream } from '@/types';
import { useClassEnrollments, useDeleteEnrollment } from '@/hooks/use-class-students';
import { useClassSubjects, useAssignSubject, useRemoveClassSubject } from '@/hooks/use-class-subjects';
import { EnrollStudentDialog } from '@/components/classes/EnrollStudentDialog';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ClassDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: classData, isLoading: isLoadingClass } = useClass(id!);
  const { data: streams, isLoading: isLoadingStreams } = useClassStreams(id!);
  const { mutate: createStream, isPending: isCreatingStream } = useCreateStream();
  const { mutate: deleteStream } = useDeleteStream();
  const { data: students, isLoading: isLoadingStudents } = useClassEnrollments(id!);
const { mutate: unenrollStudent } = useDeleteEnrollment();
const { mutate: removeClassSubject } = useRemoveClassSubject();
const { data: subjects, isLoading: isLoadingSubjects } = useClassSubjects(id!);
const { mutate: assignSubjects, isPending: isAssigningSubjects } = useAssignSubject();
const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

const studentColumns: ColumnDef<StudentClass>[] = [
  {
    accessorKey: 'student.admissionNo',
    header: 'Admission No',
  },
  {
    accessorKey: 'student.firstName',
    header: 'First Name',
    cell: ({ row }) => row.original.student?.firstName,
  },
  {
    accessorKey: 'student.lastName',
    header: 'Last Name',
    cell: ({ row }) => row.original.student?.lastName,
  },
  {
    accessorKey: 'stream.name',
    header: 'Stream',
    cell: ({ row }) => row.original.stream?.name || 'Not Assigned',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'ACTIVE' ? 'success' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (confirm('Are you sure you want to unenroll this student?')) {
            unenrollStudent(row.original.id);
          }
        }}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    ),
  },
];

const subjectColumns: ColumnDef<ClassSubject>[] = [
  {
    accessorKey: 'subject.name',
    header: 'Subject Name',
    cell: ({ row }) => row.original.subject?.name,
  },
  {
    accessorKey: 'subject.code',
    header: 'Code',
    cell: ({ row }) => row.original.subject?.code,
  },
  {
    accessorKey: 'teacher',
    header: 'Subject Teacher',
    cell: ({ row }) => {
      const teacher = row.original.teacher;
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned';
    },
  },
  {
    accessorKey: 'isCompulsory',
    header: 'Compulsory',
    cell: ({ row }) => (
      row.original.subjectCategory? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (confirm('Are you sure you want to remove this subject?')) {
            removeClassSubject(row.original.id);
          }
        }}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    ),
  },
];

  const streamColumns: ColumnDef<Stream>[] = [
    {
      accessorKey: 'name',
      header: 'Stream Name',
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
    },
    {
      accessorKey: 'streamTeacher',
      header: 'Stream Teacher',
      cell: ({ row }) => {
        const teacher = row.original.streamTeacher;
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('Are you sure you want to delete this stream?')) {
              deleteStream(row.original.id);
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoadingClass) {
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

  if (!classData) {
    return <div>Class not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/classes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <p className="text-muted-foreground">
              Level: {classData.level}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/classes/${id}/edit`)}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Class
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="streams">Streams</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Curriculum</p>
                  <Badge variant="secondary" className="mt-1">
                    {classData.curriculum}
                  </Badge>
                </div>
                {classData.pathway && (
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Pathway</p>
                    <Badge variant="secondary" className="mt-1">
                      {classData.pathway}
                    </Badge>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Class Teacher</p>
                  <p className="text-lg font-medium">
                    {classData.classTeacher
                      ? `${classData.classTeacher.firstName} ${classData.classTeacher.lastName}`
                      : 'Not Assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Streams</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stream
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Stream</DialogTitle>
                  </DialogHeader>
                  <StreamForm
                    classId={id!}
                    onSubmit={createStream}
                    isLoading={isCreatingStream}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={streamColumns}
                data={streams || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Enrolled Students</CardTitle>
      <EnrollStudentDialog classId={id!} />
    </CardHeader>
    <CardContent>
      {isLoadingStudents ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={studentColumns}
          data={students?.data || []}
          pageCount={Math.ceil((students?.total || 0) / 10)}
          pageSize={10}
        />
      )}
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="subjects">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Class Subjects</CardTitle>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Assign Subjects
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subjects to Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableSubjects?.data.map((subject) => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subject-${subject.id}`}
                  checked={selectedSubjects.includes(subject.id.toString())}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedSubjects([...selectedSubjects, subject.id.toString()]);
                    } else {
                      setSelectedSubjects(
                        selectedSubjects.filter((id) => id !== subject.id.toString())
                      );
                    }
                  }}
                />
                <Label htmlFor={`subject-${subject.id}`}>
                  {subject.name} ({subject.code})
                </Label>
              </div>
            ))}
            <Button
              onClick={() => {
                assignSubjects({
                  classId: id!,
                  subjectIds: selectedSubjects,
                });
              }}
              disabled={isAssigningSubjects}
              className="w-full"
            >
              {isAssigningSubjects ? 'Assigning...' : 'Assign Selected Subjects'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CardHeader>
    <CardContent>
      {isLoadingSubjects ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={subjectColumns}
          data={subjects?.data || []}
        />
      )}
    </CardContent>
  </Card>
</TabsContent>
      </Tabs>
    </div>
  );
}