/**
 * Professional Invoice Viewer
 * Print-ready invoice with school header, receipt copy, and production-grade print CSS.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Printer, XCircle, CreditCard } from 'lucide-react';
import { useGetInvoiceById, useCancelInvoice, useUpdateInvoice } from '@/hooks/use-fees';
import { formatCurrency, formatDate, amountInWords } from '@/lib/utils';
import { toast } from 'sonner';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useAuthStore } from '@/store/auth-store';
import { PaymentRecordingModal } from './PaymentRecordingModal';

interface ProfessionalInvoiceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

const STATUS_COLORS: Record<string, { badge: 'default' | 'secondary' | 'destructive' | 'outline'; bg: string }> = {
  PAID:      { badge: 'default',     bg: 'bg-green-50 dark:bg-green-950' },
  PARTIAL:   { badge: 'secondary',   bg: 'bg-amber-50 dark:bg-amber-950' },
  UNPAID:    { badge: 'destructive', bg: 'bg-red-50 dark:bg-red-950' },
  OVERDUE:   { badge: 'destructive', bg: 'bg-red-100 dark:bg-red-900' },
  CANCELLED: { badge: 'outline',     bg: 'bg-gray-50 dark:bg-gray-900' },
  WAIVED:    { badge: 'outline',     bg: 'bg-blue-50 dark:bg-blue-950' },
};

// ─── School Header (shared between original + copy) ─────────────────────────
function SchoolHeader({ school }: { school: any }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b-2 border-gray-800 print-section">
      {/* Logo placeholder */}
      <div className="w-16 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center bg-gray-50 shrink-0 text-xs text-gray-400 font-bold text-center leading-tight">
        LOGO
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
          {school?.name ?? 'School Name'}
        </h1>
        {school?.address && (
          <p className="text-xs text-gray-600 mt-0.5">{school.address}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-600">
          {school?.phone   && <span>Tel: {school.phone}</span>}
          {school?.email   && <span>Email: {school.email}</span>}
          {school?.county  && <span>{school.county} County</span>}
          {school?.knecCode && <span>KNEC: {school.knecCode}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-black uppercase tracking-widest text-gray-800">INVOICE</p>
        <p className="text-xs text-gray-500 mt-0.5">School Fee Invoice</p>
      </div>
    </div>
  );
}

// ─── Invoice Body (reused for both copies) ───────────────────────────────────
function InvoiceBody({ invoice, balance, isOverdue, statusColors }: {
  invoice: any;
  balance: number;
  isOverdue: boolean;
  statusColors: typeof STATUS_COLORS[string];
}) {
  return (
    <div className="space-y-4">
      {/* Meta row */}
      <div className="grid grid-cols-3 gap-4 pt-4 pb-3 border-b border-gray-200">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Invoice No</p>
          <p className="font-bold text-sm">{invoice.invoiceNo}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Date Issued</p>
          <p className="text-sm">{formatDate(invoice.createdAt)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Due Date</p>
          <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
            {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
          </p>
        </div>
      </div>

      {/* Student + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Billed To</p>
          <p className="font-bold">
            {invoice.student?.firstName} {invoice.student?.lastName}
          </p>
          <p className="text-xs text-gray-500 font-mono">{invoice.student?.admissionNo}</p>
          {invoice.student?.email && (
            <p className="text-xs text-gray-500">{invoice.student.email}</p>
          )}
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Status</p>
          <div>
            <Badge variant={statusColors.badge} className="text-xs">
              {invoice.status}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs ml-1">OVERDUE</Badge>
            )}
          </div>
          {invoice.notes && (
            <p className="text-xs text-gray-500 mt-1 italic">{invoice.notes}</p>
          )}
        </div>
      </div>

      {/* Items table */}
      <div>
        <p className="text-[10px] font-semibold uppercase text-gray-500 mb-1">Fee Items</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-gray-300 bg-gray-50">
              <th className="text-left py-1.5 px-2 font-semibold text-xs">Description</th>
              <th className="text-left py-1.5 px-2 font-semibold text-xs">Category</th>
              <th className="text-center py-1.5 px-2 font-semibold text-xs">Type</th>
              <th className="text-right py-1.5 px-2 font-semibold text-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item: any, idx: number) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-1 px-2">{item.name}</td>
                <td className="py-1 px-2 text-xs text-gray-600">{item.category}</td>
                <td className="py-1 px-2 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.isWaived ? 'bg-blue-100 text-blue-700' : item.isOptional ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'}`}>
                    {item.isWaived ? 'Waived' : item.isOptional ? 'Optional' : 'Mandatory'}
                  </span>
                </td>
                <td className="py-1 px-2 text-right font-medium">
                  {item.isWaived ? <span className="line-through text-gray-400">{formatCurrency(Number(item.amount))}</span> : formatCurrency(Number(item.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 border-t pt-3">
        {/* Charge summary */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Gross Amount</span>
            <span className="font-medium">{formatCurrency(Number(invoice.totalAmount))}</span>
          </div>
          {Number(invoice.discountAmount) > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Discount</span>
              <span className="font-medium">−{formatCurrency(Number(invoice.discountAmount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>Net Due</span>
            <span>{formatCurrency(Number(invoice.totalAmount) - Number(invoice.discountAmount))}</span>
          </div>
        </div>
        {/* Payment status */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-green-700">{formatCurrency(Number(invoice.paidAmount))}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1 mt-1">
            <span>Balance</span>
            <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
              {formatCurrency(Math.max(0, balance))}
            </span>
          </div>
          <p className="text-[10px] italic text-gray-500 mt-1">
            {amountInWords(Number(invoice.totalAmount) - Number(invoice.discountAmount))}
          </p>
        </div>
      </div>

      {/* Payment history (compact) */}
      {(invoice.payments ?? []).length > 0 && (
        <div className="border-t pt-3">
          <p className="text-[10px] font-semibold uppercase text-gray-500 mb-1">Payment History</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1 px-1.5 font-semibold">Date</th>
                <th className="text-left py-1 px-1.5 font-semibold">Method</th>
                <th className="text-left py-1 px-1.5 font-semibold">Reference</th>
                <th className="text-right py-1 px-1.5 font-semibold">Amount</th>
                <th className="text-center py-1 px-1.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-0.5 px-1.5">{formatDate(p.paidAt)}</td>
                  <td className="py-0.5 px-1.5">{p.method}</td>
                  <td className="py-0.5 px-1.5 font-mono">{p.transactionRef || p.mpesaCode || '—'}</td>
                  <td className="py-0.5 px-1.5 text-right font-medium">{formatCurrency(Number(p.amount))}</td>
                  <td className="py-0.5 px-1.5 text-center">
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ProfessionalInvoiceViewer({
  open,
  onOpenChange,
  invoiceId,
}: ProfessionalInvoiceViewerProps) {
  const { data: invoiceData, isLoading } = useGetInvoiceById(invoiceId);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { mutate: cancelInvoice, isPending: isCancelling } = useCancelInvoice();
  const { mutate: updateInvoice } = useUpdateInvoice();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const school = user?.school;

  // useGetInvoiceById now returns the invoice object directly
  const invoice = invoiceData;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleCancel = () => {
    cancelInvoice(invoiceId, {
      onSuccess: () => {
        setShowCancelDialog(false);
        queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
        toast.success('Invoice cancelled');
      },
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><Skeleton className="h-6 w-40" /></DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invoice Not Found</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const balance =
    Number(invoice.totalAmount) - Number(invoice.paidAmount) - Number(invoice.discountAmount);
  const isOverdue =
    invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0;
  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.UNPAID;
  const canCancel = invoice.status !== 'CANCELLED' && Number(invoice.paidAmount) === 0;

  return (
    <>
      <Dialog
        open={open && !showPaymentModal}
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto print:hidden">
          {/* Screen toolbar */}
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-xl">
              Invoice {invoice.invoiceNo}
              <Badge variant={statusColors.badge} className="ml-3 text-xs align-middle">
                {invoice.status}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              {invoice.status !== 'CANCELLED' && balance > 0 && (
                <Button size="sm" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Record Payment
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Screen preview */}
          <div className="space-y-6 mt-2">
            <Card>
              <CardContent className="p-6">
                <SchoolHeader school={school} />
                <InvoiceBody
                  invoice={invoice}
                  balance={balance}
                  isOverdue={!!isOverdue}
                  statusColors={statusColors}
                />
              </CardContent>
            </Card>

            {/* Receipt copy preview (screen-only hint) */}
            <div className="border border-dashed rounded-lg p-4 bg-gray-50 dark:bg-gray-900 text-center text-xs text-muted-foreground">
              A receipt copy will be printed on the second half of the page when you print.
            </div>

            <div className="text-xs text-muted-foreground border-t pt-3">
              Generated: {formatDate(new Date())} •
              This is a computer-generated document. No manual signature required.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Printable document (portal-rendered outside dialog) ── */}
      <div className="hidden print:block" id="invoice-print-root">
        {/* === ORIGINAL COPY === */}
        <div className="invoice-copy">
          <div className="copy-label">ORIGINAL</div>
          <SchoolHeader school={school} />
          <InvoiceBody
            invoice={invoice}
            balance={balance}
            isOverdue={!!isOverdue}
            statusColors={statusColors}
          />
          <div className="invoice-footer">
            <p>Generated: {formatDate(new Date())}</p>
            <p>This is a computer-generated invoice. No signature required.</p>
          </div>
        </div>

        {/* === RECEIPT COPY (cut here) === */}
        <div className="cut-line">
          <span>✂ ─────────────────── RECEIPT COPY ───────────────────── ✂</span>
        </div>

        <div className="invoice-copy receipt-copy">
          <div className="copy-label">DUPLICATE — SCHOOL COPY</div>
          <div className="receipt-header">
            <span className="font-bold">{school?.name ?? 'School'}</span>
            <span className="float-right">Invoice: {invoice.invoiceNo}</span>
          </div>
          <div className="receipt-meta">
            <span>Student: {invoice.student?.firstName} {invoice.student?.lastName} ({invoice.student?.admissionNo})</span>
            <span className="float-right">Date: {formatDate(invoice.createdAt)}</span>
          </div>
          <table className="w-full border-collapse text-xs mt-2">
            <tbody>
              {(invoice.items ?? []).filter((i: any) => !i.isWaived).map((item: any) => (
                <tr key={item.id} className="border-b">
                  <td className="py-0.5 pr-2">{item.name}</td>
                  <td className="py-0.5 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="py-1">NET DUE</td>
                <td className="py-1 text-right">
                  {formatCurrency(Number(invoice.totalAmount) - Number(invoice.discountAmount))}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-green-700">PAID</td>
                <td className="py-0.5 text-right text-green-700 font-semibold">
                  {formatCurrency(Number(invoice.paidAmount))}
                </td>
              </tr>
              <tr className="font-bold">
                <td className="py-0.5">BALANCE</td>
                <td className={`py-0.5 text-right ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.max(0, balance))}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="invoice-footer mt-3">
            <p>Status: <strong>{invoice.status}</strong> | {formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          /* Hide everything except our printable root */
          body > * { display: none !important; }
          #invoice-print-root { display: block !important; }

          /* Page setup */
          @page { size: A4; margin: 14mm 16mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; }

          .invoice-copy {
            padding: 0;
            page-break-inside: avoid;
          }
          .receipt-copy { margin-top: 4mm; }
          .copy-label {
            text-align: right;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: #666;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .cut-line {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin: 6mm 0 4mm;
            letter-spacing: 0.05em;
          }
          .receipt-header, .receipt-meta {
            overflow: hidden;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .invoice-footer {
            margin-top: 6mm;
            font-size: 9px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
          /* Expose the print block */
          .hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print-section { display: block !important; }
          table { width: 100%; border-collapse: collapse; }
          td, th { text-align: left; }
        }
        @media screen {
          #invoice-print-root { display: none; }
        }
      `}</style>

      {/* Cancel dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel invoice {invoice.invoiceNo}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-sm">
            <p className="font-semibold">Outstanding: {formatCurrency(balance)}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel Invoice'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment modal */}
      <PaymentRecordingModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceId={invoiceId}
      />
    </>
  );
}
