import { useState } from 'react';
import { useInitiateOnlinePayment, useGetPaymentStatus } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, CreditCard } from 'lucide-react';

interface OnlinePaymentModalProps {
  invoiceId: string;
  invoiceNo: string;
  balance: number;
  onClose: () => void;
}

export function OnlinePaymentModal({ invoiceId, invoiceNo, balance, onClose }: OnlinePaymentModalProps) {
  const [provider, setProvider] = useState<'MPESA' | 'FLUTTERWAVE'>('MPESA');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const initiateMutation = useInitiateOnlinePayment();
  const { data: paymentStatus } = useGetPaymentStatus(invoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiateMutation.mutate({
      invoiceId,
      provider,
      callbackUrl: window.location.origin + '/fees/payment-status',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Pay Online</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Invoice: {invoiceNo}</p>
          <p className="text-2xl font-bold text-primary">KES {balance.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('MPESA')}
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                  provider === 'MPESA' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span>M-Pesa</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('FLUTTERWAVE')}
                className={`p-3 border rounded-lg flex items-center justify-center gap-2 ${
                  provider === 'FLUTTERWAVE' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {provider === 'MPESA' && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="254712345678"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You will receive an STK Push prompt on your phone
              </p>
            </div>
          )}

          {provider === 'FLUTTERWAVE' && (
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You will be redirected to complete payment
              </p>
            </div>
          )}

          {paymentStatus?.data?.status === 'AWAITING_CONFIRMATION' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                Waiting for payment confirmation... Please check your phone and enter your PIN.
              </p>
            </div>
          )}

          {paymentStatus?.data?.status === 'SUCCESS' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                Payment successful! Receipt: {paymentStatus.data.receiptCode}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={initiateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={initiateMutation.isPending || paymentStatus?.data?.status === 'SUCCESS'}
            >
              {initiateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay KES ${balance.toLocaleString()}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
