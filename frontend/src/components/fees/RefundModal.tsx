import { useProcessRefund, useValidateRefund } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RefundModalProps {
  paymentId: string;
  onClose: () => void;
}

export function RefundModal({ paymentId, onClose }: RefundModalProps) {
  const { data: validation } = useValidateRefund(paymentId);
  const refundMutation = useProcessRefund();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (validation?.data) {
      setAmount(validation.data.maxRefundAmount.toString());
    }
  }, [validation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refundMutation.mutate(
      { paymentId, amount: parseFloat(amount), reason, notes },
      { onSuccess: onClose }
    );
  };

  if (!validation?.data) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { canRefund, maxRefundAmount, reason: validationReason } = validation.data;

  if (!canRefund) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cannot Refund</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{validationReason || 'This payment cannot be refunded'}</p>
          </div>
          <Button className="mt-4" variant="outline" onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Refund</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm">Maximum refundable: <strong>KES {maxRefundAmount.toLocaleString()}</strong></p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Refund Amount (KES)</label>
            <input
              type="number"
              step="0.01"
              max={maxRefundAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select reason...</option>
              <option value="DUPLICATE_PAYMENT">Duplicate Payment</option>
              <option value="OVERPAYMENT">Overpayment</option>
              <option value="STUDENT_LEFT">Student Left School</option>
              <option value="ERROR">Billing Error</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={refundMutation.isPending} variant="destructive">
              {refundMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process Refund
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
