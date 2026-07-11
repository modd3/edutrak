import { useState, useEffect } from 'react'

type Props = { onClose: () => void }

const plans = [
  {
    id: 'growth',
    name: 'Growth Plan',
    price: 450,
    badge: 'Recommended',
    badgeColor: '#6366f1',
    students: 300,
    teachers: 40,
    storage: '150 GB',
    features: [
      'Up to 300 students',
      'Up to 40 teachers',
      '150 GB document storage',
      'Advanced analytics dashboard',
      'Priority email & chat support',
      'Custom report builder',
      'Parent portal access',
    ],
    highlight: true,
  },
  {
    id: 'scale',
    name: 'Scale Plan',
    price: 900,
    badge: 'Enterprise',
    badgeColor: '#7c3aed',
    students: 1000,
    teachers: 120,
    storage: '1 TB',
    features: [
      'Up to 1,000 students',
      'Up to 120 teachers',
      '1 TB document storage',
      'AI-powered insights & alerts',
      'Dedicated account manager',
      'SLA 99.99% uptime guarantee',
      'SSO / SAML integration',
      'Custom integrations via API',
    ],
    highlight: false,
  },
]

export default function UpgradeModal({ onClose }: Props) {
  const [selected, setSelected] = useState('growth')
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const activePlan = plans.find(p => p.id === selected)!
  const price = billing === 'annual' ? Math.round(activePlan.price * 0.8) : activePlan.price
  const savings = billing === 'annual' ? Math.round(activePlan.price * 12 - price * 12) : 0

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 14, 36, 0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 780,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(15,14,36,0.35)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
        position: 'relative',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '28px 32px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.5px' }}>
                {step === 'pick' ? 'Upgrade Your Plan' : 'Confirm Upgrade'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
              {step === 'pick'
                ? 'Choose the plan that fits your school\'s growth.'
                : 'Review your selection before confirming.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
          >×</button>
        </div>

        {step === 'pick' ? (
          <PickStep
            plans={plans}
            selected={selected}
            setSelected={setSelected}
            billing={billing}
            setBilling={setBilling}
            savings={savings}
            onNext={() => setStep('confirm')}
          />
        ) : (
          <ConfirmStep
            plan={activePlan}
            billing={billing}
            price={price}
            savings={savings}
            onBack={() => setStep('pick')}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  )
}

type PickProps = {
  plans: typeof plans
  selected: string
  setSelected: (id: string) => void
  billing: 'monthly' | 'annual'
  setBilling: (b: 'monthly' | 'annual') => void
  savings: number
  onNext: () => void
}

function PickStep({ plans, selected, setSelected, billing, setBilling, savings, onNext }: PickProps) {
  return (
    <div style={{ padding: '24px 32px 32px' }}>
      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{
          background: '#f1f5f9',
          borderRadius: 40,
          padding: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 20px',
                borderRadius: 36,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: billing === b ? '#fff' : 'transparent',
                color: billing === b ? '#1e1b4b' : '#94a3b8',
                boxShadow: billing === b ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && (
                <span style={{
                  marginLeft: 6,
                  background: '#d1fae5',
                  color: '#059669',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                }}>–20%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {billing === 'annual' && savings > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 13, color: '#059669', fontWeight: 600 }}>
          🎉 You save <strong>${savings.toLocaleString()}/year</strong> with annual billing
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {plans.map(plan => {
          const price = billing === 'annual' ? Math.round(plan.price * 0.8) : plan.price
          const isSelected = selected === plan.id
          return (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              style={{
                borderRadius: 16,
                border: `2px solid ${isSelected ? '#4338ca' : '#e2e8f0'}`,
                padding: '22px',
                cursor: 'pointer',
                position: 'relative',
                background: isSelected ? '#fafbff' : '#fff',
                transition: 'all 0.18s ease',
                boxShadow: isSelected ? '0 4px 20px rgba(67,56,202,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = '#c7d2fe' }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
            >
              {/* Selection indicator */}
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${isSelected ? '#4338ca' : '#cbd5e1'}`,
                background: isSelected ? '#4338ca' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
              </div>

              <div style={{
                display: 'inline-flex',
                background: plan.badgeColor + '18',
                color: plan.badgeColor,
                fontSize: 10, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: 12,
              }}>{plan.badge}</div>

              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1e1b4b' }}>{plan.name}</h3>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '12px 0' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-1px' }}>${price}</span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>/mo</span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { icon: '🎓', label: `${plan.students} students` },
                  { icon: '👩‍🏫', label: `${plan.teachers} teachers` },
                ].map(f => (
                  <div key={f.label} style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    {f.icon} {f.label}
                  </div>
                ))}
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {plan.features.slice(0, 5).map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#475569', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li style={{ fontSize: 12, color: '#94a3b8', padding: '4px 0', fontStyle: 'italic' }}>
                    +{plan.features.length - 5} more features
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {/* What you're leaving */}
      <div style={{
        background: '#f8fafc', borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
        border: '1px solid #f1f5f9',
      }}>
        <span style={{ fontSize: 20 }}>📋</span>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          You&apos;re currently on <strong style={{ color: '#1e1b4b' }}>Starter Plan</strong> at $200/mo.
          Upgrading will be prorated for the remainder of your billing cycle.
        </div>
      </div>

      <button
        onClick={onNext}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #4338ca, #3730a3)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '-0.1px',
          boxShadow: '0 4px 16px rgba(67,56,202,0.3)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = 'translateY(-1px)'
          el.style.boxShadow = '0 8px 24px rgba(67,56,202,0.4)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 4px 16px rgba(67,56,202,0.3)'
        }}
      >
        Continue with {plans.find(p => p.id === selected)?.name} →
      </button>
    </div>
  )
}

type ConfirmProps = {
  plan: typeof plans[0]
  billing: 'monthly' | 'annual'
  price: number
  savings: number
  onBack: () => void
  onClose: () => void
}

function ConfirmStep({ plan, billing, price, savings, onBack, onClose }: ConfirmProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(onClose, 2200)
  }

  if (confirmed) {
    return (
      <div style={{ padding: '64px 32px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
          boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
        }}>✓</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e1b4b', margin: '0 0 8px' }}>Upgrade Successful!</h3>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>You&apos;re now on the {plan.name}. Enjoy your expanded capacity.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px 32px' }}>
      {/* Summary card */}
      <div style={{
        background: 'linear-gradient(135deg, #fafbff, #eef2ff)',
        border: '1px solid #c7d2fe',
        borderRadius: 16,
        padding: '24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Upgrading to</div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e1b4b' }}>{plan.name}</h3>
            <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginTop: 4 }}>
              Billed {billing === 'annual' ? 'annually' : 'monthly'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-1.5px' }}>${price}</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>per month</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Students', from: '150', to: plan.students.toString(), icon: '🎓' },
            { label: 'Teachers', from: '20', to: plan.teachers.toString(), icon: '👩‍🏫' },
            { label: 'Storage', from: '50 GB', to: plan.storage, icon: '💾' },
          ].map(item => (
            <div key={item.label} style={{
              background: '#fff',
              borderRadius: 10, padding: '14px',
              border: '1px solid #e0e7ff',
            }}>
              <div style={{ fontSize: 16, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>{item.from}</span>
                <span style={{ fontSize: 10, color: '#6366f1' }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{item.to}</span>
              </div>
            </div>
          ))}
        </div>

        {billing === 'annual' && savings > 0 && (
          <div style={{
            marginTop: 16,
            background: '#d1fae5', borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: '#065f46', fontWeight: 600,
          }}>
            🎉 Annual discount applied — you save <strong>${savings.toLocaleString()}</strong> per year
          </div>
        )}
      </div>

      {/* Payment method */}
      <div style={{
        border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 30, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#fff', fontWeight: 800, letterSpacing: 1,
          }}>VISA</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e1b4b' }}>Visa ending in 4892</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Expires 09/2028</div>
          </div>
        </div>
        <button style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: '13px',
            border: '1px solid #e2e8f0',
            borderRadius: 12, background: '#fff',
            fontSize: 14, fontWeight: 600, color: '#64748b',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
        >← Back</button>
        <button
          onClick={handleConfirm}
          style={{
            flex: 2, padding: '13px',
            background: 'linear-gradient(135deg, #4338ca, #3730a3)',
            color: '#fff', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(67,56,202,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.transform = 'translateY(-1px)'
            el.style.boxShadow = '0 8px 24px rgba(67,56,202,0.4)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 4px 16px rgba(67,56,202,0.3)'
          }}
        >
          ⚡ Confirm Upgrade — ${price}/mo
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
        🔒 Secured by Stripe. Cancel or downgrade anytime from your billing settings.
      </p>
    </div>
  )
}
