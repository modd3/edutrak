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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAcademicYears, useTermsByAcademicYear } from '@/hooks/use-academic';
import { Term } from '@/hooks/use-academic';
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

export default function TermsList() {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  // Fetch academic years for filter
  const { data: academicYearsData } = useAcademicYears();
  const academicYears = academicYearsData || [];

  // Fetch terms based on selected academic year
  const { data: termsData, isLoading, isError } = useTermsByAcademicYear(
    academicYearFilter || undefined
  );

  const terms = termsData || [];

  // Filter terms by search
  const filteredTerms = terms.filter((term: Term) =>
    term.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteClick = (term: Term) => {
    setSelectedTerm(term);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedTerm) {
      // TODO: Implement delete term mutation
      toast.success('Term deleted successfully');
      setShowDeleteDialog(false);
      setSelectedTerm(null);
    }
  };

  const columns: ColumnDef<Term>[] = [
    {
      accessorKey: 'name',
      header: 'Term Name',
      cell: ({ row }) => {
        const term = row.original;
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-wrap text-left justify-start"
            onClick={() => {/* TODO: Navigate to term details */}}
          >
            {term.name}
          </Button>
        );
      },
    },
    {
      accessorKey: 'termNumber',
      header: 'Term Number',
      cell: ({ row }) => (
        <span className="text-sm">Term {row.getValue('termNumber')}</span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue('startDate')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue('endDate')).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'academicYear',
      header: 'Academic Year',
      cell: ({ row }) => {
        const academicYear = row.original.academicYear;
        return (
          <span className="text-sm">
            {academicYear ? `${academicYear.year}` : 'N/A'}
          </span>
        );
      },
    },
    {
      accessorKey: '_count',
      header: 'Statistics',
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="text-sm space-y-1">
            <div>Assessments: {counts?.AssessmentDefinitions || 0}</div>
            <div>Subjects: {counts?.classSubjects || 0}</div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const term = row.original;
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
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Term
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(term)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Term
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
          <p className="text-destructive text-lg mb-2">Failed to load terms</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Terms</h1>
          <p className="text-muted-foreground">
            View and manage academic terms
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Term
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by term name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by academic year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Years</SelectItem>
            {academicYears.map((year: any) => (
              <SelectItem key={year.id} value={year.id}>
                {year.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Terms Table */}
      <DataTable columns={columns} data={filteredTerms} pageSize={20} />

      {/* Summary */}
      {termsData && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredTerms.length} of {terms.length} terms
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTerm?.name}"? This action cannot be undone
              and will remove all associated assessments and subject assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={false}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={false}
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