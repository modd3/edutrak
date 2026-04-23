// frontend/src/pages/fees/StudentFeesPage.tsx
// Read-only fee view for PARENT role.
// Route: /my-fees   (or /students/:studentId/fees for ADMIN deep-link)
// Parents see their child's invoices, payment history, and can print a statement.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useGetInvoices, useGetPayments } from '@/hooks/use-fees';
import { useAuthStore } from '@/store/auth-store';
import { useSchoolContext } from '@/hooks/use-school-context';
import { formatCurrency } from '@/lib/utils';
import StudentFeeStatement from '@/components/fees/StudentFeeStatement';
import {InvoiceDetailsModal} from '@/components/fees/InvoiceDetailsModal';

// ─── Status badge config ────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PAID:      { label: 'Paid',      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  PARTIAL:   { label: 'Partial',   className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  UNPAID:    { label: 'Unpaid',    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  OVERDUE:   { label: 'Overdue',   className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
  WAIVED:    { label: 'Waived',    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function StudentFeesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'invoices';

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');

  const { user } = useAuthStore();
  const { schoolId } = useSchoolContext();

  // Derive the student linked to this parent.
  // Assumes user.student is populated for PARENT role (adjust to your auth shape).
  const student = (user as any)?.student ?? null;
  const studentId: string = student?.id ?? (user as any)?.studentId ?? '';

  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoices({
    studentId,
    academicYearId: academicYearFilter || undefined,
    limit: 50,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useGetPayments({
    studentId,
    limit: 50,
  });

  const invoices: any[] = invoicesData?.data?.data ?? [];
  const payments: any[] = paymentsData?.data?.data ?? [];

  const totalBilled = invoices
    .filter((i) => !['CANCELLED', 'WAIVED'].includes(i.status))
    .reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const totalPaid = invoices
    .filter((i) => !['CANCELLED', 'WAIVED'].includes(i.status))
    .reduce((s, i) => s + (i.paidAmount ?? 0), 0);
  const totalBalance = totalBilled - totalPaid;
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  function setTab(tab: string) {
    setSearchParams((prev) => { prev.set('tab', tab); return prev; });
  }

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
        <AlertCircle className="w-8 h-8" />
        <p>No student account linked to your profile. Please contact the school office.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Account</h1>
          {student?.name && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {student.name} · Adm: {student.admissionNumber}
              {student.className ? ` · ${student.className}` : ''}
            </p>
          )}
        </div>

        {/* Academic year filter */}
        <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All years</SelectItem>
            {(academicYears as any[]).map((y: any) => (
              <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className={totalBalance > 0 ? 'border-red-300 dark:border-red-800' : ''}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={`text-xl font-bold mt-1 ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Invoices</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xl font-bold">{invoices.length}</p>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">{overdueCount} overdue</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            You have <strong>{overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}</strong>.
            Please contact the bursar's office to arrange payment.
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="statement" className="gap-1.5">
            <Printer className="w-4 h-4" />
            Statement
          </TabsTrigger>
        </TabsList>

        {/* ── Invoices tab ── */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fee Invoices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoicesLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No invoices found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">Invoice #</th>
                        <th className="text-left px-4 py-2.5 font-medium">Description</th>
                        <th className="text-left px-4 py-2.5 font-medium">Due Date</th>
                        <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                        <th className="text-right px-4 py-2.5 font-medium">Paid</th>
                        <th className="text-right px-4 py-2.5 font-medium">Balance</th>
                        <th className="text-left px-4 py-2.5 font-medium">Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoices.map((inv: any) => {
                        const balance = (inv.totalAmount ?? 0) - (inv.paidAmount ?? 0);
                        const style = STATUS_STYLES[inv.status] ?? { label: inv.status, className: '' };
                        return (
                          <tr key={inv.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">
                              {inv.feeStructure?.name ?? inv.description ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount ?? 0)}</td>
                            <td className="px-4 py-3 text-right text-green-600">{formatCurrency(inv.paidAmount ?? 0)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(balance)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.className}`}>
                                {style.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setSelectedInvoiceId(inv.id)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payments tab ── */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No payments recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium">Receipt #</th>
                        <th className="text-left px-4 py-2.5 font-medium">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium">Method</th>
                        <th className="text-left px-4 py-2.5 font-medium">Reference</th>
                        <th className="text-left px-4 py-2.5 font-medium">Invoice #</th>
                        <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs">{p.receiptNumber ?? '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {p.paymentMethod ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                            {p.referenceNumber ?? '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {p.invoice?.invoiceNumber ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">
                            {formatCurrency(p.amount ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Statement tab ── */}
        <TabsContent value="statement" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {student ? (
                <StudentFeeStatement
                  student={student}
                  academicYearId={academicYearFilter || undefined}
                  schoolName={school?.name}
                  schoolAddress={school?.address}
                  schoolPhone={school?.phone}
                  schoolEmail={school?.email}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Student information unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice details modal (read-only for parent — no cancel/payment actions exposed) */}
      <InvoiceDetailsModal
        open={!!selectedInvoiceId}
        onOpenChange={(open) => { if (!open) setSelectedInvoiceId(null); }}
        invoiceId={selectedInvoiceId ?? ''}
      />
    </div>
  );
}