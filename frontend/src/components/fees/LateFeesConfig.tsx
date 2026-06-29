import { useEffect, useState } from 'react';
import { useGetLateFeesConfig, useUpsertLateFeesConfig, useApplyLateFees } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Play, Info } from 'lucide-react';

const DEFAULTS = {
  penaltyType: 'FLAT' as 'FLAT' | 'PERCENTAGE' | 'COMPOUND',
  penaltyAmount: 0,
  graceDays: 7,
  maxPenalty: '',
  applyRecurring: false,
  recurrenceDays: '',
  isActive: true,
};

export function LateFeesConfig() {
  const { data, isLoading } = useGetLateFeesConfig();
  const save = useUpsertLateFeesConfig();
  const apply = useApplyLateFees();
  const [form, setForm] = useState(DEFAULTS);

  // Populate form when config loads
  useEffect(() => {
    const c = data?.data?.data ?? data?.data;
    if (!c) return;
    setForm({
      penaltyType: c.penaltyType ?? 'FLAT',
      penaltyAmount: c.penaltyAmount ?? 0,
      graceDays: c.graceDays ?? 7,
      maxPenalty: c.maxPenalty != null ? String(c.maxPenalty) : '',
      applyRecurring: c.applyRecurring ?? false,
      recurrenceDays: c.recurrenceDays != null ? String(c.recurrenceDays) : '',
      isActive: c.isActive ?? true,
    });
  }, [data]);

  const handleSave = () => {
    save.mutate({
      penaltyType: form.penaltyType,
      penaltyAmount: Number(form.penaltyAmount),
      graceDays: Number(form.graceDays),
      maxPenalty: form.maxPenalty ? Number(form.maxPenalty) : undefined,
      applyRecurring: form.applyRecurring,
      recurrenceDays: form.recurrenceDays ? Number(form.recurrenceDays) : undefined,
      isActive: form.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const penaltyUnit = form.penaltyType === 'PERCENTAGE' ? '%' : 'KES';

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Late Fee Policy</CardTitle>
          <CardDescription>
            Configure how penalties are applied to overdue invoices. Changes take effect on the next application run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Enable Late Fees</p>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically apply penalties to overdue invoices</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Penalty Type</Label>
              <Select
                value={form.penaltyType}
                onValueChange={v => setForm(f => ({ ...f, penaltyType: v as typeof DEFAULTS['penaltyType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">Flat Amount (KES)</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage of Balance</SelectItem>
                  <SelectItem value="COMPOUND">Compound (daily)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Penalty Amount ({penaltyUnit})</Label>
              <Input
                type="number"
                min={0}
                step={form.penaltyType === 'PERCENTAGE' ? 0.1 : 1}
                value={form.penaltyAmount}
                onChange={e => setForm(f => ({ ...f, penaltyAmount: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Grace Period <span className="text-muted-foreground text-xs">(days after due date)</span></Label>
              <Input
                type="number"
                min={0}
                value={form.graceDays}
                onChange={e => setForm(f => ({ ...f, graceDays: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Maximum Penalty <span className="text-muted-foreground text-xs">(KES, optional cap)</span></Label>
              <Input
                type="number"
                min={0}
                value={form.maxPenalty}
                placeholder="No cap"
                onChange={e => setForm(f => ({ ...f, maxPenalty: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          {/* Recurring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Recurring Penalty</p>
                <p className="text-xs text-muted-foreground">Re-apply penalty every N days while overdue</p>
              </div>
              <Switch
                checked={form.applyRecurring}
                onCheckedChange={v => setForm(f => ({ ...f, applyRecurring: v }))}
              />
            </div>
            {form.applyRecurring && (
              <div className="space-y-1.5 max-w-[200px]">
                <Label>Recurrence Interval <span className="text-muted-foreground text-xs">(days)</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={form.recurrenceDays}
                  onChange={e => setForm(f => ({ ...f, recurrenceDays: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply Late Fees</CardTitle>
          <CardDescription>Manually trigger penalty application for all currently overdue invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will apply the configured penalty to every overdue invoice that hasn't been penalised yet in the current period.
            </AlertDescription>
          </Alert>
          <Button variant="secondary" onClick={() => apply.mutate()} disabled={apply.isPending || !form.isActive}>
            {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Play className="mr-2 h-4 w-4" />
            Apply Late Fees Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
