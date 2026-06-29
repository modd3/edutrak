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
    <div className="group hover:bg-accent/15 hover:border-accent rounded-xl border p-6 flex flex-col transition-all duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">{plan.name}</h3>
        {!plan.isActive && (
          <span className="text-xs rounded-full bg-gray-100 text-gray-500 px-2 py-0.5">Inactive</span>
        )}
      </div>

      {plan.description && (
        <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors duration-300 mt-2">{plan.description}</p>
      )}

      <p className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors duaration-300 mt-4">
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