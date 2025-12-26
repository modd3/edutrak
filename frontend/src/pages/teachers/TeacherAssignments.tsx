import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, UserPlus, Edit, Trash, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTeachers, useClassSubjects } from '@/hooks/use-teachers';
import { useClasses } from '@/hooks/use-academic';
import { Teacher } from '@/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSchoolContext } from '@/hooks/use-school-context';

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  termId: string;
  academicYearId: string;
  subjectCategory: string;
  class: {
    id: string;
    name: string;
    level: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacherProfile: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function TeacherAssignments() {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  // Fetch teachers
  const { data: teachersData, isLoading: teachersLoading } = useTeachers({
    schoolId,
    pageSize: 100,
  });

  // Fetch classes for filter
  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];

  // Get all class subjects from all classes
  const allClassSubjects: ClassSubject[] = [];
  classes.forEach(cls => {
    if (cls.subjects) {
      allClassSubjects.push(...(cls.subjects as ClassSubject[]));
    }
  });

  // Filter assignments
  const filteredAssignments = allClassSubjects.filter((assignment: ClassSubject) => {
    const matchesSearch =
      assignment.subject.name.toLowerCase().includes(search.toLowerCase()) ||
      assignment.class.name.toLowerCase().includes(search.toLowerCase()) ||
      (assignment.teacherProfile &&
        `${assignment.teacherProfile.user.firstName} ${assignment.teacherProfile.user.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()));

    const matchesClass = !classFilter || assignment.classId === classFilter;
    const matchesSubject = !subjectFilter || assignment.subjectId === subjectFilter;

    return matchesSearch && matchesClass && matchesSubject;
  });

  // Get unique subjects for filter
  const uniqueSubjects = Array.from(
    new Set(allClassSubjects.map(cs => cs.subjectId))
  ).map(subjectId => {
    const subject = allClassSubjects.find(cs => cs.subjectId === subjectId)?.subject;
    return subject ? { id: subjectId, name: subject.name, code: subject.code } : null;
  }).filter(Boolean);

  const columns: ColumnDef<ClassSubject>[] = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = row.original.subject;
        return (
          <div>
            <div className="font-medium">{subject.name}</div>
            <div className="text-sm text-muted-foreground">{subject.code}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const classData = row.original.class;
        return (
          <div>
            <div className="font-medium">{classData.name}</div>
            <div className="text-sm text-muted-foreground">{classData.level}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'teacherProfile',
      header: 'Assigned Teacher',
      cell: ({ row }) => {
        const teacher = row.original.teacherProfile;
        if (!teacher) {
          return <Badge variant="secondary">Unassigned</Badge>;
        }
        return (
          <div>
            <div className="font-medium">
              {teacher.user.firstName} {teacher.user.lastName}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'subjectCategory',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('subjectCategory')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Reassign Teacher
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Teacher
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Remove Assignment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (teachersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Assignments</h1>
          <p className="text-muted-foreground">
            Manage subject assignments to teachers by class and term
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Subject
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by subject, class, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} ({cls.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              subject && (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      <DataTable columns={columns} data={filteredAssignments} pageSize={20} />

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredAssignments.length} of {allClassSubjects.length} assignments
      </div>

      {/* Assignment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Assignments</h3>
          <p className="text-3xl font-bold text-blue-600">{allClassSubjects.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Assigned Teachers</h3>
          <p className="text-3xl font-bold text-green-600">
            {new Set(allClassSubjects.filter(cs => cs.teacherProfile).map(cs => cs.teacherId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Unassigned Subjects</h3>
          <p className="text-3xl font-bold text-orange-600">
            {allClassSubjects.filter(cs => !cs.teacherProfile).length}
          </p>
        </div>
      </div>
    </div>
  );
}