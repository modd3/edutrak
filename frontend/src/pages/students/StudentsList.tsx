import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, MoreHorizontal, FileDown } from 'lucide-react';

import { studentService } from '@/services/student.service';
import { useAuthStore } from '@/store/auth-store';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const StudentsList = () => {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students', user?.schoolId, page, search],
    queryFn: () =>
      studentService.getAll({
        schoolId: user?.schoolId,
        page,
        pageSize: 10,
        // name: search, // Assuming backend supports search by name
      }),
    enabled: !!user?.schoolId,
  });

  const students = data?.data || [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell>
          <Skeleton className="h-10 w-10 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage all students in your school.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/students/new">
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Current Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderSkeletons()
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-red-500">
                  Error fetching students: {error.message}
                </TableCell>
              </TableRow>
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{`${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.admissionNo}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>
                    {student.enrollments?.[0]?.class?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.enrollments?.[0]?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {student.enrollments?.[0]?.status || 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link to={`/students/${student.id}`}><DropdownMenuItem>View Details</DropdownMenuItem></Link>
                        <Link to={`/students/${student.id}/edit`}><DropdownMenuItem>Edit</DropdownMenuItem></Link>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StudentsList;