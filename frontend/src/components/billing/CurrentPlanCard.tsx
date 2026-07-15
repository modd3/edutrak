import type { Subscription } from '@/types';

interface CurrentPlanCardProps {
  subscription?: Subscription | null;
  isLoading?: boolean;
}

function getFeatureLimit(features: { featureKey: string; limitValue?: number | null }[] | undefined, key: string, fallback: string): string {
  if (!features) return fallback;
  const feature = features.find(f => f.featureKey === key);
  if (!feature || feature.limitValue == null) return fallback;
  if (key === 'storage_gb') return `${feature.limitValue} GB`;
  return String(feature.limitValue);
}

export function CurrentPlanCard({ subscription, isLoading }: CurrentPlanCardProps) {
  if (isLoading || !subscription) {
    return (
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] rounded-[20px] p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(99,102,241,0.25)] animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-4" />
        <div className="h-10 w-48 bg-white/10 rounded mb-2" />
        <div className="h-4 w-56 bg-white/10 rounded mb-6" />
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-24 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const plan = subscription.plan;
  const planName = plan?.name || 'N/A';
  const priceMinor = plan?.priceMinor || 0;
  const currency = plan?.currency || 'KES';
  const features = plan?.features;
  const renewalDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';
  const status = subscription.status;

  return (
    <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#3730a3] rounded-[20px] p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(99,102,241,0.25)]">
      {/* Decorative orbs */}
      <div className="absolute -right-14 -top-14 w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute right-[120px] -bottom-20 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative flex justify-between items-start">
        <div>
          {/* Status badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {status}
            </span>
            <span className="text-white/40 text-xs">Current Subscription</span>
          </div>

          <h2 className="text-[34px] font-extrabold text-white m-0 mb-1 tracking-tight">
            {planName}
          </h2>
          <p className="text-sm text-white/50 m-0 mb-6">
            Next renewal date:{' '}
            <span className="text-white/75 font-semibold">{renewalDate}</span>
          </p>

          {/* Stats from PlanFeature entries */}
          <div className="flex gap-6">
            <Stat label="Students" value={getFeatureLimit(features, 'students.max', '—')} />
            <Stat label="Teachers" value={getFeatureLimit(features, 'teachers.max', '—')} />
            <Stat label="Storage" value={getFeatureLimit(features, 'storage_gb', '—')} />
          </div>
        </div>

        {/* Price badge */}
        <div className="bg-white/10 border border-white/20 rounded-2xl px-7 py-5 text-center backdrop-blur-sm">
          <div className="text-[13px] text-white/50 font-medium mb-1">Monthly price</div>
          <div className="flex items-start justify-center gap-0.5">
            <span className="text-lg font-bold text-white/60 mt-1.5">
              {currency === 'KES' ? 'KSh' : '$'}
            </span>
            <span className="text-5xl font-extrabold text-white tracking-tighter leading-none">
              {priceMinor / 100}
            </span>
          </div>
          <div className="text-xs text-white/40 mt-1">per month</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-white/40 font-semibold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-lg font-bold text-indigo-100">{value}</span>
    </div>
  );
}