import { useState } from 'react'
import CurrentPlanCard from './CurrentPlanCard'
import CapacityCard from './CapacityCard'
import UpgradeBanner from './UpgradeBanner'
import UpgradeModal from './UpgradeModal'

export default function BillingPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Settings</span>
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Billing</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e1b4b', letterSpacing: '-0.5px', margin: 0 }}>Billing &amp; Subscription</h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, fontWeight: 400 }}>Manage your plan, capacity, and payment details.</p>
      </div>

      {/* Current Plan */}
      <CurrentPlanCard />

      {/* Capacity Trackers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <CapacityCard
          title="Student Capacity"
          used={110}
          total={150}
          pct={73}
          color="#10b981"
          trackColor="#d1fae5"
          icon="🎓"
          status="healthy"
        />
        <CapacityCard
          title="Teacher Capacity"
          used={20}
          total={20}
          pct={100}
          color="#ef4444"
          trackColor="#fee2e2"
          icon="👩‍🏫"
          status="critical"
        />
      </div>

      {/* Upgrade Banner */}
      <div style={{ marginTop: 16 }}>
        <UpgradeBanner onUpgrade={() => setModalOpen(true)} />
      </div>

      {/* Invoice Section stub */}
      <div style={{ marginTop: 32 }}>
        <InvoiceTable />
      </div>

      {/* Modal */}
      {modalOpen && <UpgradeModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

function InvoiceTable() {
  const invoices = [
    { id: 'INV-2026-006', date: 'Jun 1, 2026', amount: '$200.00', status: 'Paid' },
    { id: 'INV-2026-005', date: 'May 1, 2026', amount: '$200.00', status: 'Paid' },
    { id: 'INV-2026-004', date: 'Apr 1, 2026', amount: '$200.00', status: 'Paid' },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf5', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e1b4b' }}>Billing History</h3>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>Last 3 invoices</p>
        </div>
        <button style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {['Invoice', 'Date', 'Amount', 'Status', ''].map(h => (
              <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, i) => (
            <tr key={inv.id} style={{ borderTop: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#fff' : '#fafbff' }}>
              <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 600, color: '#334155' }}>{inv.id}</td>
              <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748b' }}>{inv.date}</td>
              <td style={{ padding: '14px 24px', fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>{inv.amount}</td>
              <td style={{ padding: '14px 24px' }}>
                <span style={{ background: '#d1fae5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em' }}>✓ {inv.status}</span>
              </td>
              <td style={{ padding: '14px 24px' }}>
                <button style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Download PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
