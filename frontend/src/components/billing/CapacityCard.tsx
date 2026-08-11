import { cn } from '@/lib/utils';

interface CapacityCardProps {
  title: string;
  used: number;
  total: number;
  color?: string;
  trackColor?: string;
  icon?: string;
  unit?: string;
}

export function CapacityCard({ title, used, total, color = '#10b981', trackColor = '#d1fae5', icon, unit }: CapacityCardProps) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeUsed = Number.isFinite(used) && safeTotal > 0 ? Math.min(used, safeTotal) : 0;
  const pct = safeTotal === 0 ? 0 : Math.floor((safeUsed / safeTotal) * 100);
  const remaining = safeTotal - safeUsed;
  const isCritical = safeTotal > 0 && remaining <= 0;
  const isWarning = !isCritical && safeTotal > 0 && pct >= 85;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 border relative overflow-hidden',
        isCritical ? 'border-red-200 shadow-[0_4px_20px_rgba(239,68,68,0.08)]' : isWarning ? 'border-amber-200 shadow-[0_2px_8px_rgba(245,158,11,0.08)]' : 'border-[#e8edf5] shadow-[0_2px_8px_rgba(99,102,241,0.05)]'
      )}
    >
      {isCritical && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-red-400" />
      )}
      {isWarning && !isCritical && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-300" />
      )}

      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-lg">{icon}</span>}
            <h3 className="m-0 text-base font-semibold text-[#1e1b4b]">{title}</h3>
          </div>
          <p className="m-0 text-[13px] text-muted-foreground">
            {safeTotal === 0 ? 'No limit set' : isCritical ? 'Limit reached — upgrade required' : `${remaining} ${unit || ''} remaining`}
          </p>
        </div>
        <div
          className={cn(
            'text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wider',
            isCritical ? 'bg-red-100 text-red-500' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          )}
        >
          {safeTotal === 0 ? '—' : isCritical ? 'FULL' : `${pct}%`}
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2.5 rounded-full" style={{ backgroundColor: trackColor }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: isCritical
                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                : isWarning
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #10b981, #34d399)',
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className={cn('text-sm font-bold', isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-[#1e1b4b]')}>
          {safeUsed} / {safeTotal}{' '}
          <span className="font-normal text-muted-foreground">{title.replace(' Capacity', '').replace(' Usage', '')}</span>
        </span>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(safeTotal, 10) }).map((_, i) => (
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