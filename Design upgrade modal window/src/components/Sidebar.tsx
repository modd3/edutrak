type NavItem = { label: string; icon: string; active?: boolean }

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '⊞' },
  { label: 'Students', icon: '🎓' },
  { label: 'Staff', icon: '👥' },
  { label: 'Billing', icon: '💳', active: true },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      backgroundColor: '#1e1b4b',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>🏫</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>EduAdmin</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, marginTop: 1 }}>School Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px', marginBottom: 4 }}>Main Menu</div>
        {navItems.map((item) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 2,
            cursor: 'pointer',
            backgroundColor: item.active ? 'rgba(99,102,241,0.2)' : 'transparent',
            borderLeft: item.active ? '3px solid #6366f1' : '3px solid transparent',
            transition: 'all 0.15s ease',
          }}>
            <span style={{ fontSize: 16, opacity: item.active ? 1 : 0.5 }}>{item.icon}</span>
            <span style={{
              fontSize: 14,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
              letterSpacing: '-0.1px',
            }}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>SA</div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Sarah Adams</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
