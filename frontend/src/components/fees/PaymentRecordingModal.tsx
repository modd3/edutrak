import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useRecordPayment, useGetInvoiceById } from '@/hooks/use-fees';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMA
// ══════════════════════════════════════════════════════════════════════════

const paymentSchema = z
  .object({
    amount: z.coerce
      .number()
      .positive('Payment amount must be positive'),
    method: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'SCHOLARSHIP']),
    transactionRef: z.string().max(100).optional(),
    mpesaCode: z.string().max(50).optional(),
    bankName: z.string().max(100).optional(),
    chequeNo: z.string().max(50).optional(),
    paidAt: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.method === 'MPESA') {
        return !!(data.mpesaCode || data.transactionRef);
      }
      if (data.method === 'BANK_TRANSFER') {
        return !!data.bankName;
      }
      if (data.method === 'CHEQUE') {
        return !!data.chequeNo;
      }
      return true;
    },
    {
      message: 'Please provide required details for the payment method',
      path: ['method'],
    }
  );

type PaymentFormData = z.infer<typeof paymentSchema>;

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════

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
  { value: 'SCHOLARSHIP', label: 'Scholarship' },
];

export function PaymentRecordingModal({
  open,
  onOpenChange,
  invoiceId,
}: PaymentRecordingModalProps) {
  const { mutate: recordPayment, isPending: isRecording } = useRecordPayment();
  const { data: invoiceData, isLoading: isLoadingInvoice } =
    useGetInvoiceById(invoiceId);

  const invoice = invoiceData?.data?.data;
  const balance = invoice
    ? invoice.totalAmount - invoice.paidAmount - invoice.discountAmount
    : 0;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balance > 0 ? balance : 0,
      method: 'CASH',
      transactionRef: '',
      mpesaCode: '',
      bankName: '',
      chequeNo: '',
      notes: '',
    },
  });

  const watchMethod = form.watch('method');
  const watchAmount = form.watch('amount');

  useEffect(() => {
    if (open && invoice && balance > 0) {
      form.reset({
        amount: balance,
        method: 'CASH',
      });
    }
  }, [open, invoice, balance, form]);

  const onSubmit = (data: PaymentFormData) => {
    recordPayment(
      {
        invoiceId,
        ...data,
        paidAt: data.paidAt || new Date().toISOString(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  if (isLoadingInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Loading invoice details...</p>
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
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Invoice not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoiceNo}
          </DialogDescription>
          <DialogDescription>
            {invoice.student.admissionNo}
          </DialogDescription>
          <DialogDescription>
            {invoice.student.firstName} {invoice.student.lastName}
          </DialogDescription>
        </DialogHeader>

        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">KES {invoice.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid to Date:</span>
              <span className="font-medium">KES {invoice.paidAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium">KES {invoice.discountAmount}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold">Outstanding Balance:</span>
              <span
                className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                KES {balance}
              </span>
            </div>
          </div>

          {balance <= 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invoice has been fully paid. No additional payment needed.
              </AlertDescription>
            </Alert>
          )}
        <ScrollArea className="h-[calc(60vh-200px)]">
          <div className="grid grid-cols-2 gap-4">
          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (KES) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register('amount')}
              disabled={balance <= 0}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-red-500">{form.formState.errors.amount.message}</p>
            )}
            {watchAmount > balance && balance > 0 && (
              <p className="text-xs text-amber-600">
                Payment exceeds outstanding balance by KES {(watchAmount - balance)}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Controller
              name="method"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Method-specific fields */}
          {watchMethod === 'MPESA' && (
            <div className="space-y-2">
              <Label htmlFor="mpesaCode">M-Pesa Code or Transaction Ref *</Label>
              <Input
                id="mpesaCode"
                {...form.register('mpesaCode')}
                placeholder="e.g., LHEX12345MN"
              />
              {form.formState.errors.mpesaCode && (
                <p className="text-xs text-red-500">{form.formState.errors.mpesaCode.message}</p>
              )}
            </div>
          )}

          {watchMethod === 'BANK_TRANSFER' && (
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                {...form.register('bankName')}
                placeholder="e.g., Kenya Commercial Bank"
              />
              {form.formState.errors.bankName && (
                <p className="text-xs text-red-500">{form.formState.errors.bankName.message}</p>
              )}
            </div>
          )}

          {watchMethod === 'CHEQUE' && (
            <div className="space-y-2">
              <Label htmlFor="chequeNo">Cheque Number *</Label>
              <Input
                id="chequeNo"
                {...form.register('chequeNo')}
                placeholder="e.g., 12345678"
              />
              {form.formState.errors.chequeNo && (
                <p className="text-xs text-red-500">{form.formState.errors.chequeNo.message}</p>
              )}
            </div>
          )}

          {/* Transaction Reference (optional for other methods) */}
          {!['MPESA', 'CHEQUE'].includes(watchMethod) && (
            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference (optional)</Label>
              <Input
                id="transactionRef"
                {...form.register('transactionRef')}
                placeholder="e.g., receipt number"
              />
            </div>
          )}

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidAt">Payment Date (optional)</Label>
            <Input
              id="paidAt"
              type="datetime-local"
              {...form.register('paidAt')}
            />
            <p className="text-xs text-gray-500">Defaults to current date/time if not specified</p>
          </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any additional notes about this payment"
              rows={2}
            />
          </div>

          <div className="space-y-2 p-2">
          {form.formState.errors.method?.message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{form.formState.errors.method.message}</AlertDescription>
            </Alert>
          )}
          </div>
        </ScrollArea>
        </form>
        

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isRecording || balance <= 0}
          >
            {isRecording ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
