// src/pages/students/StudentsList.tsx
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye, UserPlus, Upload } from 'lucide-react';
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
import { useStudents, useUpdateStudent } from '@/hooks/use-students';
import { Student, EnrollmentStatus } from '@/types';
import { StudentDetailsModal } from '@/components/students/StudentDetailsModal';
import { StudentFormModal } from '@/components/students/StudentFormModal';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api';

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

export default function StudentsList() {
  const { schoolId } = useSchoolContext();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const queryClient = useQueryClient();

  // Fetch students with filters
  const { data: studentsData, isLoading, isError } = useStudents({
    schoolId,
    search: search,
    page,
    pageSize: 20,
  });

  // Delete mutation
  const { mutate: deleteStudent, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
      setShowDeleteDialog(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete student');
    },
  });

  const students = studentsData?.data || [];
  
  // Filter students by gender and status
  const filteredStudents = students.filter((student: Student) => {
    const matchesGender = !genderFilter || genderFilter === 'all' || student.gender === genderFilter;
    
    // Check enrollment status
    const hasActiveEnrollment = student.enrollments?.some(e => e.status === 'ACTIVE');
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && hasActiveEnrollment) ||
      (statusFilter === 'inactive' && !hasActiveEnrollment);
    
    return matchesGender && matchesStatus;
  });

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleEnrollClick = (student: Student) => {
    setSelectedStudent(student);
    setShowEnrollModal(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.id);
    }
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
            onClick={() => handleStudentClick(student)}
          >
            {fullName}
          </Button>
        );
      },
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('gender')}</Badge>
      ),
    },
    {
      accessorKey: 'enrollment',
      header: 'Class/Stream',
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
      accessorKey: 'status',
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
      accessorKey: 'specialNeeds',
      header: 'Special Needs',
      cell: ({ row }) => {
        const student = row.original;
        if (student.hasSpecialNeeds) {
          return <Badge variant="secondary">Yes</Badge>;
        }
        return <span className="text-sm text-muted-foreground">No</span>;
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
              <DropdownMenuItem onClick={() => handleStudentClick(student)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(student)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Student
              </DropdownMenuItem>
              {!hasActiveEnrollment && (
                <DropdownMenuItem onClick={() => handleEnrollClick(student)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll in Class
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(student)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Student
              </DropdownMenuItem>
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
          <p className="text-destructive text-lg mb-2">Failed to load students</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-muted-foreground">
            View and manage student records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
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
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Status */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Enrolled</TabsTrigger>
          <TabsTrigger value="inactive">Not Enrolled</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <DataTable columns={columns} data={filteredStudents} pageSize={20} />
        </TabsContent>
      </Tabs>

      {/* Summary */}
      {studentsData && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      )}

      {/* Create Student Modal */}
      <StudentFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
        mode="create" 
      />

      {/* Edit Student Modal */}
      {selectedStudent && (
        <StudentFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          mode="edit"
          student={selectedStudent}
        />
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          student={selectedStudent}
        />
      )}

      {/* Enroll Student Modal */}
      {selectedStudent && (
        <StudentEnrollmentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          student={selectedStudent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStudent?.firstName}{' '}
              {selectedStudent?.lastName}" (Admission No: {selectedStudent?.admissionNo})? 
              This action cannot be undone and will remove all associated data including 
              enrollments and assessment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
