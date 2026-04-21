import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { useGetFeeStructures } from '@/hooks/use-fees';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { FeeStructureFormModal } from '@/components/fees/FeeStructureFormModal';
import { GenerateInvoiceModal } from '@/components/fees/GenerateInvoiceModal';
import { BulkGenerateInvoicesModal } from '@/components/fees/BulkGenerateInvoicesModal';
import { PageHeader } from '@/components/shared/PageHeader';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function FeeStructuresPage() {
  const { can } = usePermission();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);

  // Fetch fee structures
  const { data: structuresData, isLoading } = useGetFeeStructures({
    page: 1,
    limit: 20,
  });

  const structures = structuresData?.data || [];

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
                    setShowEditModal(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Structure
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
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
            <FeeStructureFormModal
              open={showEditModal}
              onOpenChange={setShowEditModal}
              mode="edit"
              structureId={selectedStructure.id}
            />

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
      </div>
    </RoleGuard>
  );
}
