import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, RotateCcw } from 'lucide-react';
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
import { useGetPayments } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { usePermission } from '@/hooks/use-permission';
import { RoleGuard } from '@/components/RoleGuard';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

const PAYMENT_METHODS = {
  CASH: 'Cash',
  MPESA: 'M-Pesa',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  SCHOLARSHIP: 'Scholarship',
};

const STATUS_VARIANTS: Record<string, any> = {
  PENDING: 'secondary',
  COMPLETED: 'default',
  REVERSED: 'destructive',
  FAILED: 'destructive',
};

export default function PaymentsPage() {
  const { schoolId } = useSchoolContext();
  const { can } = usePermission();
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [showReverseDialog, setShowReverseDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Fetch payments
  const { data: paymentsData, isLoading } = useGetPayments({
    method: methodFilter || undefined,
    status: statusFilter || undefined,
    page: 1,
    limit: 20,
  });

  const payments = paymentsData?.data || [];

  // Filter by student search
  const filteredPayments = payments.filter(
    (payment: any) =>
      !studentSearch ||
      payment.invoice?.student?.firstName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      payment.invoice?.student?.lastName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      payment.invoice?.student?.admissionNo?.includes(studentSearch) ||
      payment.transactionRef?.includes(studentSearch) ||
      payment.mpesaCode?.includes(studentSearch)
  );

  // Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ row }) => (
        <div className="font-mono font-semibold text-sm">{row.original.receiptNumber}</div>
      ),
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {row.original.invoice?.student?.firstName} {row.original.invoice?.student?.lastName}
          </p>
          <p className="text-xs text-gray-600">
            {row.original.invoice?.student?.admissionNo}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'invoice.invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => (
        <div className="font-mono text-sm text-gray-600">
          {row.original.invoice?.invoiceNumber}
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          KES {row.original.amount?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <Badge variant="outline">
          {PAYMENT_METHODS[row.original.method as keyof typeof PAYMENT_METHODS] || row.original.method}
        </Badge>
      ),
    },
    {
      accessorKey: 'transactionRef',
      header: 'Reference',
      cell: ({ row }) => {
        const ref =
          row.original.transactionRef ||
          row.original.mpesaCode ||
          row.original.chequeNo ||
          '-';
        return <span className="text-sm text-gray-600">{ref}</span>;
      },
    },
    {
      accessorKey: 'paidAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          <p>{new Date(row.original.paidAt).toLocaleDateString()}</p>
          <p className="text-xs text-gray-600">
            {new Date(row.original.paidAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] || 'secondary'}>
          {row.original.status}
        </Badge>
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

            <DropdownMenuItem disabled>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>

            {can('manage_fees') && row.original.status === 'COMPLETED' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedPayment(row.original);
                    setShowReverseDialog(true);
                  }}
                  className="text-red-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reverse Payment
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'SUPER_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        <PageHeader
          title="Payment History"
          description="Track and manage all fee payments received"
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border">
          <div>
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Student name, receipt, M-Pesa code..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="mt-1"
            />
          </div>

          {can('manage_fees') && (
            <>
              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Methods</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="MPESA">M-Pesa</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REVERSED">Reversed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DataTable columns={columns} data={filteredPayments} isLoading={isLoading} />

        {/* Reverse Payment Dialog */}
        <AlertDialog open={showReverseDialog} onOpenChange={setShowReverseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reverse payment {selectedPayment?.receiptNumber}? This
                will restore the outstanding balance on the invoice.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Payment</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info('Reverse payment dialog would appear here');
                  setShowReverseDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Reverse Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  );
}
