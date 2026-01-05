// src/pages/assessments/AssessmentDefinitionsList.tsx
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye, BarChart3 } from 'lucide-react';
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
import { useAssessmentDefinitions, useDeleteAssessmentDefinition } from '@/hooks/use-assessments';
import { AssessmentDefinition } from '@/types';
import { AssessmentDefinitionFormModal } from '@/components/assessments/AssessmentDefinitionFormModal';
import { AssessmentResultsEntryModal } from '@/components/assessments/AssessmentResultsEntryModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
  COMPETENCY: 'Competency',
  GRADE_BASED: 'Grade Based',
  HOLISTIC: 'Holistic',
};

export function AssessmentDefinitionsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDefinition | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAssessmentId, setDeleteAssessmentId] = useState<string | null>(null);

  const { data, isLoading, error } = useAssessmentDefinitions({
    page,
    pageSize: 10,
    search: search || undefined,
  });

  const { mutate: deleteAssessment, isPending: isDeleting } = useDeleteAssessmentDefinition();

  const handleCreateClick = () => {
    setSelectedAssessment(null);
    setFormOpen(true);
  };

  const handleEditClick = (assessment: AssessmentDefinition) => {
    setSelectedAssessment(assessment);
    setFormOpen(true);
  };

  const handleRecordResults = (assessment: AssessmentDefinition) => {
    setSelectedAssessment(assessment);
    setResultsOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteAssessmentId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteAssessmentId) {
      deleteAssessment(deleteAssessmentId);
      setDeleteDialogOpen(false);
    }
  };

  const columns: ColumnDef<AssessmentDefinition>[] = [
    {
      accessorKey: 'name',
      header: 'Assessment Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {TYPE_LABELS[row.original.type] || row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'classSubject',
      header: 'Subject - Class',
      cell: ({ row }) => (
        <span>
          {(row.original as any).classSubject?.subject?.name} -{' '}
          {(row.original as any).classSubject?.class?.name}
        </span>
      ),
    },
    {
      accessorKey: 'maxMarks',
      header: 'Max Marks',
      cell: ({ row }) => row.original.maxMarks || '-',
    },
    {
      accessorKey: 'term',
      header: 'Term',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {(row.original as any).term?.name}
        </Badge>
      ),
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
            <DropdownMenuItem onClick={() => handleRecordResults(row.original)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Record Results
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
          title="Assessment Definitions"
          description="Create and manage assessment definitions"
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assessment
            </Button>
          }
        />
        <EmptyState
          title="No assessments found"
          description="Get started by creating your first assessment definition."
          action={
            <Button onClick={handleCreateClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assessment
            </Button>
          }
        />
        <AssessmentDefinitionFormModal
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
        title="Assessment Definitions"
        description="Create and manage assessment definitions"
        action={
          <Button onClick={handleCreateClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search assessments..."
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

      <AssessmentDefinitionFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={selectedAssessment ? 'edit' : 'create'}
        assessment={selectedAssessment || undefined}
      />

      {selectedAssessment && (
        <AssessmentResultsEntryModal
          open={resultsOpen}
          onOpenChange={setResultsOpen}
          assessmentId={selectedAssessment.id}
          maxMarks={selectedAssessment.maxMarks}
          classId={(selectedAssessment as any).classSubject?.classId}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assessment definition? This action cannot be undone.
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
