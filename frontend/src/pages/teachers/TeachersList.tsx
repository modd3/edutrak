import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Edit, Trash2, Eye, Filter, Mail, Phone } from 'lucide-react';
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
    enabled: !!schoolId, // Only fetch if we have a schoolId
  });

  // Extract teachers from response
  const teachers = teachersData?.data || [];
  console.log("Teachers data: ", teachersData);
  console.log("Teachers : ", teachers);
  const totalTeachers = teachersData?.total || 0;

  // Handle errors
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

  const handleDelete = async (teacherId: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teacherService.delete(teacherId);
        toast.success('Teacher deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailsOpen(true);
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
            <div className="font-medium">
              {teacher.user?.firstName} {teacher.user?.lastName}
            </div>
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
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                {teacher.user.email}
              </div>
            )}
            {teacher.user?.phone && (
              <div className="flex items-center gap-1 text-sm">
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
            case 'PTA': return 'success';
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
      accessorKey: 'dateJoined',
      header: 'Date Joined',
      cell: ({ row }) => {
        const date = row.original.dateJoined;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(teacher)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(teacher)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleViewDetails(teacher)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(teacher.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Loading state
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
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            {schoolName ? `Teachers at ${schoolName}` : 'Manage teaching staff'}
            {totalTeachers > 0 && ` (${totalTeachers} teachers)`}
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers by name, TSC number, or email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={employmentType}
          onValueChange={(value) => {
            setEmploymentType(value);
          }}
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
        <Button
          variant="outline"
          onClick={() => {
            setSearch('');
            setEmploymentType('all');
          }}
        >
          Clear Filters
        </Button>
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
                ? 'No teachers match your search criteria. Try adjusting your filters.' 
                : 'Get started by adding your first teacher to the system.'}
            </p>
            <Button onClick={() => {
              setSelectedTeacher(undefined);
              setIsFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>
        </div>
      ) : (
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
    </div>
  );
}