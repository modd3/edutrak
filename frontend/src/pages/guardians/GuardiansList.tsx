// src/pages/guardians/GuardiansList.tsx
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye, Phone, Mail } from 'lucide-react';
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
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { useGuardians, useDeleteGuardian } from '@/hooks/use-guardians';
import { GuardianResponse } from '@/services/guardian.service';
import { GuardianFormModal } from '@/components/guardians/GuardianFormModal';
import { GuardianDetailsModal } from '@/components/guardians/GuardianDetailsModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const RELATIONSHIP_LABELS: Record<string, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  GUARDIAN: 'Guardian',
  UNCLE: 'Uncle',
  AUNT: 'Aunt',
  GRANDPARENT: 'Grandparent',
  OTHER: 'Other',
};

export function GuardiansList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGuardianId, setDeleteGuardianId] = useState<string | null>(null);

  const { data, isLoading, error } = useGuardians({
    page,
    pageSize: 10,
    search: search || undefined,
  });

  const { mutate: deleteGuardian, isPending: isDeleting } = useDeleteGuardian();

  const handleCreateClick = () => {
    setSelectedGuardian(null);
    setFormOpen(true);
  };

  const handleEditClick = (guardian: GuardianResponse) => {
    setSelectedGuardian(guardian);
    setFormOpen(true);
  };

  const handleViewDetails = (guardian: GuardianResponse) => {
    setSelectedGuardian(guardian);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteGuardianId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteGuardianId) {
      deleteGuardian(deleteGuardianId);
      setDeleteDialogOpen(false);
    }
  };

  const columns: ColumnDef<GuardianResponse>[] = [
    {
      accessorKey: 'user.firstName',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.user.firstName} {row.original.user.lastName}
        </span>
      ),
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.user.email}`}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          {row.original.user.email}
        </a>
      ),
    },
    {
      accessorKey: 'user.phone',
      header: 'Phone',
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.user.phone}`}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          {row.original.user.phone || '-'}
        </a>
      ),
    },
    {
      accessorKey: 'relationship',
      header: 'Relationship',
      cell: ({ row }) => (
        <Badge variant="outline">
          {RELATIONSHIP_LABELS[row.original.relationship] || row.original.relationship}
        </Badge>
      ),
    },
    {
      accessorKey: 'occupation',
      header: 'Occupation',
      cell: ({ row }) => row.original.occupation || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
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
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditClick(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteClick(row.original.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error as Error} />;
  if (!data?.data || data.data.length === 0) {
    return (
      <div>
        <PageHeader
          title="Guardians"
          description="Manage student guardians and parents"
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Guardian
            </Button>
          }
        />
        <EmptyState
          title="No guardians found"
          description="Get started by creating your first guardian account."
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Guardian
            </Button>
          }
        />
        <GuardianFormModal
          open={formOpen}
          onOpenChange={setFormOpen}
          mode="create"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Guardians"
        description="Manage student guardians and parents"
        action={
          <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Guardian
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search guardians by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={data.data}
        pagination={{
          pageIndex: page - 1,
          pageSize: 10,
          pageCount: data.pagination?.pages || 1,
        }}
        onPageChange={setPage}
      />

      <GuardianFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={selectedGuardian ? 'edit' : 'create'}
        guardian={selectedGuardian || undefined}
      />

      {selectedGuardian && (
        <GuardianDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          guardian={selectedGuardian}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guardian</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this guardian account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
