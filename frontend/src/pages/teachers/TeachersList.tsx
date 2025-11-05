import { useState } from 'react';
import { Link } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
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
import { useTeachers } from '@/hooks/use-teachers';
import { Teacher } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function TeachersList() {
  const [search, setSearch] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  
  const { data, isLoading } = useTeachers({
    search,
    employmentType,
  });

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: 'tscNumber',
      header: 'TSC Number',
    },
    {
      accessorKey: 'user.firstName',
      header: 'First Name',
    },
    {
      accessorKey: 'user.lastName',
      header: 'Last Name',
    },
    {
      accessorKey: 'employmentType',
      header: 'Employment Type',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue('employmentType')}
        </Badge>
      ),
    },
    {
      accessorKey: 'qualification',
      header: 'Qualification',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link
          to={`/teachers/${row.original.id}`}
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
          <h1 className="text-3xl font-bold">Teachers</h1>
          <p className="text-muted-foreground">
            Manage your school's teaching staff
          </p>
        </div>
        <Link to="/teachers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={employmentType}
          onValueChange={setEmploymentType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Employment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="PERMANENT">Permanent</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="TEMPORARY">Temporary</SelectItem>
            <SelectItem value="BOM">BOM</SelectItem>
            <SelectItem value="PTA">PTA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
      />
    </div>
  );
}