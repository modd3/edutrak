/**
 * Late Fees Configuration
 * Configure penalty policy and manually trigger application.
 * Includes inline validation, save/apply feedback states, and result display.
 */

import { useEffect, useState } from 'react';
import { useGetLateFeesConfig, useUpsertLateFeesConfig, useApplyLateFees } from '@/hooks/use-fees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Save, Play, Info, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type PenaltyType = 'FLAT' | 'PERCENTAGE' | 'COMPOUND';

interface FormState {
  penaltyType: PenaltyType;
  penaltyAmount: number;
  graceDays: number;
  maxPenalty: string;
  applyRecurring: boolean;
  recurrenceDays: string;
  isActive: boolean;
}

interface FormErrors {
  penaltyAmount?: string;
  graceDays?: string;
  maxPenalty?: string;
  recurrenceDays?: string;
}

interface ApplyResult {
  applied: number;
  skipped?: number;
  totalPenalty?: number;
}

const DEFAULTS: FormState = {
  penaltyType: 'FLAT',
  penaltyAmount: 0,
  graceDays: 7,
  maxPenalty: '',
  applyRecurring: false,
  recurrenceDays: '',
  isActive: true,
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.penaltyAmount < 0) {
    errors.penaltyAmount = 'Penalty amount cannot be negative.';
  }
  if (form.penaltyType === 'PERCENTAGE' && form.penaltyAmount > 100) {
    errors.penaltyAmount = 'Percentage cannot exceed 100%.';
  }
  if (form.penaltyAmount === 0) {
    errors.penaltyAmount = 'Penalty amount must be greater than zero.';
  }
  if (form.graceDays < 0) {
    errors.graceDays = 'Grace period cannot be negative.';
  }
  if (form.maxPenalty && Number(form.maxPenalty) <= 0) {
    errors.maxPenalty = 'Cap must be a positive number.';
  }
  if (form.applyRecurring) {
    if (!form.recurrenceDays || Number(form.recurrenceDays) < 1) {
      errors.recurrenceDays = 'Recurrence interval must be at least 1 day.';
    }
  }
  return errors;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LateFeesConfig() {
  const { data, isLoading } = useGetLateFeesConfig();
  const save = useUpsertLateFeesConfig();
  const apply = useApplyLateFees();

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

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

  // Re-validate on change when user has tried to save once
  useEffect(() => {
    if (touched) setErrors(validate(form));
  }, [form, touched]);

  const field = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

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

  const handleApply = () => {
    setApplyResult(null);
    apply.mutate(undefined, {
      onSuccess: (response: any) => {
        const result = response?.data?.data ?? response?.data ?? {};
        setApplyResult({
          applied: result.applied ?? 0,
          skipped: result.skipped,
          totalPenalty: result.totalPenalty,
        });
      },
    });
  };

  const penaltyUnit = form.penaltyType === 'PERCENTAGE' ? '%' : 'KES';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Policy Card ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Late Fee Policy</CardTitle>
              <CardDescription>
                Configure how penalties are applied to overdue invoices.
              </CardDescription>
            </div>
            <Badge variant={form.isActive ? 'default' : 'secondary'}>
              {form.isActive ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium text-sm">Enable Late Fees</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically apply penalties to overdue invoices
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => field('isActive', v)}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Penalty Type */}
            <div className="space-y-1.5">
              <Label>Penalty Type</Label>
              <Select
                value={form.penaltyType}
                onValueChange={(v) => field('penaltyType', v as PenaltyType)}
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
              <p className="text-xs text-muted-foreground">
                {form.penaltyType === 'FLAT' && 'A fixed amount added once per overdue period.'}
                {form.penaltyType === 'PERCENTAGE' && 'A % of the outstanding balance.'}
                {form.penaltyType === 'COMPOUND' && 'Applied daily on the growing balance.'}
              </p>
            </div>

            {/* Penalty Amount */}
            <div className="space-y-1.5">
              <Label>
                Penalty Amount{' '}
                <span className="text-muted-foreground text-xs">({penaltyUnit})</span>
              </Label>
              <Input
                type="number"
                min={0}
                step={form.penaltyType === 'PERCENTAGE' ? 0.1 : 1}
                value={form.penaltyAmount}
                onChange={(e) => field('penaltyAmount', Number(e.target.value))}
                className={errors.penaltyAmount ? 'border-destructive' : ''}
              />
              {errors.penaltyAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {errors.penaltyAmount}
                </p>
              )}
            </div>

            {/* Grace Period */}
            <div className="space-y-1.5">
              <Label>
                Grace Period{' '}
                <span className="text-muted-foreground text-xs">(days after due date)</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={form.graceDays}
                onChange={(e) => field('graceDays', Number(e.target.value))}
                className={errors.graceDays ? 'border-destructive' : ''}
              />
              {errors.graceDays && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {errors.graceDays}
                </p>
              )}
            </div>

            {/* Max Penalty */}
            <div className="space-y-1.5">
              <Label>
                Maximum Penalty{' '}
                <span className="text-muted-foreground text-xs">(KES cap, optional)</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={form.maxPenalty}
                placeholder="No cap"
                onChange={(e) => field('maxPenalty', e.target.value)}
                className={errors.maxPenalty ? 'border-destructive' : ''}
              />
              {errors.maxPenalty && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> {errors.maxPenalty}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Recurring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Recurring Penalty</p>
                <p className="text-xs text-muted-foreground">
                  Re-apply penalty every N days while still overdue
                </p>
              </div>
              <Switch
                checked={form.applyRecurring}
                onCheckedChange={(v) => field('applyRecurring', v)}
              />
            </div>
            {form.applyRecurring && (
              <div className="space-y-1.5 max-w-[200px]">
                <Label>
                  Interval{' '}
                  <span className="text-muted-foreground text-xs">(days)</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.recurrenceDays}
                  onChange={(e) => field('recurrenceDays', e.target.value)}
                  className={errors.recurrenceDays ? 'border-destructive' : ''}
                />
                {errors.recurrenceDays && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {errors.recurrenceDays}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save feedback */}
          {save.isSuccess && (
            <Alert className="border-green-300 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-300">Saved</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Late fee policy updated successfully.
              </AlertDescription>
            </Alert>
          )}
          {save.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Save Failed</AlertTitle>
              <AlertDescription>
                {(save.error as any)?.response?.data?.message ?? 'Unable to save the policy. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <><Save className="mr-2 h-4 w-4" />Save Policy</>
              }
            </Button>
            {touched && Object.keys(errors).length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Fix the errors above before saving.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Apply Late Fees Card ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Apply Late Fees Now</CardTitle>
          <CardDescription>
            Manually trigger penalty application for all currently overdue invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This applies the configured penalty to every overdue invoice that hasn't been
              penalised yet in the current period. The operation is idempotent — running it
              twice won't double-charge.
            </AlertDescription>
          </Alert>

          {!form.isActive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Late fees are currently <strong>disabled</strong>. Enable the policy above before applying.
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="secondary"
            onClick={handleApply}
            disabled={apply.isPending || !form.isActive}
          >
            {apply.isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying…</>
              : <><Play className="mr-2 h-4 w-4" />Apply Late Fees</>
            }
          </Button>

          {/* Apply result */}
          {applyResult && !apply.isPending && (
            <Alert className="border-green-300 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-300">
                Late fees applied
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400 space-y-1">
                <p>
                  <strong>{applyResult.applied}</strong> invoice
                  {applyResult.applied !== 1 ? 's' : ''} penalised.
                </p>
                {applyResult.skipped != null && applyResult.skipped > 0 && (
                  <p>{applyResult.skipped} invoice(s) skipped (already penalised or within grace period).</p>
                )}
                {applyResult.totalPenalty != null && (
                  <p>
                    Total penalty applied:{' '}
                    <strong>KES {Number(applyResult.totalPenalty).toLocaleString()}</strong>
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {apply.isError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Application Failed</AlertTitle>
              <AlertDescription>
                {(apply.error as any)?.response?.data?.message ?? 'Failed to apply late fees. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
