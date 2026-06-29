import { Check, X } from 'lucide-react';
import type { PlanFeature, FeatureRegistry } from '@/types';

export function FeatureRow({ feature, registry }: { feature: PlanFeature; registry: FeatureRegistry }) {
  const label = registry[feature.featureKey]?.name ?? feature.featureKey;

  if (feature.limitType === 'COUNT') {
    return (
      <li className="flex items-center justify-between text-sm py-1.5">
        <span className={feature.enabled ? '' : 'text-muted-foreground line-through'}>{label}</span>
        <span className="font-medium text-muted-foreground">
          {feature.enabled
            ? feature.limitValue != null
              ? `Up to ${feature.limitValue.toLocaleString()}`
              : 'Unlimited'
            : '—'}
        </span>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm py-1.5">
      {feature.enabled ? (
        <Check className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className={feature.enabled ? '' : 'text-muted-foreground line-through'}>{label}</span>
    </li>
  );
}