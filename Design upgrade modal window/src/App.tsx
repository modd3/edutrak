import Sidebar from './components/Sidebar'
import BillingPage from './components/BillingPage'

export default function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <BillingPage />
      </main>
    </div>
  )
}
