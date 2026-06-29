import { useState } from 'react';
import { useInitiateOnlinePayment } from '@/hooks/use-fees';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CreditCard, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNo: string;
  balance: number;
}

export function OnlinePaymentModal({ open, onOpenChange, invoiceId, invoiceNo, balance }: Props) {
  const [provider, setProvider] = useState<'MPESA' | 'FLUTTERWAVE'>('MPESA');
  const [phone, setPhone] = useState('');
  const initiate = useInitiateOnlinePayment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiate.mutate(
      { invoiceId, provider, callbackUrl: `${window.location.origin}/fees` },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const success = initiate.isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay Online</DialogTitle>
          <DialogDescription>
            Invoice <span className="font-mono font-medium">{invoiceNo}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-2">
          <p className="text-3xl font-bold">KES {balance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
        </div>

        {success ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {provider === 'MPESA'
                  ? 'STK Push sent. Enter your M-Pesa PIN to complete payment.'
                  : 'Redirecting to payment page…'}
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Provider selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['MPESA', 'FLUTTERWAVE'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    provider === p
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  {p === 'MPESA' ? <Smartphone className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {p === 'MPESA' ? 'M-Pesa' : 'Card'}
                </button>
              ))}
            </div>

            {provider === 'MPESA' && (
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  required
                />
                <p className="text-xs text-muted-foreground">You'll receive an STK Push to approve.</p>
              </div>
            )}

            {provider === 'FLUTTERWAVE' && (
              <p className="text-xs text-muted-foreground text-center py-2">
                You will be redirected to a secure Flutterwave checkout page.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={initiate.isPending || (provider === 'MPESA' && !phone)}>
                {initiate.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                  : `Pay KES ${balance.toLocaleString()}`}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
