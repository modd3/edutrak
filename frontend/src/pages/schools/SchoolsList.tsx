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
import { useSchools, useDeleteSchool } from '@/hooks/use-schools';
import { School } from '@/types';
import { SCHOOL_TYPES } from '@/lib/constants';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { toast } from 'sonner';
import { SchoolDetailsModal } from '@/components/schools/SchoolDetailsModal'

export default function SchoolsList() {
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Fetch schools
  const { data: response, isLoading, isError } = useSchools({ page, limit: 10 });
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
            className="p-0 h-auto text-wrap justify-start hover:bg-blue-100 hover:from-accent/20 hover:to-accent/10 transition-all hover:shadow-md font-medium text-left duration-200"
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
        return (
          <Badge variant="outline">
            {ownership.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        return row.getValue('phone') || '-';
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        return row.getValue('email') || '-';
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
               Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(school)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(school)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
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
          <h1 className="text-3xl font-bold">Schools</h1>
          <p className="text-muted-foreground">
            Manage schools in the system
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={schools}
        pageSize={10}
      />

      {/* Create School Modal */}
      <SchoolFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        mode="create"
      />

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
              Are you sure you want to delete "{selectedSchool?.name}"? This action cannot be undone.
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
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}