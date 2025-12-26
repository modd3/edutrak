import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Edit, Trash, Eye, Users } from 'lucide-react';
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
import { useClasses, useClassStreams, useDeleteStream } from '@/hooks/use-academic';
import { Stream } from '@/hooks/use-academic';
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

export default function StreamsList() {
  const { schoolId } = useSchoolContext();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  // Fetch classes for filter
  const { data: classesData } = useClasses();
  const classes = classesData?.data || [];

  // Get all streams from all classes
  const allStreams: Stream[] = [];
  classes.forEach(cls => {
    if (cls.streams) {
      allStreams.push(...cls.streams);
    }
  });

  // Filter streams
  const filteredStreams = allStreams.filter((stream: Stream) => {
    const matchesSearch = stream.name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || stream.class?.id === classFilter;
    return matchesSearch && matchesClass;
  });

  const { mutate: deleteStream, isPending: isDeleting } = useDeleteStream();

  const handleDeleteClick = (stream: Stream) => {
    setSelectedStream(stream);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (stream: Stream) => {
    setSelectedStream(stream);
    setShowEditModal(true);
  };

  const confirmDelete = () => {
    if (selectedStream) {
      deleteStream(selectedStream.id, {
        onSuccess: () => {
          toast.success('Stream deleted successfully');
          setShowDeleteDialog(false);
          setSelectedStream(null);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to delete stream');
        },
      });
    }
  };

  const columns: ColumnDef<Stream>[] = [
    {
      accessorKey: 'name',
      header: 'Stream Name',
      cell: ({ row }) => {
        const stream = row.original;
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-wrap text-left justify-start"
            onClick={() => {/* TODO: Navigate to stream details */}}
          >
            {stream.name}
          </Button>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const streamClass = row.original.class;
        return (
          <span className="text-sm">
            {streamClass ? `${streamClass.name} (${streamClass.level})` : 'N/A'}
          </span>
        );
      },
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const capacity = row.getValue('capacity');
        return (
          <span className="text-sm">
            {capacity ? capacity : 'Unlimited'}
          </span>
        );
      },
    },
    {
      accessorKey: 'streamTeacher',
      header: 'Stream Teacher',
      cell: ({ row }) => {
        const teacher = row.original.streamTeacher;
        return (
          <span className="text-sm">
            {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not assigned'}
          </span>
        );
      },
    },
    {
      accessorKey: '_count',
      header: 'Students',
      cell: ({ row }) => {
        const studentsCount = row.original._count?.students || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{studentsCount}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const stream = row.original;
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
              <DropdownMenuItem onClick={() => handleEditClick(stream)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Stream
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(stream)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Stream
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Streams</h1>
          <p className="text-muted-foreground">
            View and manage class streams
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Stream
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by stream name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} ({cls.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Streams Table */}
      <DataTable columns={columns} data={filteredStreams} pageSize={20} />

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredStreams.length} of {allStreams.length} streams
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div> {/* TODO: Implement StreamFormModal */} </div>
      )}

      {/* Edit Stream Modal */}
      {selectedStream && showEditModal && (
        <div> {/* TODO: Implement StreamFormModal */} </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stream</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStream?.name}"? This action cannot be undone
              and will affect all students currently assigned to this stream.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}