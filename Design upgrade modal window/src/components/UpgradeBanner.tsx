type Props = { onUpgrade: () => void }

export default function UpgradeBanner({ onUpgrade }: Props) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
      border: '1px solid #fcd34d',
      borderRadius: 14,
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      boxShadow: '0 2px 12px rgba(251,191,36,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>⚠️</div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>
            Teacher limit reached
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#a16207', lineHeight: 1.5 }}>
            To add a 21st teacher or more staff members, your school must upgrade to the next tier.
          </p>
        </div>
      </div>

      <button
        onClick={onUpgrade}
        style={{
          background: 'linear-gradient(135deg, #4338ca, #3730a3)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '12px 22px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.1px',
          boxShadow: '0 4px 16px rgba(67,56,202,0.35)',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'linear-gradient(135deg, #3730a3, #312e81)'
          el.style.transform = 'translateY(-1px)'
          el.style.boxShadow = '0 6px 20px rgba(67,56,202,0.45)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.background = 'linear-gradient(135deg, #4338ca, #3730a3)'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 4px 16px rgba(67,56,202,0.35)'
        }}
      >
        <span>⚡</span>
        Upgrade to Growth Plan
      </button>
    </div>
  )
}
