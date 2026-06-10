import { useState } from 'react'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, StatCard, SectionLabel, EmptyState, Badge, STATUS_STYLES, Th, Td } from './shared'

const FILTERS = ['All', 'Draft', 'Active', 'Paid', 'Overdue', 'Void']

const DEMO_INVOICES = [
  { id: 'INV-2026-0041', customer: 'Walk-in Customer', date: '2026-06-10', items: 3, total: 275, status: 'Active', method: 'Cash' },
  { id: 'INV-2026-0040', customer: 'Jordan M.', date: '2026-06-09', items: 1, total: 120, status: 'Paid', method: 'Card' },
  { id: 'INV-2026-0039', customer: 'Sam R.', date: '2026-06-09', items: 5, total: 845, status: 'Paid', method: 'E-Transfer' },
  { id: 'INV-2026-0038', customer: 'Alex T.', date: '2026-06-08', items: 2, total: 60, status: 'Void', method: '—' },
  { id: 'INV-2026-0037', customer: 'Casey L.', date: '2026-06-07', items: 4, total: 390, status: 'Paid', method: 'Card' },
  { id: 'INV-2026-0036', customer: 'Riley K.', date: '2026-06-06', items: 1, total: 1200, status: 'Overdue', method: 'Store Credit' },
  { id: 'INV-2026-0035', customer: 'Morgan B.', date: '2026-06-05', items: 2, total: 55, status: 'Draft', method: '—' },
]

export default function InvoiceScreen() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = DEMO_INVOICES.filter(inv => {
    const matchesFilter = filter === 'All' || inv.status === filter
    const matchesSearch = !search || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.customer.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    Draft:   DEMO_INVOICES.filter(i => i.status === 'Draft').length,
    Active:  DEMO_INVOICES.filter(i => i.status === 'Active').length,
    Paid:    DEMO_INVOICES.filter(i => i.status === 'Paid').length,
    Overdue: DEMO_INVOICES.filter(i => i.status === 'Overdue').length,
  }

  return (
    <div style={page}>
      <PageHeader
        sub="Store Invoicing"
        title="Invoice"
        action={<button type="button" style={btnPrimary}>+ New Invoice</button>}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Draft"   value={counts.Draft}   color="#5f7294" bg="#f7f9fc" icon="📝" />
        <StatCard label="Active"  value={counts.Active}  color="#1d4ed8" bg="#eff6ff" icon="🔵" />
        <StatCard label="Paid"    value={counts.Paid}    color="#15803d" bg="#f0fdf4" icon="✅" />
        <StatCard label="Overdue" value={counts.Overdue} color="#b91c1c" bg="#fef2f2" icon="⚠️" />
      </div>

      <div style={card}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTERS.map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{ padding: '6px 13px', borderRadius: 8, border: 0, background: filter === f ? '#17253d' : '#edf1fb', color: filter === f ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{f}</button>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." style={{ ...fld, padding: '7px 12px' }} />
          </div>
          <button type="button" style={btnSecondary}>Export CSV</button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Invoice #</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Items</Th>
                <Th right>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="🧾" title="No invoices found" body="No invoices match your current filter." /></td></tr>
              ) : filtered.map(inv => {
                const st = STATUS_STYLES[inv.status] || STATUS_STYLES.Draft
                return (
                  <tr key={inv.id}>
                    <Td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#1d4ed8', fontSize: '0.82rem' }}>{inv.id}</span></Td>
                    <Td>{inv.customer}</Td>
                    <Td muted>{inv.date}</Td>
                    <Td muted>{inv.items} item{inv.items !== 1 ? 's' : ''}</Td>
                    <Td right><strong>${inv.total.toLocaleString()}</strong></Td>
                    <Td muted>{inv.method}</Td>
                    <Td><Badge color={st.color} bg={st.bg} border={st.border}>{inv.status}</Badge></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" style={{ ...btnSecondary, padding: '5px 11px', fontSize: '0.78rem' }}>View</button>
                        {inv.status === 'Draft' && <button type="button" style={{ ...btnSecondary, padding: '5px 11px', fontSize: '0.78rem' }}>Edit</button>}
                      </div>
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
