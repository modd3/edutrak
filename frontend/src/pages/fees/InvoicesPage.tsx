import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, X } from 'lucide-react';
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
import { useGetInvoices, useCancelInvoice } from '@/hooks/use-fees';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { InvoiceDetailsModal } from '@/components/fees/InvoiceDetailsModal';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function InvoicesPage() {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  let filteredStatus;
  if (statusFilter === "All") {
    filteredStatus = ""
  }

  else {
    filteredStatus = statusFilter
  }
  
  // Fetch invoices
   const { data: invoicesData, isLoading } = useGetInvoices({
    status: filteredStatus || undefined,
    page: 1,
    limit: 20,
  });

  const { mutate: cancelInvoice, isPending: isCancelling } = useCancelInvoice();

  const invoices = invoicesData?.data?.data || [];
    
  // Filter by student search
  const filteredInvoices = invoices.filter(
    (invoice: any) =>
      !studentSearch ||
      invoice.student?.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      invoice.student?.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      invoice.student?.admissionNo?.includes(studentSearch) ||
      invoice.invoiceNo?.includes(studentSearch)
  );

  // Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'invoiceNo',
      header: 'Invoice Number',
      cell: ({ row }) => (
        <div className="font-mono font-semibold text-sm">{row.original.invoiceNo}</div>
      ),
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.student?.firstName} {row.original.student?.lastName}
          </p>
          <p className="text-xs text-gray-600">{row.original.student?.admissionNo}</p>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.feeStructure.currency} {row.original.totalAmount || '0.00'}</span>
      ),
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid Amount',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-green-600">
            {row.original.feeStructure.currency} {row.original.paidAmount || '0.00'}
          </p>
          {row.original.discountAmount > 0 && (
            <p className="text-xs text-gray-600">
              Discount: {row.original.feeStructure.currency} {row.original.discountAmount}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Outstanding',
      cell: ({ row }) => {
        const balance =
          row.original.totalAmount - row.original.paidAmount - row.original.discountAmount;
        return (
          <span className={balance > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
            {row.original.feeStructure.currency} {balance.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<string, any> = {
          UNPAID: 'destructive',
          PARTIAL: 'secondary',
          PAID: 'default',
          OVERDUE: 'destructive',
          CANCELLED: 'outline',
          WAIVED: 'outline',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) =>
        row.original.dueDate ? (
          <div className="text-sm">
            <p>{new Date(row.original.dueDate).toLocaleDateString()}</p>
            {new Date(row.original.dueDate) < new Date() &&
              row.original.status !== 'PAID' && (
                <p className="text-xs text-red-600">Overdue</p>
              )}
          </div>
        ) : (
          <span className="text-gray-500">-</span>
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

            <DropdownMenuItem
              onClick={() => {
                setSelectedInvoice(row.original);
                setShowDetailsModal(true);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>

            {can('manage_fees') && row.original.status !== 'CANCELLED' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedInvoice(row.original);
                    setShowCancelDialog(true);
                  }}
                  className="text-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Invoice
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCancelInvoice = () => {
    if (selectedInvoice) {
      cancelInvoice(selectedInvoice.id, {
        onSuccess: () => {
          setShowCancelDialog(false);
          queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
          setSelectedInvoice(null);
        },
      });
    }
  };

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          title="Fee Invoices"
          description="View and manage student fee invoices"
        />

        {/* Filters */}
        <div className="flex gap-4 items-end bg-white p-4 rounded-lg border">
          <div className="flex-1">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search by student name, admission number, or invoice #..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="mt-1"
            />
          </div>

          {can('manage_fees') && (
            <div className="w-48">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DataTable columns={columns} data={filteredInvoices} isLoading={isLoading} />

        {/* Modals */}
        {selectedInvoice && (
          <InvoiceDetailsModal
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            invoiceId={selectedInvoice.id}
          />
        )}

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to cancel invoice {selectedInvoice?.invoiceNo}? This
                action cannot be undone, and it cannot be cancelled if payments have been recorded.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelInvoice}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Invoice'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
