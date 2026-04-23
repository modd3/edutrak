// frontend/src/components/fees/PaymentRecordingModal.tsx
// REPLACES the existing version — adds receipt print functionality
import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRecordPayment, useGetInvoiceById } from '@/hooks/use-fees';
import { useSchoolContext } from '@/hooks/use-school-context';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { formatCurrency, amountInWords } from '@/lib/utils'; 
import { ScrollArea } from '../ui/scroll-area';
 
// ─── Receipt component (hidden, for printing only) ────────────────────────
 
interface ReceiptData {
  receiptNo: string;
  schoolName: string;
  studentName: string;
  admissionNo: string;
  invoiceNo: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
  collectedBy: string;
}
 
function PrintReceipt({ data }: { data: ReceiptData }) {
  return (
    <div
      id="fee-receipt-print"
      className="hidden print:block font-mono text-sm bg-white text-black p-8 w-full"
      style={{ fontFamily: 'monospace' }}
    >
      <style>{`
        @media print {
          body > *:not(#fee-receipt-print) { display: none !important; }
          #fee-receipt-print { display: block !important; }
        }
      `}</style>
 
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-lg font-bold uppercase tracking-wide">{data.schoolName}</p>
        <p className="text-xs mt-1">OFFICIAL FEE RECEIPT</p>
        <div className="border-b-2 border-black mt-3 mb-2" />
        <div className="border-b border-black mb-3" />
      </div>
 
      {/* Receipt details */}
      <div className="space-y-1.5 mb-6">
        <div className="flex justify-between">
          <span>Receipt No:</span>
          <span className="font-bold">{data.receiptNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Invoice No:</span>
          <span>{data.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(data.paidAt).toLocaleDateString('en-KE', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{new Date(data.paidAt).toLocaleTimeString('en-KE', {
            hour: '2-digit', minute: '2-digit',
          })}</span>
        </div>
      </div>
 
      <div className="border-t border-dashed border-black pt-3 mb-4 space-y-1.5">
        <div className="flex justify-between">
          <span>Student Name:</span>
          <span className="font-bold">{data.studentName}</span>
        </div>
        <div className="flex justify-between">
          <span>Admission No:</span>
          <span>{data.admissionNo}</span>
        </div>
      </div>
 
      <div className="border-t border-dashed border-black pt-3 mb-4 space-y-1.5">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="font-bold">{data.method}</span>
        </div>
        {data.reference && (
          <div className="flex justify-between">
            <span>Reference:</span>
            <span>{data.reference}</span>
          </div>
        )}
      </div>
 
      {/* Amount */}
      <div className="border-2 border-black p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">AMOUNT PAID (KES):</span>
          <span className="text-xl font-bold">{formatCurrency(data.amount)}</span>
        </div>
        <p className="text-xs mt-1 italic">{amountInWords(data.amount)}</p>
      </div>
 
      {/* PAID stamp */}
      <div className="text-center mb-4">
        <span className="inline-block border-4 border-green-700 text-green-700 font-black text-2xl px-6 py-1 rotate-[-8deg]">
          PAID
        </span>
      </div>
 
      {/* Footer */}
      <div className="border-t border-black pt-3 mt-4 space-y-1.5">
        <div className="flex justify-between">
          <span>Collected by:</span>
          <span>{data.collectedBy}</span>
        </div>
        <p className="text-xs text-center mt-3">This is a computer-generated receipt.</p>
        <p className="text-xs text-center">No signature required.</p>
      </div>
    </div>
  );
}
 
// ─── Zod schema ──────────────────────────────────────────────────────────────
 
const paymentSchema = z
  .object({
    amount: z.coerce.number().positive('Amount must be positive'),
    method: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'SCHOLARSHIP']),
    transactionRef: z.string().optional(),
    mpesaCode: z.string().optional(),
    bankName: z.string().optional(),
    chequeNo: z.string().optional(),
    paidAt: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (d) => {
      if (d.method === 'MPESA') return !!(d.mpesaCode || d.transactionRef);
      if (d.method === 'BANK_TRANSFER') return !!d.bankName;
      if (d.method === 'CHEQUE') return !!d.chequeNo;
      return true;
    },
    {
      message: 'Please provide the required reference for this payment method',
      path: ['method'],
    }
  );
 
type PaymentFormData = z.infer<typeof paymentSchema>;
 
// ─── Component ───────────────────────────────────────────────────────────────
 
interface PaymentRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}
 
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MPESA', label: 'M-Pesa' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'SCHOLARSHIP', label: 'Scholarship / Bursary' },
];
 
