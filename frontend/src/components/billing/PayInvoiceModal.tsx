import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePayInvoice } from '@/hooks/use-billing-invoices';
import { BillingInvoice } from '@/types';
import { formatCurrency } from '@/lib/utils';

const payInvoiceSchema = z.object({
  phoneNumber: z.string().min(10, 'Enter a valid phone number').max(15),
});

type PayInvoiceInput = z.infer<typeof payInvoiceSchema>;

interface PayInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: BillingInvoice | null;
}

export function PayInvoiceModal({ open, onOpenChange, invoice }: PayInvoiceModalProps) {
  const [step, setStep] = useState<'form' | 'pending' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const payMutation = usePayInvoice();

  const form = useForm<PayInvoiceInput>({
    resolver: zodResolver(payInvoiceSchema),
    defaultValues: { phoneNumber: '' },
  });

  const handleSubmit = async (data: PayInvoiceInput) => {
    if (!invoice) return;

    setErrorMessage('');
    setStep('pending');

    try {
      await payMutation.mutateAsync({
        invoiceId: invoice.id,
        phoneNumber: data.phoneNumber,
      });
      setStep('success');
    } catch (error: any) {
      setStep('error');
      setErrorMessage(error.response?.data?.error || error.message || 'Payment initiation failed');
    }
  };

  const handleClose = () => {
    setStep('form');
    setErrorMessage('');
    form.reset();
    onOpenChange(false);
  };

  if (!invoice) return null;

  const remaining = (invoice.totalMinor - invoice.amountPaidMinor) / 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Invoice</DialogTitle>
          <DialogDescription>
            Complete payment for invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Invoice</span>
            <span className="font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Due Date</span>
            <span className="font-medium">{new Date(invoice.dueAt).toLocaleDateString('en-KE')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status</span>
            <span className="font-medium capitalize">{invoice.status.toLowerCase()}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t">
            <span>Amount Due</span>
            <span>{formatCurrency(remaining)}</span>
          </div>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  placeholder="07XX XXX XXX or 2547XX XXX XXX"
                  className="pl-10"
                  {...form.register('phoneNumber')}
                  disabled={payMutation.isPending}
                />
              </div>
              {form.formState.errors.phoneNumber && (
                <p className="text-sm text-red-600">{form.formState.errors.phoneNumber.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the phone number registered with M-Pesa
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={payMutation.isPending}>
              {payMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Payment...
                </>
              ) : (
                'Pay with M-Pesa'
              )}
            </Button>
          </form>
        )}

        {/* Pending Step */}
        {step === 'pending' && (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">Check Your Phone</h3>
              <p className="text-sm text-gray-600 mt-1">
                An M-Pesa STK Push prompt has been sent to your phone. Enter your PIN to complete the payment.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Waiting for confirmation... This may take a few moments.
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div>
              <h3 className="font-semibold text-lg">Payment Initiated</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please check your phone and enter your M-Pesa PIN to complete the payment.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={() => setStep('form')} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}