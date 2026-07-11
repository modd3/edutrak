type Props = {
  title: string
  used: number
  total: number
  pct: number
  color: string
  trackColor: string
  icon: string
  status: 'healthy' | 'critical'
}

export default function CapacityCard({ title, used, total, pct, color, trackColor, icon, status }: Props) {
  const isCritical = status === 'critical'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '24px',
      border: `1px solid ${isCritical ? '#fecaca' : '#e8edf5'}`,
      boxShadow: isCritical ? '0 4px 20px rgba(239,68,68,0.08)' : '0 2px 8px rgba(99,102,241,0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isCritical && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #ef4444, #f87171)',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e1b4b' }}>{title}</h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {isCritical ? 'Limit reached — upgrade required' : `${total - used} spots remaining`}
          </p>
        </div>
        <div style={{
          background: isCritical ? '#fee2e2' : '#f0fdf4',
          color: isCritical ? '#ef4444' : '#059669',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 20,
          letterSpacing: '0.04em',
        }}>
          {isCritical ? '🔴 FULL' : `${pct}%`}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          height: 10,
          backgroundColor: trackColor,
          borderRadius: 100,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 100,
            transition: 'width 0.6s ease',
            background: isCritical
              ? 'linear-gradient(90deg, #ef4444, #f87171)'
              : 'linear-gradient(90deg, #10b981, #34d399)',
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: isCritical ? '#dc2626' : '#1e1b4b' }}>
          {used} / {total} <span style={{ fontWeight: 400, color: '#94a3b8' }}>
            {title.includes('Student') ? 'Students' : 'Teachers'} Used
          </span>
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 2,
              backgroundColor: i < Math.round(pct / 10) ? color : trackColor,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
