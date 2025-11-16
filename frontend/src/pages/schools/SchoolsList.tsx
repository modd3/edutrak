import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchools, useDeleteSchool } from '@/hooks/use-schools';
import { School, SchoolType } from '@/types';
import { SCHOOL_TYPES } from '@/lib/constants';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { SchoolDetailsModal } from '@/components/schools/SchoolDetailsModal';
import { toast } from 'sonner';

export default function SchoolsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Fetch schools with filters
  const { data: response, isLoading, isError } = useSchools({
    page,
    limit: 20,
    search,
    type: typeFilter === 'all' ? undefined : typeFilter as SchoolType,
  });
  const { mutate: deleteSchool, isPending: isDeleting } = useDeleteSchool();

  // Extract schools array from response
  const schools = response?.data?.data || [];
  const pagination = response?.data?.pagination;

  const handleDeleteClick = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (school: School) => {
    setSelectedSchool(school);
    setShowEditModal(true);
  };

  const handleSchoolNameClick = (school: School) => {
    setSelectedSchool(school);
    setShowDetailsModal(true);
  };

  const confirmDelete = () => {
    if (selectedSchool) {
      deleteSchool(selectedSchool.id, {
        onSuccess: () => {
          toast.success('School deleted successfully');
          setShowDeleteDialog(false);
          setSelectedSchool(null);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to delete school');
        },
      });
    }
  };

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const school = row.original;
        return (
          <Button
            variant="ghost"
            className="p-0 h-auto font-medium text-wrap hover:shadow hover:bg-green-50  text-left justify-start"
            onClick={() => handleSchoolNameClick(school)}
          >
            {school.name}
          </Button>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as keyof typeof SCHOOL_TYPES;
        return <Badge variant="secondary">{SCHOOL_TYPES[type]}</Badge>;
      },
    },
    {
      accessorKey: 'county',
      header: 'County',
    },
    {
      accessorKey: 'ownership',
      header: 'Ownership',
      cell: ({ row }) => {
        const ownership = row.getValue('ownership') as string;
        return <Badge variant="outline">{ownership.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        return row.getValue('phone') || 'N/A';
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        return row.getValue('email') || 'N/A';
      },
    },
    {
      accessorKey: '_count',
      header: 'Students',
      cell: ({ row }) => {
        const count = row.original._count;
        return count?.students || 0;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const school = row.original;
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
              <DropdownMenuItem onClick={() => handleSchoolNameClick(school)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(school)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit School
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(school)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete School
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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive text-lg mb-2">Failed to load schools</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Schools</h1>
          <p className="text-muted-foreground">View and manage schools in the system</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, county, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(SCHOOL_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={schools} pageSize={20} />

      {/* Pagination Info */}
      {pagination && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {schools.length} of {pagination.total} schools
        </div>
      )}

      {/* Create School Modal */}
      <SchoolFormModal open={showCreateModal} onOpenChange={setShowCreateModal} mode="create" />

      {/* Edit School Modal */}
      {selectedSchool && (
        <SchoolFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          mode="edit"
          school={selectedSchool}
        />
      )}

      {/* School Details Modal */}
      {selectedSchool && (
        <SchoolDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          school={selectedSchool}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete School</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSchool?.name}"? This action cannot
              be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}