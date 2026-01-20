import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PlusCircle, Upload, Edit, Trash, Eye, XCircleIcon, CheckCheckIcon } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUsers, useDeactivateUser, useActivateUser, useDeleteUser } from '@/hooks/use-users';
import { Role, User } from '@/types';
import { UserDetailsModal } from '@/components/users/UserDetailsModal';
import { UserFormModal } from '@/components/users/UserFormModal';
import { BulkUserUploadModal } from '@/components/users/BulkUserUploadModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  SUPPORT_STAFF: 'Support Staff',
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'destructive',
  ADMIN: 'default',
  TEACHER: 'secondary',
  STUDENT: 'outline',
  PARENT: 'outline',
  SUPPORT_STAFF: 'outline',
} as const;

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users with filters
  const { data: usersData, isLoading, isError } = useUsers({
    page,
    limit: 20,
    search,
    role: roleFilter === 'all' ? undefined : roleFilter as Role,
    isActive: activeTab === 'all' ? undefined : activeTab === 'active',
  });

  const { mutate: deactivateUser, isPending: isDeactivating } = useDeactivateUser();
  const { mutate: activateUser, isPending: isActivating } = useActivateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const users = usersData?.data || [];
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id, {
        onSuccess: () => {
          toast.success('User deleted successfully');
          setShowDeleteDialog(false);
          setSelectedUser(null);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to delete user');
        },
      });
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.isActive) {
      deactivateUser(user.id, {
        onSuccess: () => {
          toast.success('User deactivated successfully');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to deactivate user');
        },
      });
    } else {
      activateUser(user.id, {
        onSuccess: () => {
          toast.success('User activated successfully');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to activate user');
        },
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original;
        const fullName = `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim();
        return (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-wrap text-left justify-start"
            onClick={() => handleUserClick(user)}
          >
            {fullName}
          </Button>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue('email')}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as keyof typeof ROLE_LABELS;
        return <Badge variant={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Badge>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-sm">{row.getValue('phone') || 'N/A'}</span>,
    },
    {
      accessorKey: 'school',
      header: 'School',
      cell: ({ row }) => {
        const school = row.original.school;
        return <span className="text-sm text-wrap">{school?.name || 'N/A'}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
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
              <DropdownMenuItem onClick={() => handleUserClick(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
              className={user.isActive ? "text-destructive border" : "text-blue-500 bg-green-100"}
              onClick={() => handleToggleActive(user)}>
                {user.isActive ? (
                  <>
                  <XCircleIcon className="mr-2 h-4 w-4" />
                  Deactivate User
                  </>
                  ) : (
                    <>
                    <CheckCheckIcon className="mr-2 h-4 w-4"/>
                    Activate User
                    </>
                    )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(user)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete User
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
          <p className="text-destructive text-lg mb-2">Failed to load users</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">View and manage user accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button
           onClick={() => {
            setSelectedUser(null);
            setShowCreateModal(true)}}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, phone, or ID number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Active/Inactive */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable columns={columns} data={users} pageSize={20} />
        </TabsContent>
      </Tabs>

      {/* Pagination Info */}
      {usersData?.pagination && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {users.length} of {usersData.pagination.total} users
        </div>
      )}

      {/* Create User Modal */}
      <UserFormModal
        open={showCreateModal && !selectedUser}
        onOpenChange={setShowCreateModal}
        mode="create"
      />

      {/* Edit User Modal */}
      {selectedUser && (
        <UserFormModal
          open={showCreateModal && !!selectedUser}
          onOpenChange={(open) => {setShowCreateModal(open);
             if (!open) setSelectedUser(null);
            }}
          mode="edit"
          user={selectedUser}
        />
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          user={selectedUser}
        />
      )}

      {/* Bulk Upload Modal */}
      <BulkUserUploadModal open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedUser?.firstName}{' '}
              {selectedUser?.lastName}"? This action cannot be undone and will remove all
              associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}