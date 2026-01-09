// src/pages/teachers/TeachersList.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal, 
  Mail, 
  Phone 
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Teacher } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { TeacherFormModal } from '@/components/teachers/TeacherFormModal';
import { TeacherDetailsModal } from '@/components/teachers/TeacherDetailsModal';
import { useSchoolContext } from '@/hooks/use-school-context';
import { toast } from 'sonner';
import { teacherService } from '@/services/teacher.service';

export default function TeachersList() {
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>();
  const { schoolId, schoolName } = useSchoolContext();
  
  // Fetch teachers using the service
  const { 
    data: teachersData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['teachers', schoolId, search, employmentType],
    queryFn: () => teacherService.getAll({
      schoolId,
      search: search || undefined,
      employmentType: employmentType === 'all' ? undefined : employmentType
    }),
    enabled: !!schoolId,
  });

  const teachers = teachersData?.data || [];
  const totalTeachers = teachersData?.total || 0;

  useEffect(() => {
    if (error) {
      toast.error('Failed to load teachers');
      console.error('Error loading teachers:', error);
    }
  }, [error]);

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailsOpen(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedTeacher) {
      try {
        await teacherService.delete(selectedTeacher.id);
        toast.success('Teacher deleted successfully');
        setShowDeleteDialog(false);
        refetch();
      } catch (error) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: 'employeeNumber',
      header: 'Emp No.',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.employeeNumber || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'tscNumber',
      header: 'TSC Number',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.tscNumber || 'N/A'}
        </div>
      ),
    },
    {
      id: 'name',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div>
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-wrap text-left justify-start"
              onClick={() => handleViewDetails(teacher)}
            >
              {teacher.user?.firstName} {teacher.user?.lastName}
            </Button>
            {teacher.user?.middleName && (
              <div className="text-xs text-gray-500">{teacher.user.middleName}</div>
            )}
          </div>
        );
      },
    },
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="space-y-1">
            {teacher.user?.email && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {teacher.user.email}
              </div>
            )}
            {teacher.user?.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {teacher.user.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'employmentType',
      header: 'Employment',
      cell: ({ row }) => {
        const type = row.getValue('employmentType') as string;
        const getVariant = () => {
          switch(type) {
            case 'PERMANENT': return 'default';
            case 'CONTRACT': return 'secondary';
            case 'TEMPORARY': return 'outline';
            case 'BOM': return 'destructive';
            case 'PTA': return 'secondary'; // Changed to secondary as success isn't standard in shadcn badges
            default: return 'secondary';
          }
        };
        
        return (
          <Badge variant={getVariant()}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'qualification',
      header: 'Qualification',
      cell: ({ row }) => (
        <div className="text-sm max-w-[150px] truncate">
          {row.original.qualification || 'N/A'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const teacher = row.original;
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
              <DropdownMenuItem onClick={() => handleViewDetails(teacher)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Teacher
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => handleDeleteClick(teacher)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Teacher
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Teachers</h1>
          <p className="text-muted-foreground">
            View and manage teaching staff records
          </p>
        </div>
        <Button onClick={() => {
          setSelectedTeacher(undefined);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, TSC number, or email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={employmentType}
          onValueChange={(value) => setEmploymentType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Employment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PERMANENT">Permanent</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="TEMPORARY">Temporary</SelectItem>
            <SelectItem value="BOM">BOM</SelectItem>
            <SelectItem value="PTA">PTA</SelectItem>
          </SelectContent>
        </Select>
        { (search || employmentType !== 'all') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('');
                setEmploymentType('all');
              }}
            >
              Clear Filters
            </Button>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load teachers</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : !schoolId ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No School Selected</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Please select a school to view teachers.
            </p>
          </div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Plus className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No teachers found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {search || employmentType !== 'all' 
                ? 'No teachers match your search criteria.' 
                : 'Get started by adding your first teacher to the system.'}
            </p>
            <Button onClick={() => {
              setSelectedTeacher(undefined);
              setIsFormOpen(true);
            }} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <DataTable
              columns={columns}
              data={teachers}
              pagination={{
                pageSize: 10,
                pageIndex: 0,
                pageCount: Math.ceil(totalTeachers / 10),
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
             Showing {teachers.length} of {totalTeachers} teachers
          </div>
        </>
      )}

      {/* Teacher Form Modal */}
      <TeacherFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={selectedTeacher ? 'edit' : 'create'}
        teacher={selectedTeacher}
      />

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <TeacherDetailsModal
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          teacher={selectedTeacher}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedTeacher?.user?.firstName} {selectedTeacher?.user?.lastName}</strong>? 
              This action cannot be undone and will remove all associated data including class assignments and assessment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}