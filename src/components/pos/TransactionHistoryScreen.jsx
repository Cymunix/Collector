import { useState } from 'react'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, StatCard, EmptyState, Badge, STATUS_STYLES, Th, Td } from './shared'

const DEMO_TX = [
  { id: 'TXN-20260610-0041', date: '2026-06-10 14:22', customer: 'Walk-in', items: 3, totalIn: 225, totalOut: 500, balance: 275, method: 'Cash', status: 'Completed' },
  { id: 'TXN-20260609-0040', date: '2026-06-09 11:05', customer: 'Jordan M.', items: 1, totalIn: 120, totalOut: 0, balance: -120, method: 'Card', status: 'Completed' },
  { id: 'TXN-20260609-0039', date: '2026-06-09 09:47', customer: 'Sam R.', items: 5, totalIn: 845, totalOut: 200, balance: -645, method: 'E-Transfer', status: 'Completed' },
  { id: 'TXN-20260608-0038', date: '2026-06-08 16:30', customer: 'Alex T.', items: 2, totalIn: 60, totalOut: 60, balance: 0, method: '—', status: 'Cancelled' },
  { id: 'TXN-20260607-0037', date: '2026-06-07 13:15', customer: 'Casey L.', items: 4, totalIn: 390, totalOut: 0, balance: -390, method: 'Card', status: 'Completed' },
  { id: 'TXN-20260606-0036', date: '2026-06-06 10:00', customer: 'Riley K.', items: 1, totalIn: 0, totalOut: 1200, balance: 1200, method: 'Store Credit', status: 'Pending' },
]

export default function TransactionHistoryScreen() {
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')

  const filtered = DEMO_TX.filter(tx => {
    if (statusFilter !== 'All' && tx.status !== statusFilter) return false
    if (search && !tx.id.toLowerCase().includes(search.toLowerCase()) && !tx.customer.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalRevenue = DEMO_TX.filter(t => t.status === 'Completed').reduce((s, t) => s + t.totalOut, 0)
  const completedCount = DEMO_TX.filter(t => t.status === 'Completed').length
  const avgTx = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0

  return (
    <div style={page}>
      <PageHeader
        sub="Transaction Records"
        title="Transaction History"
        action={<button type="button" style={btnSecondary}>Export CSV</button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Revenue"    value={`$${totalRevenue.toLocaleString()}`}  color="#15803d" bg="#f0fdf4"  icon="💰" />
        <StatCard label="Transactions"     value={DEMO_TX.length}                        color="#17253d" bg="#f7f9fc"  icon="🔄" />
        <StatCard label="Avg Transaction"  value={`$${avgTx.toLocaleString()}`}          color="#1d4ed8" bg="#eff6ff"  icon="📊" />
        <StatCard label="Pending"          value={DEMO_TX.filter(t => t.status === 'Pending').length} color="#c2410c" bg="#fff7ed" icon="⏳" />
      </div>

      <div style={card}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or customer..." style={{ ...fld, maxWidth: 240, padding: '7px 12px' }} />
          <div style={{ display: 'flex', gap: 4 }}>
            {['All', 'Completed', 'Pending', 'Cancelled'].map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: 8, border: 0, background: statusFilter === s ? '#17253d' : '#edf1fb', color: statusFilter === s ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...fld, width: 140, padding: '7px 10px' }} />
            <span style={{ color: '#8292ac', fontSize: '0.82rem' }}>→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...fld, width: 140, padding: '7px 10px' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Transaction ID</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th right>Total IN</Th>
                <Th right>Total OUT</Th>
                <Th right>Balance</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon="📋" title="No transactions found" body="No transactions match your filter." /></td></tr>
              ) : filtered.map(tx => {
                const st = STATUS_STYLES[tx.status] || STATUS_STYLES.Completed
                return (
                  <tr key={tx.id}>
                    <Td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#1d4ed8', fontSize: '0.78rem' }}>{tx.id}</span></Td>
                    <Td muted><span style={{ fontSize: '0.8rem' }}>{tx.date}</span></Td>
                    <Td>{tx.customer}</Td>
                    <Td muted>{tx.items}</Td>
                    <Td right><span style={{ color: '#15803d', fontWeight: 700 }}>${tx.totalIn.toLocaleString()}</span></Td>
                    <Td right><span style={{ color: '#1d4ed8', fontWeight: 700 }}>${tx.totalOut.toLocaleString()}</span></Td>
                    <Td right>
                      <span style={{ fontWeight: 700, color: tx.balance > 0 ? '#1d4ed8' : tx.balance < 0 ? '#15803d' : '#8292ac' }}>
                        {tx.balance === 0 ? '—' : tx.balance > 0 ? `+$${tx.balance}` : `-$${Math.abs(tx.balance)}`}
                      </span>
                    </Td>
                    <Td muted>{tx.method}</Td>
                    <Td><Badge color={st.color} bg={st.bg} border={st.border}>{tx.status}</Badge></Td>
                    <Td>
                      <button type="button" style={{ ...btnSecondary, padding: '5px 11px', fontSize: '0.78rem' }}>View</button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
