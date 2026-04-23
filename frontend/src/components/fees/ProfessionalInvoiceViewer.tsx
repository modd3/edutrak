/**
 * Professional Invoice Viewer Component
 * Print-ready invoice with professional layout following school accounting standards
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Button,
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Badge,
  Printer,
  Download,
  Edit2,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetInvoiceById, useCancelInvoice, useUpdateInvoice } from '@/hooks/use-fees';
import { formatCurrency, formatDate, amountInWords } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSchoolContext } from '@/hooks/use-school-context';
import { PaymentRecordingModal } from './PaymentRecordingModal';

interface ProfessionalInvoiceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

const INVOICE_STATUS_COLORS: Record<string, { badge: string; bg: string; text: string }> = {
  PAID: { badge: 'success', bg: 'bg-green-50', text: 'text-green-700' },
  PARTIAL: { badge: 'secondary', bg: 'bg-amber-50', text: 'text-amber-700' },
  UNPAID: { badge: 'destructive', bg: 'bg-red-50', text: 'text-red-700' },
  OVERDUE: { badge: 'destructive', bg: 'bg-red-100', text: 'text-red-800' },
  CANCELLED: { badge: 'outline', bg: 'bg-gray-50', text: 'text-gray-700' },
  WAIVED: { badge: 'outline', bg: 'bg-blue-50', text: 'text-blue-700' },
};

export function ProfessionalInvoiceViewer({
  open,
  onOpenChange,
  invoiceId,
}: ProfessionalInvoiceViewerProps) {
  const { data: invoiceData, isLoading } = useGetInvoiceById(invoiceId);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { mutate: cancelInvoice, isPending: isCancelling } = useCancelInvoice();
  const { mutate: updateInvoice } = useUpdateInvoice();
  const { schoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  const invoice = invoiceData?.data?.data || invoiceData?.data;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleCancel = () => {
    cancelInvoice(invoiceId, {
      onSuccess: () => {
        setShowCancelDialog(false);
        queryClient.invalidateQueries({ queryKey: ['feeInvoices'] });
      },
    });
  };

  const handleApplyDiscount = async (discountAmount: number) => {
    updateInvoice(
      {
        id: invoiceId,
        data: { discountAmount },
      },
      {
        onSuccess: () => {
          toast.success('Discount applied');
          setShowUpdateModal(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-6 w-40" />
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Not Found</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const balance =
    Number(invoice.totalAmount) - Number(invoice.paidAmount) - Number(invoice.discountAmount);
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && balance > 0;
  const statusColors = INVOICE_STATUS_COLORS[invoice.status] || INVOICE_STATUS_COLORS.UNPAID;

  return (
    <>
      <Dialog open={open && !showPaymentModal && !showUpdateModal} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Print-only Header */}
          <div className="hidden print:block mb-8 p-8">
            <div className="text-center space-y-1 mb-8 border-b-2 pb-6">
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="text-gray-600">School Fee Invoice</p>
            </div>
          </div>

          {/* Screen-only Header */}
          <div className="print:hidden">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <DialogTitle className="text-2xl">Invoice {invoice.invoiceNo}</DialogTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={isPrinting}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={invoice.status === 'CANCELLED' || balance <= 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                {invoice.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={Number(invoice.paidAmount) > 0}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-6 print:space-y-4 print:p-8">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 print:gap-4 pb-6 border-b print:border-gray-400">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Invoice Number</label>
                <p className="text-lg font-bold">{invoice.invoiceNo}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Date Issued</label>
                <p className="text-sm">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Due Date</label>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : 'Not set'}
                </p>
              </div>
            </div>

            {/* Student & Billing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
              <Card className="print:border print:border-gray-300 print:shadow-none">
                <CardHeader className="pb-2 print:pb-2">
                  <h3 className="font-semibold text-sm uppercase">Student Information</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm print:text-xs">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-semibold">
                      {invoice.student?.firstName} {invoice.student?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Admission No</p>
                    <p className="font-mono font-semibold">{invoice.student?.admissionNo}</p>
                  </div>
                  {invoice.student?.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-mono text-xs">{invoice.student.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="print:border print:border-gray-300 print:shadow-none">
                <CardHeader className="pb-2 print:pb-2">
                  <h3 className="font-semibold text-sm uppercase">Invoice Status</h3>
                </CardHeader>
                <CardContent className="space-y-3 print:space-y-2">
                  <div>
                    <Badge variant={statusColors.badge as any} className="text-xs">
                      {invoice.status}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        OVERDUE
                      </Badge>
                    )}
                  </div>
                  {invoice.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{invoice.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Invoice Items Table */}
            <div className="print:page-break-inside-avoid">
              <div className="border-t print:border-gray-400 pt-6 print:pt-4">
                <h3 className="font-semibold mb-4 print:mb-2 uppercase text-sm">Invoice Items</h3>
                <div className="overflow-x-auto">
                  <Table className="text-sm print:text-xs">
                    <TableHeader>
                      <TableRow className="print:border-t print:border-gray-400">
                        <TableHead className="print:px-2 print:py-1 text-left">Description</TableHead>
                        <TableHead className="print:px-2 print:py-1 text-left">Category</TableHead>
                        <TableHead className="print:px-2 print:py-1 text-center">Status</TableHead>
                        <TableHead className="print:px-2 print:py-1 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items?.map((item: any, idx: number) => (
                        <TableRow
                          key={item.id}
                          className={idx % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-900 print:bg-white'}
                        >
                          <TableCell className="font-medium print:px-2 print:py-1">{item.name}</TableCell>
                          <TableCell className="print:px-2 print:py-1">{item.category}</TableCell>
                          <TableCell className="text-center print:px-2 print:py-1">
                            {item.isWaived ? (
                              <Badge variant="outline" className="text-xs">
                                Waived
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Charged
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold print:px-2 print:py-1">
                            {formatCurrency(Number(item.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Payment Breakdown Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              {/* Charge Breakdown */}
              <Card className="print:border print:border-gray-300 print:shadow-none bg-slate-50 dark:bg-slate-900 print:bg-white">
                <CardContent className="pt-6 print:pt-4 print:px-4 print:py-3 space-y-2 print:space-y-1 text-sm print:text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Charges</span>
                    <span className="font-semibold">{formatCurrency(Number(invoice.totalAmount))}</span>
                  </div>
                  {Number(invoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400 print:text-black">
                      <span className="text-muted-foreground print:text-black">Discount</span>
                      <span className="font-semibold">
                        −{formatCurrency(Number(invoice.discountAmount))}
                      </span>
                    </div>
                  )}
                  <div className="border-t print:border-gray-300 pt-2 print:pt-1 flex justify-between font-bold">
                    <span>Net Amount Due</span>
                    <span> {formatCurrency(
                      Number(invoice.totalAmount) - Number(invoice.discountAmount)
                    )}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card className={`print:border print:border-gray-300 print:shadow-none ${statusColors.bg}`}>
                <CardContent className="pt-6 print:pt-4 print:px-4 print:py-3 space-y-2 print:space-y-1 text-sm print:text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold text-green-600 print:text-green-700">
                      {formatCurrency(Number(invoice.paidAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding Balance</span>
                    <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.max(0, balance))}
                    </span>
                  </div>
                  <div className="border-t print:border-gray-300 pt-2 print:pt-1">
                    <p className="text-xs text-muted-foreground mb-1">Amount in Words</p>
                    <p className="font-medium text-xs italic">
                      {amountInWords(
                        Number(invoice.totalAmount) - Number(invoice.discountAmount)
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="print:page-break-inside-avoid">
                <div className="border-t print:border-gray-400 pt-6 print:pt-4">
                  <h3 className="font-semibold mb-4 print:mb-2 uppercase text-sm">Payment History</h3>
                  <div className="overflow-x-auto">
                    <Table className="text-xs print:text-[10px]">
                      <TableHeader>
                        <TableRow className="print:border-t print:border-gray-300">
                          <TableHead className="print:px-2 print:py-0.5">Date</TableHead>
                          <TableHead className="print:px-2 print:py-0.5">Method</TableHead>
                          <TableHead className="print:px-2 print:py-0.5">Reference</TableHead>
                          <TableHead className="text-right print:px-2 print:py-0.5">Amount</TableHead>
                          <TableHead className="print:px-2 print:py-0.5">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="print:px-2 print:py-0.5">
                              {formatDate(payment.paidAt)}
                            </TableCell>
                            <TableCell className="print:px-2 print:py-0.5">{payment.method}</TableCell>
                            <TableCell className="text-xs print:px-2 print:py-0.5">
                              {payment.transactionRef || payment.mpesaCode || '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold print:px-2 print:py-0.5">
                              {formatCurrency(Number(payment.amount))}
                            </TableCell>
                            <TableCell className="print:px-2 print:py-0.5">
                              <Badge
                                variant={payment.status === 'COMPLETED' ? 'default' : 'destructive'}
                                className="text-[9px]"
                              >
                                {payment.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-muted-foreground space-y-1 pt-6 print:pt-4 border-t print:border-gray-300">
              <p>Generated: {formatDate(new Date())}</p>
              <p className="text-[10px]">This is a computer-generated invoice. No signature is required.</p>
            </div>
          </div>

          {/* Print stylesheet */}
          <style>{`
            @media print {
              .print\\:hidden { display: none !important; }
              .print\\:block { display: block !important; }
              .print\\:grid { display: grid !important; }
              .print\\:border { border: 1px solid #ccc !important; }
              .print\\:p-8 { padding: 2rem !important; }
              .print\\:page-break-inside-avoid { page-break-inside: avoid !important; }
              body { margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; }
              .dialog { margin: 0; padding: 0; }
              table { width: 100%; border-collapse: collapse; }
              td, th { border: 1px solid #ccc; padding: 6px 4px; }
            }
          `}</style>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel invoice {invoice.invoiceNo}. This action cannot be undone if payments have been recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900 p-3 rounded text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Outstanding: {formatCurrency(balance)}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Invoice'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Recording Modal */}
      <PaymentRecordingModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceId={invoiceId}
      />
    </>
  );
}
