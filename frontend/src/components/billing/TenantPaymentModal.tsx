import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Smartphone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Building,
  Receipt
} from 'lucide-react';
import { usePayInvoice } from '@/hooks/use-billing-invoices';
import { BillingInvoice } from '@/types';
import { formatCurrency, generateIdempotencyKey } from '@/lib/utils';

const paymentFormSchema = z.object({
  provider: z.enum(['MPESA', 'FLUTTERWAVE']),
  phoneNumber: z.string().optional(),
});

type PaymentFormInput = z.infer<typeof paymentFormSchema>;

interface TenantPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: BillingInvoice | null;
  schoolName?: string;
}

export function TenantPaymentModal({ open, onOpenChange, invoice, schoolName }: TenantPaymentModalProps) {
  const [step, setStep] = useState<'form' | 'pending' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'MPESA' | 'FLUTTERWAVE'>('MPESA');

  const payMutation = usePayInvoice();

  const form = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { 
      provider: 'MPESA',
      phoneNumber: '' 
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep('form');
      setErrorMessage('');
      form.reset();
      setSelectedProvider('MPESA');
    }
  }, [open, form]);

  const validatePhoneNumber = (phone: string) => {
    if (selectedProvider !== 'MPESA') return true;
    
    const cleaned = phone.replace(/\D/g, '');
    const patterns = [
      /^254[17][0-9]{8}$/, // 254712345678 or 254112345678
      /^0[17][0-9]{8}$/,   // 0712345678 or 0112345678
      /^[17][0-9]{8}$/     // 712345678 or 112345678
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = async (data: PaymentFormInput) => {
    if (!invoice) return;

    // Validate phone number for M-Pesa
    if (selectedProvider === 'MPESA') {
      const phoneNumber = data.phoneNumber || '';
      if (!validatePhoneNumber(phoneNumber)) {
        setErrorMessage('Please enter a valid Kenyan phone number');
        return;
      }
    }

    setErrorMessage('');
    setStep('pending');

    try {
      const paymentData = {
        invoiceId: invoice.id,
        provider: selectedProvider,
        phoneNumber: selectedProvider === 'MPESA' ? formatPhoneNumber(data.phoneNumber || '') : undefined,
        idempotencyKey: generateIdempotencyKey('tenant-payment'),
      };

      await payMutation.mutateAsync(paymentData);
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
  const subtotal = invoice.subtotalMinor / 100;
  const tax = invoice.taxMinor / 100;

  const getStatusIcon = () => {
    switch (step) {
      case 'pending':
        return <Clock className="h-6 w-6 text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Building className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Pay Subscription Invoice
          </DialogTitle>
          <DialogDescription>
            Complete payment for your school's subscription
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">Invoice: {invoice.invoiceNumber}</p>
              <p className="text-xs text-gray-600">{schoolName}</p>
            </div>
            <Badge variant={invoice.status === 'OPEN' ? 'destructive' : 'default'}>
              {invoice.status}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(subtotal, invoice.currency)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(tax, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="text-green-600">{formatCurrency(invoice.amountPaidMinor / 100, invoice.currency)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center font-bold text-lg">
            <span>Amount Due</span>
            <span className="text-red-600">{formatCurrency(remaining, invoice.currency)}</span>
          </div>

          <p className="text-xs text-gray-600">
            Due: {new Date(invoice.dueAt).toLocaleDateString('en-KE')}
          </p>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['MPESA', 'FLUTTERWAVE'] as const).map(provider => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(provider);
                      form.setValue('provider', provider);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors ${
                      selectedProvider === provider
                        ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    {provider === 'MPESA' ? (
                      <>
                        <Smartphone className="h-5 w-5" />
                        <div className="text-left">
                          <div>M-Pesa</div>
                          <div className="text-xs text-gray-500">Mobile Money</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <div className="text-left">
                          <div>Card Payment</div>
                          <div className="text-xs text-gray-500">Visa, Mastercard</div>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number Input for M-Pesa */}
            {selectedProvider === 'MPESA' && (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  M-Pesa Phone Number
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="0712 345 678"
                    className="pl-10"
                    {...form.register('phoneNumber')}
                    disabled={payMutation.isPending}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  You'll receive an STK Push notification to approve the payment
                </p>
              </div>
            )}

            {/* Card Payment Info */}
            {selectedProvider === 'FLUTTERWAVE' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Secure Card Payment</p>
                    <p className="text-xs text-blue-700 mt-1">
                      You will be redirected to a secure Flutterwave checkout page to complete your payment using your debit or credit card.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={handleClose}
                disabled={payMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={
                  payMutation.isPending || 
                  (selectedProvider === 'MPESA' && !form.watch('phoneNumber'))
                }
              >
                {payMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay {formatCurrency(remaining, invoice.currency)}</>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Pending Step */}
        {step === 'pending' && (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">
                {selectedProvider === 'MPESA' ? 'Check Your Phone' : 'Redirecting...'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProvider === 'MPESA'
                  ? 'An M-Pesa STK Push prompt has been sent to your phone. Enter your PIN to complete the payment.'
                  : 'You will be redirected to the secure payment page shortly.'}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Waiting for confirmation... This may take a few moments.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div>
              <h3 className="font-semibold text-lg">Payment Initiated Successfully</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProvider === 'MPESA'
                  ? 'Please check your phone and enter your M-Pesa PIN to complete the payment.'
                  : 'Your payment has been processed successfully.'}
              </p>
            </div>
            <Alert className="border-green-200 bg-green-50">
              <Receipt className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A payment confirmation will be sent to your email once the transaction is complete.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              Done
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
            <div className="flex gap-3">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setStep('form');
                  setErrorMessage('');
                }} 
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}