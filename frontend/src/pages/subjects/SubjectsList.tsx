// src/pages/subjects/SubjectsList.tsx
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
import { useSubjects, useDeleteSubject } from '@/hooks/use-subjects';
import { Subject } from '@/types';
import { SubjectFormModal } from '@/components/subjects/SubjectFormModal';
import { SubjectDetailsModal } from '@/components/subjects/SubjectDetailsModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  ELECTIVE: 'Elective',
  COMPETENCY: 'Competency',
};

const CURRICULUM_LABELS: Record<string, string> = {
  CBC: 'CBC',
  EIGHT_FOUR_FOUR: '8-4-4',
  TVET: 'TVET',
  IGCSE: 'IGCSE',
  IB: 'IB',
};

export function SubjectsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  const { data, isLoading, error } = useSubjects({
    page,
    pageSize: 10,
    search: search || undefined,
  });

  const { mutate: deleteSubject, isPending: isDeleting } = useDeleteSubject();

  const handleCreateClick = () => {
    setSelectedSubject(null);
    setFormOpen(true);
  };

  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormOpen(true);
  };

  const handleViewDetails = (subject: Subject) => {
    setSelectedSubject(subject);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteSubjectId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteSubjectId) {
      deleteSubject(deleteSubjectId);
      setDeleteDialogOpen(false);
    }
  };

  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <Badge variant="outline">
          {CATEGORY_LABELS[row.original.category] || row.original.category}
        </Badge>
      ),
    },
    {
  accessorKey: 'curriculum',
  header: 'Curriculum',
  cell: ({ row }) => {
    const curriculum = row.original.curriculum;
    const curriculumArray = Array.isArray(curriculum) 
      ? curriculum 
      : curriculum ? [curriculum] : [];
    
    return (
      <div className="flex flex-wrap gap-1">
        {curriculumArray?.map((curr) => (
          <Badge key={curr} variant="secondary" className="text-xs">
            {CURRICULUM_LABELS[curr] || curr}
          </Badge>
        ))}
      </div>
    );
  },
},
    {
      accessorKey: 'learningArea',
      header: 'Learning Area',
      cell: ({ row }) => row.original.learningArea || '-',
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
          title="Subjects"
          description="Manage school subjects and learning areas"
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          }
        />
        <EmptyState
          title="No subjects found"
          description="Get started by creating your first subject."
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Subject
            </Button>
          }
        />
        <SubjectFormModal
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
        title="Subjects"
        description="Manage school subjects and learning areas"
        action={
          <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search subjects..."
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

      <SubjectFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={selectedSubject ? 'edit' : 'create'}
        subject={selectedSubject || undefined}
      />

      {selectedSubject && (
        <SubjectDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          subject={selectedSubject}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
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
