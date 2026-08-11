import { useFormContext } from 'react-hook-form';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeatureRow } from '@/components/subscriptions/FeatureRow';
import { Skeleton } from '@/components/ui/skeleton';
import type { Plan, FeatureRegistry } from '@/types';
import type { OnboardingFormData } from './types';

interface StepPlanProps {
  plans: Plan[];
  registry: FeatureRegistry;
  isLoading: boolean;
  isError: boolean;
}

function formatPrice(minor: number, currency: string) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(
    minor / 100
  );
}
function billingLabel(interval: string) {
  return (
    { MONTHLY: '/month', QUARTERLY: '/quarter', YEARLY: '/year' }[interval] ?? ''
  );
}

export function StepPlan({ plans, registry, isLoading, isError }: StepPlanProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingFormData>();

  const selectedPlanId = watch('plan.planId');
  const startTrial = watch('plan.startTrial');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        Failed to load plans. Please refresh and try again.
      </p>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No plans are currently available. Please contact support.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a subscription plan. You can upgrade or change plans at any time.
      </p>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const selected = plan.id === selectedPlanId;
          const sorted = [...(plan.features ?? [])].sort((a, b) =>
            a.featureKey.localeCompare(b.featureKey)
          );

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() =>
                setValue('plan.planId', plan.id, { shouldValidate: true })
              }
              className={cn(
                'w-full text-left rounded-xl border p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                  <p className="font-bold text-lg mt-1 leading-none">
                    {formatPrice(plan.priceMinor, plan.currency)}
                    <span className="text-sm font-normal text-muted-foreground ml-0.5">
                      {billingLabel(plan.billingInterval)}
                    </span>
                  </p>
                </div>
                {/* Radio indicator */}
                <div
                  className={cn(
                    'mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {selected && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
              </div>

              {/* Feature list — only expand when selected */}
              {selected && sorted.length > 0 && (
                <ul className="mt-3 border-t pt-3 divide-y">
                  {sorted.map((f) => (
                    <FeatureRow key={f.id} feature={f} registry={registry} />
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {errors.plan?.planId && (
        <p className="text-xs text-red-500">{errors.plan.planId.message}</p>
      )}

      {/* Free-trial toggle */}
      <button
        type="button"
        role="checkbox"
        aria-checked={startTrial}
        onClick={() => setValue('plan.startTrial', !startTrial)}
        className={cn(
          'w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          startTrial
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40'
        )}
      >
        <div
          className={cn(
            'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0',
            startTrial ? 'border-primary bg-primary' : 'border-muted-foreground/40'
          )}
        >
          {startTrial && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <div>
          <p className="font-medium text-sm">Start with a 14-day free trial</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            No payment required upfront. An invoice is issued when your trial ends.
          </p>
        </div>
      </button>
    </div>
  );
}
