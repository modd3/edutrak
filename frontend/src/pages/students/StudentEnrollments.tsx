import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, UserPlus, Edit, Trash, Eye, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useStudents, useEnrollStudent, usePromoteStudents } from '@/hooks/use-students';
import { Student } from '@/types';
import { StudentEnrollmentModal } from '@/components/students/StudentEnrollmentModal';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useSchoolContext } from '@/hooks/use-school-context';

const ENROLLMENT_STATUS_LABELS = {
  ACTIVE: 'Active',
  PROMOTED: 'Promoted',
  TRANSFERRED: 'Transferred',
  GRADUATED: 'Graduated',
  DROPPED_OUT: 'Dropped Out',
  SUSPENDED: 'Suspended',
};

const ENROLLMENT_STATUS_COLORS = {
  ACTIVE: 'default',
  PROMOTED: 'secondary',
  TRANSFERRED: 'outline',
  GRADUATED: 'outline',
  DROPPED_OUT: 'destructive',
  SUSPENDED: 'destructive',
} as const;

export default function StudentEnrollments() {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students with enrollments
  const { data: studentsData, isLoading, isError } = useStudents({
    schoolId,
    search,
    pageSize: 50,
  });

  const { mutate: enrollStudent } = useEnrollStudent();
  const { mutate: promoteStudents } = usePromoteStudents();

  const students = studentsData?.data || [];

  // Filter students based on enrollment status
  const filteredStudents = students.filter((student: Student) => {
    const hasActiveEnrollment = student.enrollments?.some(e => e.status === 'ACTIVE');
    const hasAnyEnrollment = student.enrollments && student.enrollments.length > 0;

    if (statusFilter === 'enrolled') return hasActiveEnrollment;
    if (statusFilter === 'not_enrolled') return !hasAnyEnrollment;
    return true; // 'all'
  });

  const handleEnrollClick = (student: Student) => {
    setSelectedStudent(student);
    setShowEnrollModal(true);
  };

  const handlePromoteClick = (student: Student) => {
    setSelectedStudent(student);
    setShowPromoteModal(true);
  };

  const handleEnrollment = (enrollmentData: any) => {
    enrollStudent(enrollmentData, {
      onSuccess: () => {
        toast.success('Student enrolled successfully');
        setShowEnrollModal(false);
        setSelectedStudent(null);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to enroll student');
      },
    });
  };

  const handlePromotion = (promotionData: any) => {
    promoteStudents(promotionData, {
      onSuccess: () => {
        toast.success('Students promoted successfully');
        setShowPromoteModal(false);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to promote students');
      },
    });
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'admissionNo',
      header: 'Admission No.',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('admissionNo')}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Full Name',
      cell: ({ row }) => {
        const student = row.original;
        const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-wrap text-left justify-start"
            onClick={() => {/* TODO: Navigate to student details */}}
          >
            {fullName}
          </Button>
        );
      },
    },
    {
      accessorKey: 'currentEnrollment',
      header: 'Current Class/Stream',
      cell: ({ row }) => {
        const student = row.original;
        const activeEnrollment = student.enrollments?.find(e => e.status === 'ACTIVE');

        if (!activeEnrollment) {
          return <span className="text-sm text-muted-foreground">Not enrolled</span>;
        }

        return (
          <div className="text-sm">
            <div className="font-medium">{activeEnrollment.class?.name}</div>
            {activeEnrollment.stream && (
              <div className="text-xs text-muted-foreground">
                Stream: {activeEnrollment.stream.name}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'enrollmentStatus',
      header: 'Status',
      cell: ({ row }) => {
        const student = row.original;
        const activeEnrollment = student.enrollments?.find(e => e.status === 'ACTIVE');
        const status = activeEnrollment?.status || 'INACTIVE';

        if (!activeEnrollment) {
          return <Badge variant="secondary">Not Enrolled</Badge>;
        }

        return (
          <Badge variant={ENROLLMENT_STATUS_COLORS[status as keyof typeof ENROLLMENT_STATUS_COLORS]}>
            {ENROLLMENT_STATUS_LABELS[status as keyof typeof ENROLLMENT_STATUS_LABELS] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'enrollmentHistory',
      header: 'Enrollment History',
      cell: ({ row }) => {
        const student = row.original;
        const enrollmentCount = student.enrollments?.length || 0;
        return (
          <span className="text-sm text-muted-foreground">
            {enrollmentCount} enrollment{enrollmentCount !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const student = row.original;
        const hasActiveEnrollment = student.enrollments?.some(e => e.status === 'ACTIVE');

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
              {!hasActiveEnrollment && (
                <DropdownMenuItem onClick={() => handleEnrollClick(student)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll in Class
                </DropdownMenuItem>
              )}
              {hasActiveEnrollment && (
                <DropdownMenuItem onClick={() => handlePromoteClick(student)}>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Promote/Transfer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Failed to load student enrollments</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Enrollments</h1>
          <p className="text-muted-foreground">
            Manage student enrollments, promotions, and transfers
          </p>
        </div>
        <Button onClick={() => setShowEnrollModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="enrolled">Currently Enrolled</TabsTrigger>
          <TabsTrigger value="not_enrolled">Not Enrolled</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <DataTable columns={columns} data={filteredStudents} pageSize={20} />
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Enrollment Modal */}
      {selectedStudent && (
        <StudentEnrollmentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          student={selectedStudent}
          onEnroll={handleEnrollment}
        />
      )}

      {/* Promotion Modal - TODO: Implement */}
      {showPromoteModal && (
        <div> {/* TODO: Implement StudentPromotionModal */} </div>
      )}
    </div>
  );
}