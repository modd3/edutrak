export default function CurrentPlanCard() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)',
      borderRadius: 20,
      padding: '32px 36px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(99,102,241,0.25)',
    }}>
      {/* Decorative orb */}
      <div style={{
        position: 'absolute', right: -60, top: -60,
        width: 280, height: 280,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 120, bottom: -80,
        width: 200, height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{
              background: 'rgba(16,185,129,0.2)',
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#34d399',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>● Active</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Current Subscription</span>
          </div>

          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.8px' }}>Starter Plan</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
            Next renewal date: <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>July 1, 2026</span>
          </p>

          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Students', value: '150' },
              { label: 'Teachers', value: '20' },
              { label: 'Storage', value: '50 GB' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#e0e7ff' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 16,
          padding: '20px 28px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 4 }}>Monthly price</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>$</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>200</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>per month</div>
        </div>
      </div>
    </div>
  )
}
