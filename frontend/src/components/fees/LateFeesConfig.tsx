import { useGetLateFeesConfig, useUpsertLateFeesConfig, useApplyLateFees } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Play } from 'lucide-react';
import { useState } from 'react';

export function LateFeesConfig() {
  const { data: config, isLoading } = useGetLateFeesConfig();
  const upsertMutation = useUpsertLateFeesConfig();
  const applyMutation = useApplyLateFees();

  const [formData, setFormData] = useState({
    penaltyType: 'FLAT' as 'FLAT' | 'PERCENTAGE' | 'COMPOUND',
    penaltyAmount: 0,
    graceDays: 7,
    maxPenalty: undefined as number | undefined,
    applyRecurring: false,
    recurrenceDays: undefined as number | undefined,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Late Fees Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Penalty Type</label>
                <select
                  value={formData.penaltyType}
                  onChange={(e) => setFormData({ ...formData, penaltyType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="FLAT">Flat Amount (KES)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="COMPOUND">Compound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Penalty Amount</label>
                <input
                  type="number"
                  value={formData.penaltyAmount}
                  onChange={(e) => setFormData({ ...formData, penaltyAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grace Period (days)</label>
                <input
                  type="number"
                  value={formData.graceDays}
                  onChange={(e) => setFormData({ ...formData, graceDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Penalty (optional)</label>
                <input
                  type="number"
                  value={formData.maxPenalty || ''}
                  onChange={(e) => setFormData({ ...formData, maxPenalty: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="applyRecurring"
                  checked={formData.applyRecurring}
                  onChange={(e) => setFormData({ ...formData, applyRecurring: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="applyRecurring" className="text-sm font-medium">Apply Recurring</label>
              </div>

              {formData.applyRecurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">Recurrence (days)</label>
                  <input
                    type="number"
                    value={formData.recurrenceDays || ''}
                    onChange={(e) => setFormData({ ...formData, recurrenceDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Play className="mr-2 h-4 w-4" />
                Apply Late Fees Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
