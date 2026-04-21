import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Edit, Trash2, FileText } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useGetFeeStructures } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { FeeStructureFormModal } from '@/components/fees/FeeStructureFormModal';
import { GenerateInvoiceModal } from '@/components/fees/GenerateInvoiceModal';
import { BulkGenerateInvoicesModal } from '@/components/fees/BulkGenerateInvoicesModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '@/api';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function FeeStructuresPage() {
  const { schoolId } = useSchoolContext();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);

  // Fetch fee structures
  const { data: structuresData, isLoading } = useGetFeeStructures({
    page: 1,
    limit: 20,
  });

  const structures = structuresData?.data || [];

  // Delete mutation (if API supports it)
  const { mutate: deleteStructure, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      // Note: Backend doesn't expose delete endpoint, so this would need to be added
      // For now, we'll just show the intent
      return Promise.reject(new Error('Delete not yet implemented'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeStructures'] });
      toast.success('Fee structure deleted successfully');
      setShowDeleteDialog(false);
      setSelectedStructure(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete fee structure');
    },
  });

  // Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Structure Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-gray-600">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: 'classLevel',
      header: 'Class Level',
      cell: ({ row }) => row.original.classLevel || '-',
    },
    {
      accessorKey: 'boardingStatus',
      header: 'Boarding',
      cell: ({ row }) => {
        const status = row.original.boardingStatus;
        return status ? (
          <Badge variant="secondary">{status}</Badge>
        ) : (
          <span className="text-gray-500">-</span>
        );
      },
    },
    {
      accessorKey: 'itemCount',
      header: 'Items',
      cell: ({ row }) => row.original.items?.length || 0,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => {
        const total = row.original.items?.reduce(
          (sum: number, item: any) => sum + item.amount,
          0
        ) || 0;
        return <span className="font-medium">KES {total.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: 'invoiceCount',
      header: 'Invoices',
      cell: ({ row }) => row.original._count?.invoices || 0,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {can('manage_fees') && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStructure(row.original);
                    setShowGenerateModal(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Single Invoice
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStructure(row.original);
                    setShowBulkGenerateModal(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Bulk Generate Invoices
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStructure(row.original);
                    // Edit modal would be opened here
                    toast.info('Edit structure feature coming soon');
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Structure
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStructure(row.original);
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <PageHeader
          title="Fee Structures"
          description="Create and manage fee structures for different class levels"
          action={
            can('manage_fees') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Fee Structure
              </Button>
            )
          }
        />

        <DataTable
          columns={columns}
          data={structures}
          isLoading={isLoading}
        />

        {/* Modals */}
        <FeeStructureFormModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          mode="create"
        />

        {selectedStructure && (
          <>
            <GenerateInvoiceModal
              open={showGenerateModal}
              onOpenChange={setShowGenerateModal}
              feeStructureId={selectedStructure.id}
            />

            <BulkGenerateInvoicesModal
              open={showBulkGenerateModal}
              onOpenChange={setShowBulkGenerateModal}
              feeStructureId={selectedStructure.id}
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedStructure?.name}"? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedStructure && deleteStructure(selectedStructure.id)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
