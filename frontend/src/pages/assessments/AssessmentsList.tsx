import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssessments } from '@/hooks/use-assessments';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, FileSpreadsheet } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Assessment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AssessmentsList() {
  const [type, setType] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useAssessments({
    type,
    page,
    pageSize,
  });

  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: 'name',
      header: 'Assessment Name',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => (
        `${row.original.student?.firstName} ${row.original.student?.lastName}`
      ),
    },
    {
      accessorKey: 'marks',
      header: 'Marks',
      cell: ({ row }) => (
        row.original.marksObtained !== undefined ? 
        `${row.original.marksObtained}/${row.original.maxMarks}` :
        row.original.competencyLevel?.replace(/_/g, ' ')
      ),
    },
    {
      accessorKey: 'assessedDate',
      header: 'Date Assessed',
      cell: ({ row }) => (
        row.original.assessedDate ? 
        format(new Date(row.original.assessedDate), 'dd MMM yyyy') :
        'N/A'
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link
          to={`/assessments/${row.original.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View Details
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessments</h1>
          <p className="text-muted-foreground">
            Manage student assessments and grades
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/assessments/bulk">
            <Button variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Bulk Entry
            </Button>
          </Link>
          <Link to="/assessments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                className="pl-10"
              />
            </div>
            <Select
              value={type}
              onValueChange={setType}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Assessment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="CAT">Continuous Assessment</SelectItem>
                <SelectItem value="MIDTERM">Mid-Term Exam</SelectItem>
                <SelectItem value="END_OF_TERM">End of Term Exam</SelectItem>
                <SelectItem value="MOCK">Mock Exam</SelectItem>
                <SelectItem value="NATIONAL_EXAM">National Exam</SelectItem>
                <SelectItem value="COMPETENCY_BASED">Competency Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data?.data || []}
        pageCount={Math.ceil((data?.total || 0) / pageSize)}
        pageSize={pageSize}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}