export function PaymentRecordingModal({
  open,
  onOpenChange,
  invoiceId,
}: PaymentRecordingModalProps) {
  const { mutate: recordPayment, isPending: isRecording } = useRecordPayment();
  const { data: invoiceData, isLoading: isLoadingInvoice } = useGetInvoiceById(invoiceId);
  const { schoolName } = useSchoolContext();
  const { user } = useAuthStore();
 
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
 
  const invoice = invoiceData?.data;
  const balance = invoice
    ? invoice.totalAmount - invoice.paidAmount - invoice.discountAmount
    : 0;
 
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      method: 'CASH',
      paidAt: new Date().toISOString().slice(0, 16),
    },
  });
 
  const watchMethod = form.watch('method');
  const watchAmount = form.watch('amount');
 
  useEffect(() => {
    if (open && invoice && balance > 0) {
      form.reset({
        amount: balance,
        method: 'CASH',
        paidAt: new Date().toISOString().slice(0, 16),
      });
      setStep('form');
      setReceiptData(null);
    }
  }, [open, invoice, balance]);
 
  const onSubmit = (data: PaymentFormData) => {
    recordPayment(
      {
        invoiceId,
        ...data,
        paidAt: data.paidAt ? new Date(data.paidAt).toISOString() : new Date().toISOString(),
      },
      {
        onSuccess: (res) => {
          const payment = res?.data?.data ?? res?.data;
          setReceiptData({
            receiptNo: payment?.receiptNo ?? `RCP-${Date.now()}`,
            schoolName: schoolName ?? 'School',
            studentName: `${invoice?.student?.firstName ?? ''} ${invoice?.student?.lastName ?? ''}`.trim(),
            admissionNo: invoice?.student?.admissionNo ?? '',
            invoiceNo: invoice?.invoiceNo ?? invoiceId,
            amount: data.amount,
            method: data.method,
            reference: data.mpesaCode || data.transactionRef || data.chequeNo,
            paidAt: data.paidAt ?? new Date().toISOString(),
            collectedBy: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          });
          setStep('success');
        },
      }
    );
  };
 
  const handlePrint = () => window.print();
 
  const handleClose = () => {
    setStep('form');
    setReceiptData(null);
    form.reset();
    onOpenChange(false);
  };
 
  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoadingInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Loading invoice…</div>
        </DialogContent>
      </Dialog>
    );
  }
 
  if (!invoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Invoice not found</AlertDescription></Alert>
        </DialogContent>
      </Dialog>
    );
  }
 
  // ── Success / receipt view ────────────────────────────────────────────────
  if (step === 'success' && receiptData) {
    return (
      <>
        {/* Hidden print receipt */}
        <PrintReceipt data={receiptData} />
 
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Payment Recorded
              </DialogTitle>
              <DialogDescription>
                Receipt No. <span className="font-mono font-semibold">{receiptData.receiptNo}</span>
              </DialogDescription>
            </DialogHeader>
 
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{receiptData.studentName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-mono text-xs">{receiptData.invoiceNo}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Amount Paid:</span>
                <span className="font-bold text-green-700 text-lg">{formatCurrency(receiptData.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Method:</span>
                <Badge variant="outline">{receiptData.method}</Badge>
              </div>
              {receiptData.reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-xs">{receiptData.reference}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 italic mt-2">{amountInWords(receiptData.amount)}</p>
            </div>
 
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
 
  // ── Payment form ──────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Invoice <span className="font-mono font-semibold">{invoice.invoiceNo}</span> ·{' '}
            {invoice.student?.firstName} {invoice.student?.lastName}
          </DialogDescription>
        </DialogHeader>
  
        {/* Invoice balance summary */}
        <div className="bg-gray-50 border rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="text-green-600 font-medium">{formatCurrency(invoice.paidAmount)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="text-amber-600 font-medium">{formatCurrency(invoice.discountAmount)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold">
            <span>Outstanding Balance:</span>
            <span className={balance > 0 ? 'text-red-700' : 'text-green-700'}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
 
        {balance <= 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>This invoice has already been fully settled.</AlertDescription>
          </Alert>
        )}
 
      <ScrollArea className="max-h-[50vh] pr-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (KES) *</Label>
              {balance > 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto py-0 text-xs"
                  onClick={() => form.setValue('amount', balance)}
                >
                  Pay full balance ({formatCurrency(balance)})
                </Button>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              step="1"
              min="1"
              {...form.register('amount', { valueAsNumber: true })}
              disabled={balance <= 0}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
            )}
            {watchAmount > 0 && watchAmount > balance && balance > 0 && (
              <p className="text-xs text-amber-600">
                ⚠ Exceeds outstanding balance by {formatCurrency(watchAmount - balance)}
              </p>
            )}
          </div>
 
          {/* Payment method */}
          <div className="space-y-1.5">
            <Label>Payment Method *</Label>
            <Controller
              name="method"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
 
          {/* Method-specific reference fields */}
          {watchMethod === 'MPESA' && (
            <div className="space-y-1.5">
              <Label htmlFor="mpesaCode">M-Pesa Code *</Label>
              <Input
                id="mpesaCode"
                placeholder="e.g. QK12AB34CD"
                {...form.register('mpesaCode')}
              />
            </div>
          )}
          {watchMethod === 'BANK_TRANSFER' && (
            <div className="space-y-1.5">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input id="bankName" placeholder="e.g. KCB Bank" {...form.register('bankName')} />
            </div>
          )}
          {watchMethod === 'CHEQUE' && (
            <div className="space-y-1.5">
              <Label htmlFor="chequeNo">Cheque Number *</Label>
              <Input id="chequeNo" placeholder="e.g. 001234" {...form.register('chequeNo')} />
            </div>
          )}
          {!['MPESA', 'CHEQUE'].includes(watchMethod) && (
            <div className="space-y-1.5">
              <Label htmlFor="transactionRef">Transaction Reference</Label>
              <Input
                id="transactionRef"
                placeholder="Optional reference number"
                {...form.register('transactionRef')}
              />
            </div>
          )}
 
          {form.formState.errors.method && (
            <p className="text-xs text-red-500">{(form.formState.errors.method as any).message}</p>
          )}
 
          {/* Payment date */}
          <div className="space-y-1.5">
            <Label htmlFor="paidAt">Payment Date & Time</Label>
            <Input
              id="paidAt"
              type="datetime-local"
              {...form.register('paidAt')}
            />
          </div>
          </div>
 
          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Any additional notes…"
              {...form.register('notes')}
            />
          </div>
        </form>
      
      </ScrollArea>
 
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRecording}>Cancel</Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isRecording || balance <= 0}
          >
            {isRecording ? 'Recording…' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
 
