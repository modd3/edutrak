/**
 * Professional Invoices Management Page
 * Complete invoice lifecycle: generation, viewing, payment tracking, reporting
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Input,
} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreVertical,
  Eye,
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileX,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetInvoices } from '@/hooks/use-fees';
import { usePermission } from '@/hooks/use-permission';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useActiveAcademicYear } from '@/hooks/use-academic';
import { RoleGuard } from '@/components/RoleGuard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ProfessionalInvoiceViewer } from '@/components/fees/ProfessionalInvoiceViewer';
import { PaymentRecordingModal } from '@/components/fees/PaymentRecordingModal';

type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED' | 'WAIVED';

const STATUS_CONFIG: Record<InvoiceStatus, { badge: string; icon: any; color: string }> = {
  PAID: { badge: 'default', icon: CheckCircle2, color: 'text-green-600' },
  PARTIAL: { badge: 'secondary', icon: Clock, color: 'text-amber-600' },
  UNPAID: { badge: 'outline', icon: AlertCircle, color: 'text-slate-600' },
  OVERDUE: { badge: 'destructive', icon: AlertCircle, color: 'text-red-600' },
  CANCELLED: { badge: 'outline', icon: FileX, color: 'text-slate-400' },
  WAIVED: { badge: 'outline', icon: CheckCircle2, color: 'text-blue-600' },
};

export function InvoicesPage() {
  const { can } = usePermission();
  const { schoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  // Get active academic year and terms
  const { data: activeYearData } = useActiveAcademicYear();
  const activeYear = activeYearData?.data ?? activeYearData;
  const terms = activeYear?.terms ?? [];

  // State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [termFilter, setTermFilter] = useState<string>('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [recordingPaymentId, setRecordingPaymentId] = useState<string | null>(null);

  // Prepare filter values
  const filterStatus =
    statusFilter === 'All' || statusFilter === ''
      ? undefined
      : (statusFilter as InvoiceStatus);
  const filterTerm =
    termFilter === 'All' || termFilter === '' ? undefined : termFilter;

  // Fetch invoices
  const { data: invoicesData, isLoading } = useGetInvoices({
    status: filterStatus,
    termId: filterTerm,
    page: 1,
    limit: 100,
  });

  const invoices = invoicesData?.data?.data || invoicesData?.data || [];

  // Client-side search filter
  const filteredInvoices = invoices.filter((invoice: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      invoice.invoiceNo?.toLowerCase().includes(searchLower) ||
      invoice.student?.firstName?.toLowerCase().includes(searchLower) ||
      invoice.student?.lastName?.toLowerCase().includes(searchLower) ||
      invoice.student?.admissionNo?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate summary statistics
  const stats = {
    total: filteredInvoices.length,
    paid:
      filteredInvoices.filter(
        (i: any) => i.status === 'PAID' || i.status === 'WAIVED'
      ).length || 0,
    partial: filteredInvoices.filter((i: any) => i.status === 'PARTIAL').length || 0,
    unpaid: filteredInvoices.filter((i: any) => i.status === 'UNPAID').length || 0,
    overdue: filteredInvoices.filter((i: any) => i.status === 'OVERDUE').length || 0,
    totalBilled: filteredInvoices.reduce(
      (sum: number, i: any) => sum + Number(i.totalAmount),
      0
    ),
    totalCollected: filteredInvoices.reduce(
      (sum: number, i: any) => sum + Number(i.paidAmount),
      0
    ),
  };

  const getBalance = (invoice: any) =>
    Number(invoice.totalAmount) -
    Number(invoice.discountAmount) -
    Number(invoice.paidAmount);

  const getDaysOverdue = (invoice: any) => {
    if (!invoice.dueDate || getBalance(invoice) <= 0) return 0;
    const days = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / 86400000
    );
    return Math.max(0, days);
  };

  return (
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN', 'TEACHER']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Invoices</h1>
          <p className="text-muted-foreground">
            Manage, track, and collect student fee invoices
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Paid
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.paid}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Partial
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.partial}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Unpaid
                </p>
                <p className="text-2xl font-bold">{stats.unpaid}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdue}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Collection Rate
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalBilled > 0
                    ? ((stats.totalCollected / stats.totalBilled) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search by invoice #, student name, or admission #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="WAIVED">Waived</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {terms.length > 0 && (
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Terms</SelectItem>
                {terms.map((term: any) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Critical Alert */}
        {stats.overdue > 0 && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {stats.overdue} invoice{stats.overdue !== 1 ? 's' : ''} are overdue. Take
              immediate action to collect payment.
            </AlertDescription>
          </Alert>
        )}

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Showing {filteredInvoices.length} of {invoices.length} invoices
                </CardDescription>
              </div>
              {can('manage_fees') && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <FileX className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: any, idx: number) => {
                      const status = invoice.status as InvoiceStatus;
                      const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNPAID;
                      const daysOverdue = getDaysOverdue(invoice);
                      const balance = getBalance(invoice);

                      return (
                        <TableRow
                          key={invoice.id}
                          className={`${
                            idx % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-900'
                          } ${daysOverdue > 30 ? 'border-l-4 border-l-red-500' : ''}`}
                        >
                          <TableCell className="font-mono font-semibold">
                            {invoice.invoiceNo}
                          </TableCell>
                          <TableCell className="font-medium">
                            {invoice.student?.firstName} {invoice.student?.lastName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {invoice.student?.admissionNo}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(invoice.createdAt)}
                          </TableCell>
                          <TableCell
                            className={`text-sm ${
                              daysOverdue > 0 ? 'font-semibold text-red-600' : ''
                            }`}
                          >
                            {invoice.dueDate
                              ? formatDate(invoice.dueDate)
                              : 'Not set'}
                            {daysOverdue > 0 && (
                              <div className="text-xs text-red-600">
                                ({daysOverdue}d overdue)
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(Number(invoice.totalAmount))}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(Number(invoice.paidAmount))}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono font-bold ${
                              balance > 0 ? 'text-red-600 dark:text-red-400' : ''
                            }`}
                          >
                            {formatCurrency(Math.max(0, balance))}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={config.badge as any} className="text-xs">
                              {status}
                            </Badge>
                            {daysOverdue > 0 && (
                              <div className="text-[10px] text-red-600 mt-1">
                                {daysOverdue}d
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setViewingInvoiceId(invoice.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Invoice
                                </DropdownMenuItem>
                                {balance > 0 && can('manage_fees') && (
                                  <DropdownMenuItem
                                    onClick={() => setRecordingPaymentId(invoice.id)}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {viewingInvoiceId && (
          <ProfessionalInvoiceViewer
            open={!!viewingInvoiceId}
            onOpenChange={(open) => !open && setViewingInvoiceId(null)}
            invoiceId={viewingInvoiceId}
          />
        )}

        {recordingPaymentId && (
          <PaymentRecordingModal
            open={!!recordingPaymentId}
            onOpenChange={(open) => !open && setRecordingPaymentId(null)}
            invoiceId={recordingPaymentId}
          />
        )}
      </div>
    </RoleGuard>
  );
}

export default InvoicesPage;
