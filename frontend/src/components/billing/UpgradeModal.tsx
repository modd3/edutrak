import { useState, useEffect, useCallback } from 'react';
import type { Plan } from '@/types';
import { useChangePlan } from '@/hooks/use-subscriptions';
import { formatPlanPrice, intervalLabel, getPlanFeatureLimit } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ArrowUpRight, X } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  plans?: Plan[];
  currentPlanName?: string;
  currentPrice?: number;
  currency?: string;
  subscriptionId?: string;
}

type Step = 'pick' | 'confirm' | 'success';

function PlanTile({
  plan,
  selected,
  isCurrent,
  onClick,
  currency,
}: {
  plan: Plan;
  selected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  currency: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-colors ${
        selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-[#1e1b4b]">{plan.name}</p>
        {isCurrent && <Badge variant="outline" className="text-[11px]">Current</Badge>}
      </div>
      <p className="text-xs text-muted-foreground">
        {formatPlanPrice(plan.priceMinor, currency)}/{intervalLabel(plan.billingInterval)}
      </p>
    </button>
  );
}

export function UpgradeModal({
  open,
  onClose,
  plans = [],
  currentPlanName,
  currentPrice = 0,
  currency = 'KES',
  subscriptionId,
}: UpgradeModalProps) {
  const [selected, setSelected] = useState('');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [step, setStep] = useState<Step>('pick');
  const [confirmed, setConfirmed] = useState(false);

  const { mutateAsync: changePlan, isPending } = useChangePlan();

  const validPlans = plans.filter((p) => typeof p.priceMinor === 'number' && p.priceMinor >= 0);
  const activePlan = validPlans.find((p) => p.id === selected) || validPlans[0] || null;
  const price = billing === 'annual' && activePlan ? Math.round(activePlan.priceMinor * 0.8) : activePlan?.priceMinor ?? 0;
  const savings = billing === 'annual' && activePlan ? Math.round(activePlan.priceMinor * 12 - price * 12) : 0;
  const isCurrent = activePlan ? currentPrice === activePlan.priceMinor : false;

  useEffect(() => {
    if (validPlans.length > 0 && !selected) {
      setSelected(validPlans[0].id);
    }
  }, [validPlans, selected]);

  useEffect(() => {
    if (open) {
      setStep('pick');
      setConfirmed(false);
    }
  }, [open]);

  const handleConfirm = useCallback(async () => {
    if (!activePlan || !subscriptionId) return;
    try {
      await changePlan({
        subscriptionId,
        data: { planId: activePlan.id, withTrial: false },
      });
      setConfirmed(true);
      setTimeout(() => {
        setConfirmed(false);
        setStep('pick');
        onClose();
      }, 2200);
    } catch (error) {
      // Error toast handled by the hook
    }
  }, [activePlan, subscriptionId, changePlan, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>
                {confirmed
                  ? 'Upgrade Successful!'
                  : step === 'pick'
                    ? 'Upgrade Your Plan'
                    : 'Confirm Upgrade'}
              </DialogTitle>
              <DialogDescription>
                {confirmed
                  ? `You're now on the ${activePlan?.name ?? 'new plan'}. Enjoy your expanded capacity.`
                  : step === 'pick'
                    ? "Choose the plan that fits your school's growth."
                    : 'Review your selection before confirming.'}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {confirmed ? (
          <div className="py-12 text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-3xl text-emerald-600 border border-emerald-200">
              ✓
            </div>
            <p className="text-sm text-muted-foreground">Your subscription has been updated.</p>
          </div>
        ) : step === 'pick' ? (
          <div className="px-8 py-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {validPlans.map((plan) => (
                <PlanTile
                  key={plan.id}
                  plan={plan}
                  selected={plan.id === selected}
                  isCurrent={currentPrice === plan.priceMinor}
                  onClick={() => setSelected(plan.id)}
                  currency={currency}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Billing cadence</p>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={billing === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setBilling('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={billing === 'annual' ? 'default' : 'outline'}
                    onClick={() => setBilling('annual')}
                  >
                    Annual
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[36px] font-extrabold text-[#1e1b4b] tracking-tight">
                  {formatPlanPrice(price, currency)}
                </div>
                <div className="text-[13px] text-muted-foreground">per month</div>
              </div>
            </div>

            {billing === 'annual' && savings > 0 && (
              <div className="bg-emerald-100 rounded-lg px-3.5 py-2.5 text-[13px] text-emerald-800 font-semibold">
                Annual discount applied — you save {formatPlanPrice(savings, currency)} per year
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Students', value: String(getPlanFeatureLimit(activePlan || undefined, 'students.max', 0)) },
                { label: 'Teachers', value: String(getPlanFeatureLimit(activePlan || undefined, 'teachers.max', 0)) },
                { label: 'Storage', value: getPlanFeatureLimit(activePlan || undefined, 'lms.storage_limit', 0) + ' GB' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3.5 border border-slate-100">
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-sm font-bold text-[#1e1b4b]">{item.value}</div>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              disabled={isCurrent || !subscriptionId}
              onClick={() => setStep('confirm')}
            >
              {isCurrent ? 'This is your current plan' : !subscriptionId ? 'Loading subscription…' : 'Continue'}
            </Button>
          </div>
        ) : (
          <div className="px-8 py-6 space-y-5">
            {activePlan && (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">You are switching to</p>
                  <p className="text-xl font-bold text-[#1e1b4b]">{activePlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPlanPrice(price, currency)}/{intervalLabel(activePlan.billingInterval)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Included</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Students', value: String(getPlanFeatureLimit(activePlan, 'students.max', 0)) },
                      { label: 'Teachers', value: String(getPlanFeatureLimit(activePlan, 'teachers.max', 0)) },
                      { label: 'Storage', value: getPlanFeatureLimit(activePlan, 'lms.storage_limit', 0) + ' GB' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-slate-700">{item.label}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {billing === 'annual' && savings > 0 && (
                  <div className="bg-emerald-100 rounded-lg px-3.5 py-2.5 text-[13px] text-emerald-800 font-semibold">
                    You save {formatPlanPrice(savings, currency)} per year with annual billing.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('pick')} disabled={isPending}>
                    Back
                  </Button>
                  <Button onClick={handleConfirm} disabled={isPending || !subscriptionId} className="flex-1">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Confirm Plan Change
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  M-Pesa billing is configured under your payment details.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
