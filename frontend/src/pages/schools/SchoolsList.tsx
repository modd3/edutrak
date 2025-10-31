import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSchools, useDeleteSchool } from '@/hooks/use-schools';
import { School } from '@/types';
import { SCHOOL_TYPES } from '@/lib/constants';

export default function SchoolsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Fetch schools
  const { data: schoolsData, isLoading, isError } = useSchools({ page, pageSize: 10 });
  const { mutate: deleteSchool, isPending: isDeleting } = useDeleteSchool();

  const handleDeleteClick = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedSchool) {
      deleteSchool(selectedSchool.id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setSelectedSchool(null);
        },
      });
    }
  };

  const columns: ColumnDef<School>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
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
      accessorKey: 'phone',
      header: 'Phone',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'actions',
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
              <DropdownMenuItem onClick={() => navigate(`/schools/${school.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/schools/${school.id}/edit`)}>
                Edit School
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(school)}
              >
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-destructive">Failed to load schools.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Schools</h1>
        <Button onClick={() => navigate('/schools/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create School
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={schoolsData?.data || []}
        searchKey="name"
      />

      {/* Pagination controls would go here, linked to setPage */}
      {/* This example uses the DataTable's internal pagination for the view */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the school
              "{selectedSchool?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}