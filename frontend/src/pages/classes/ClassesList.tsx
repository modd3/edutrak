// src/pages/classes/ClassesList.tsx
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye, Users } from 'lucide-react';
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
import {
   useActiveAcademicYear,
   useClasses, 
} from '@/hooks/use-academic';
import { useDeleteClass } from '@/hooks/use-classes';
import { Class } from '@/types';
import { ClassDetailsModal } from '@/components/classes/ClassDetailsModal';
import { ClassFormModal } from '@/components/classes/ClassFormModal';
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

const CURRICULUM_LABELS = {
  CBC: 'CBC',
  EIGHT_FOUR_FOUR: '8-4-4',
  TVET: 'TVET',
  IGCSE: 'IGCSE',
  IB: 'IB',
};

const CURRICULUM_COLORS = {
  CBC: 'default',
  EIGHT_FOUR_FOUR: 'secondary',
  TVET: 'outline',
  IGCSE: 'outline',
  IB: 'outline',
} as const;

export default function ClassesList() {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Get active academic year
  const { data: activeYearData } = useActiveAcademicYear();
  const activeAcademicYearId = activeYearData?.data?.id;


  // Fetch classes with filters
  const { data: classesData, isLoading, isError } = useClasses(activeAcademicYearId);

  const { mutate: deleteClass, isPending: isDeleting } = useDeleteClass();

  const classes = classesData?.data?.data || [];
  
  // Filter classes by search
  const filteredClasses = classes.filter((cls: Class) =>
    cls.name.toLowerCase().includes(search.toLowerCase()) ||
    cls.level.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteClick = (classData: Class) => {
    setSelectedClass(classData);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (classData: Class) => {
    setSelectedClass(classData);
    setShowEditModal(true);
  };

  const handleClassClick = (classData: Class) => {
    setSelectedClass(classData);
    setShowDetailsModal(true);
  };

  const confirmDelete = () => {
    if (selectedClass) {
      deleteClass(selectedClass.id, {
        onSuccess: () => {
          toast.success('Class deleted successfully');
          setShowDeleteDialog(false);
          setSelectedClass(null);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to delete class');
        },
      });
    }
  };

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'name',
      header: 'Class Name',
      cell: ({ row }) => {
        const classData = row.original;
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-wrap text-left justify-start"
            onClick={() => handleClassClick(classData)}
          >
            {classData.name}
          </Button>
        );
      },
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('level')}</span>
      ),
    },
    {
      accessorKey: 'curriculum',
      header: 'Curriculum',
      cell: ({ row }) => {
        const curriculum = row.getValue('curriculum') as keyof typeof CURRICULUM_LABELS;
        return (
          <Badge variant={CURRICULUM_COLORS[curriculum]}>
            {CURRICULUM_LABELS[curriculum]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'pathway',
      header: 'Pathway',
      cell: ({ row }) => {
        const pathway = row.original.pathway;
        if (!pathway) return <span className="text-sm text-muted-foreground">N/A</span>;
        
        const pathwayLabels = {
          STEM: 'STEM',
          ARTS_SPORTS: 'Arts & Sports',
          SOCIAL_SCIENCES: 'Social Sciences',
        };
        
        return (
          <Badge variant="outline">
            {pathwayLabels[pathway as keyof typeof pathwayLabels]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'classTeacher',
      header: 'Class Teacher',
      cell: ({ row }) => {
        const teacher = row.original.classTeacher;
        return (
          <span className="text-sm">
            {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not assigned'}
          </span>
        );
      },
    },
    {
      accessorKey: 'streams',
      header: 'Streams',
      cell: ({ row }) => {
        const streamsCount = row.original._count?.streams || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{streamsCount}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'students',
      header: 'Students',
      cell: ({ row }) => {
        const studentsCount = row.original._count?.students || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{studentsCount}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const classData = row.original;
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
              <DropdownMenuItem onClick={() => handleClassClick(classData)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(classData)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Class
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(classData)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Class
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
          <p className="text-destructive text-lg mb-2">Failed to load classes</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Classes</h1>
          <p className="text-muted-foreground">
            View and manage academic classes
            {activeYearData?.data && (
              <> • Academic Year: {activeYearData.data.year}</>
            )}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by class name or level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={curriculumFilter} onValueChange={setCurriculumFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by curriculum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Curricula</SelectItem>
            {Object.entries(CURRICULUM_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Classes Table */}
      <DataTable columns={columns} data={filteredClasses} pageSize={20} />

      {/* Summary */}
      {classesData && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredClasses.length} of {classes.length} classes
        </div>
      )}

      {/* Create Class Modal */}
      <ClassFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
        mode="create" 
      />

      {/* Edit Class Modal */}
      {selectedClass && (
        <ClassFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          mode="edit"
          classData={selectedClass}
        />
      )}

      {/* Class Details Modal */}
      {selectedClass && (
        <ClassDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          classData={selectedClass}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This action cannot be undone 
              and will remove all associated data including streams, students, and subjects.
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
