import { cn } from '@/lib/utils';

interface CapacityCardProps {
  title: string;
  used: number;
  total: number;
  pct: number;
  color: string;
  trackColor: string;
  icon: string;
  status: 'healthy' | 'critical';
}

export function CapacityCard({ title, used, total, pct, color, trackColor, icon, status }: CapacityCardProps) {
  const isCritical = status === 'critical';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border relative overflow-hidden',
        isCritical ? 'border-red-200 shadow-[0_4px_20px_rgba(239,68,68,0.08)]' : 'border-[#e8edf5] shadow-[0_2px_8px_rgba(99,102,241,0.05)]'
      )}
    >
      {/* Critical top bar */}
      {isCritical && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-red-400" />
      )}

      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{icon}</span>
            <h3 className="m-0 text-base font-semibold text-[#1e1b4b]">{title}</h3>
          </div>
          <p className="m-0 text-[13px] text-muted-foreground">
            {isCritical ? 'Limit reached — upgrade required' : `${total - used} spots remaining`}
          </p>
        </div>
        <div
          className={cn(
            'text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider',
            isCritical ? 'bg-red-100 text-red-500' : 'bg-emerald-50 text-emerald-600'
          )}
        >
          {isCritical ? '🔴 FULL' : `${pct}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2.5 rounded-full" style={{ backgroundColor: trackColor }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: isCritical
                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                : 'linear-gradient(90deg, #10b981, #34d399)',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex justify-between items-center">
        <span className={cn('text-sm font-bold', isCritical ? 'text-red-600' : 'text-[#1e1b4b]')}>
          {used} / {total}{' '}
          <span className="font-normal text-muted-foreground">
            {title.includes('Student') ? 'Students' : 'Teachers'} Used
          </span>
        </span>
        {/* Dot indicators */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-sm"
              style={{ backgroundColor: i < Math.round(pct / 10) ? color : trackColor }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}