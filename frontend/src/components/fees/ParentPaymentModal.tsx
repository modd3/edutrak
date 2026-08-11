import { useState, useEffect } from 'react';
import { useInitiateOnlinePayment } from '@/hooks/use-fees';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Smartphone, CreditCard, CheckCircle2, AlertCircle, Receipt, Clock } from 'lucide-react';

interface ParentPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoiceNo: string;
    studentName: string;
    className: string;
    totalAmount: number;
    balanceAmount: number;
    paidAmount: number;
    dueDate?: string;
    status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'WAIVED';
    items?: Array<{
      name: string;
      category: string;
      amount: number;
    }>;
  };
}

export function ParentPaymentModal({ open, onOpenChange, invoice }: ParentPaymentModalProps) {
  const [provider, setProvider] = useState<'MPESA' | 'FLUTTERWAVE'>('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'initiated' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  
  const initiate = useInitiateOnlinePayment();

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date();
  const canPay = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.balanceAmount > 0;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPaymentStatus('idle');
      setStatusMessage('');
      setPhoneNumber('');
      setIsProcessing(false);
    }
  }, [open]);

  const validatePhoneNumber = (phone: string) => {
    // Remove spaces and special characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Kenyan phone number patterns
    const patterns = [
      /^254[17][0-9]{8}$/, // 254712345678 or 254112345678
      /^0[17][0-9]{8}$/,   // 0712345678 or 0112345678
      /^[17][0-9]{8}$/     // 712345678 or 112345678
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to 254 format
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canPay) return;
    
    if (provider === 'MPESA' && !validatePhoneNumber(phoneNumber)) {
      setStatusMessage('Please enter a valid Kenyan phone number');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('idle');

    const paymentData = {
      invoiceId: invoice.id,
      provider,
      phoneNumber: provider === 'MPESA' ? formatPhoneNumber(phoneNumber) : undefined,
      callbackUrl: `${window.location.origin}/parent/payments/callback`
    };

    try {
      await initiate.mutateAsync(paymentData);
      setPaymentStatus('initiated');
      
      if (provider === 'MPESA') {
        setStatusMessage('STK Push sent to your phone. Please check your M-Pesa menu and enter your PIN to complete payment.');
      } else {
        setStatusMessage('Redirecting to secure payment page...');
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      setStatusMessage(error?.response?.data?.message || 'Payment initiation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'initiated':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusAlert = () => {
    if (paymentStatus === 'idle') return null;

    const alertClass = {
      initiated: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
      failed: 'border-red-200 bg-red-50'
    }[paymentStatus];

    const textClass = {
      initiated: 'text-blue-800',
      success: 'text-green-800',
      failed: 'text-red-800'
    }[paymentStatus];

    return (
      <Alert className={alertClass}>
        {getStatusIcon()}
        <AlertDescription className={textClass}>
          {statusMessage}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pay School Fees Online
          </DialogTitle>
          <DialogDescription>
            Securely pay fees for <span className="font-medium">{invoice.studentName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-sm">Invoice: {invoice.invoiceNo}</p>
                <p className="text-xs text-muted-foreground">
                  {invoice.studentName} • {invoice.className}
                </p>
              </div>
              <Badge variant={
                invoice.status === 'PAID' ? 'default' :
                invoice.status === 'PARTIAL' ? 'secondary' :
                isOverdue ? 'destructive' : 'outline'
              }>
                {invoice.status === 'PARTIAL' ? 'Partially Paid' : 
                 invoice.status === 'OVERDUE' ? 'Overdue' : invoice.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Outstanding Balance</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.balanceAmount)}
              </span>
            </div>
            
            {invoice.dueDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Due: {new Date(invoice.dueDate).toLocaleDateString()}
                {isOverdue && <span className="text-red-600 font-medium"> (Overdue)</span>}
              </p>
            )}
          </div>

          {/* Fee Breakdown */}
          {invoice.items && invoice.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fee Breakdown</h4>
              <div className="space-y-1">
                {invoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status Alert */}
          {getStatusAlert()}

          {/* Payment Form */}
          {paymentStatus === 'idle' && canPay && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['MPESA', 'FLUTTERWAVE'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                        provider === p
                          ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20'
                          : 'border-input hover:bg-muted/50'
                      }`}
                    >
                      {p === 'MPESA' ? (
                        <>
                          <Smartphone className="h-4 w-4" />
                          M-Pesa
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Debit/Credit Card
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number Input for M-Pesa */}
              {provider === 'MPESA' && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    M-Pesa Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    className="text-base"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive an STK Push notification to approve the payment
                  </p>
                </div>
              )}

              {/* Card Payment Info */}
              {provider === 'FLUTTERWAVE' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    You will be redirected to a secure Flutterwave checkout page to complete your payment using your debit or credit card.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={
                    isProcessing || 
                    (provider === 'MPESA' && (!phoneNumber || !validatePhoneNumber(phoneNumber)))
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {formatCurrency(invoice.balanceAmount)}</>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Non-payable State */}
          {!canPay && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                {invoice.status === 'PAID' 
                  ? 'This invoice has been fully paid' 
                  : 'Payment is not available for this invoice'}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          {/* Success/Processing State Actions */}
          {(paymentStatus === 'initiated' || paymentStatus === 'success') && (
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {paymentStatus === 'initiated' && (
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => {
                    // Check payment status or refresh
                    window.location.reload();
                  }}
                >
                  Check Status
                </Button>
              )}
            </div>
          )}

          {/* Failed State Actions */}
          {paymentStatus === 'failed' && (
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => {
                  setPaymentStatus('idle');
                  setStatusMessage('');
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}