import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolClasses } from '@/hooks/use-classes';
import { useAuthStore } from '@/store/auth-store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Class } from '@/types';

export default function ClassesList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useAuthStore();
  
  const { data, isLoading } = useSchoolClasses(user?.schoolId!, {
    page,
    pageSize: 10,
    name: search,
  });

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'name',
      header: 'Class Name',
    },
    {
      accessorKey: 'level',
      header: 'Level',
    },
    {
      accessorKey: 'curriculum',
      header: 'Curriculum',
    },
    {
      accessorKey: 'classTeacher.user.firstName',
      header: 'Class Teacher',
      cell: ({ row }) => {
        const teacher = row.original.classTeacher;
        return teacher ? `${teacher.user.firstName} ${teacher.user.lastName}` : 'Not Assigned';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link
          to={`/classes/${row.original.id}`}
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
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage your school's classes and streams
          </p>
        </div>
        <Link to="/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        pageCount={Math.ceil((data?.total || 0) / 10)}
        pageSize={10}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}