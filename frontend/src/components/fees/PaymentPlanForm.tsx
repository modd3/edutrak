import { useCreatePaymentPlan, useGetPaymentPlan, useCancelPaymentPlan } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

interface PaymentPlanFormProps {
  invoiceId: string;
  onClose: () => void;
}

export function PaymentPlanForm({ invoiceId, onClose }: PaymentPlanFormProps) {
  const createMutation = useCreatePaymentPlan();
  const cancelMutation = useCancelPaymentPlan();
  const { data: existingPlan } = useGetPaymentPlan(invoiceId);

  const [formData, setFormData] = useState({
    installments: 3,
    frequency: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'CUSTOM',
    firstDueDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ invoiceId, ...formData });
  };

  if (existingPlan?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Installments:</strong> {existingPlan.data.installments}</p>
            <p><strong>Frequency:</strong> {existingPlan.data.frequency}</p>
            <p><strong>Total Amount:</strong> KES {Number(existingPlan.data.totalAmount).toLocaleString()}</p>
            <p><strong>Status:</strong> {existingPlan.data.isActive ? 'Active' : 'Cancelled'}</p>
          </div>
          {existingPlan.data.isActive && (
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => cancelMutation.mutate(invoiceId)}
              disabled={cancelMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Installments</label>
              <input
                type="number"
                min="2"
                max="12"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-Weekly</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">First Due Date</label>
              <input
                type="date"
                value={formData.firstDueDate}
                onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payment Plan
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
