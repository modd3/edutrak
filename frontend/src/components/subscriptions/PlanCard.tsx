import type { Plan, FeatureRegistry } from '@/types';
import { FeatureRow } from './FeatureRow';

function formatPrice(minor: number, currency: string) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(minor / 100);
}

function intervalLabel(interval: string) {
  return { MONTHLY: '/mo', QUARTERLY: '/quarter', YEARLY: '/yr' }[interval] ?? '';
}

export function PlanCard({ plan, registry }: { plan: Plan; registry: FeatureRegistry }) {
  const sorted = [...(plan.features || [])].sort((a, b) => a.featureKey.localeCompare(b.featureKey));

  return (
    <div className="rounded-xl border p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        {!plan.isActive && (
          <span className="text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">Inactive</span>
        )}
      </div>

      {plan.description && (
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      )}

      <p className="text-2xl font-bold mt-4">
        {formatPrice(plan.priceMinor, plan.currency)}
        <span className="text-sm font-normal text-muted-foreground">{intervalLabel(plan.billingInterval)}</span>
      </p>

      <ul className="mt-4 divide-y flex-1">
        {sorted.length > 0 ? (
          sorted.map(f => <FeatureRow key={f.id} feature={f} registry={registry} />)
        ) : (
          <li className="text-sm text-muted-foreground py-1">No features configured</li>
        )}
      </ul>
    </div>
  );
}