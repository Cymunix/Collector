import { useState } from 'react'
import { page, card, cardSm, btnPrimary, btnSecondary, PageHeader, SectionLabel, EmptyState } from './shared'

const QUICK_ACTIONS = [
  { icon: '⊕', label: 'New Transaction', color: '#5ec5ff', bg: 'rgba(94,197,255,0.12)', border: 'rgba(94,197,255,0.3)' },
  { icon: '🖨', label: 'Print Receipt',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  { icon: '💵', label: 'Cash Drawer',     color: '#1cae5f', bg: 'rgba(28,174,95,0.12)', border: 'rgba(28,174,95,0.3)' },
  { icon: '📊', label: 'End of Day',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
]

const TODAY = {
  transactions: 3,
  revenue: 1325,
  itemsSold: 8,
  itemsBought: 6,
}

export default function StoreDeskScreen({ onNav }) {
  const [storeOpen, setStoreOpen] = useState(true)

  return (
    <div style={page}>
      <PageHeader
        sub="Front of Store"
        title="Store Desk"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: storeOpen ? '#f0fdf4' : '#fef2f2', border: `1px solid ${storeOpen ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '8px 14px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: storeOpen ? '#1cae5f' : '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: storeOpen ? '#15803d' : '#b91c1c' }}>{storeOpen ? 'Store Open' : 'Store Closed'}</span>
            </div>
            <button type="button" onClick={() => setStoreOpen(v => !v)} style={btnSecondary}>
              {storeOpen ? 'Close Store' : 'Open Store'}
            </button>
          </div>
        }
      />

      {/* Quick Actions */}
      <div style={{ marginBottom: 22 }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              type="button"
              onClick={() => a.label === 'New Transaction' && onNav?.('transaction')}
              style={{ background: '#fff', border: `1.5px solid ${a.border}`, borderRadius: 14, padding: '20px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = a.bg }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#17253d' }}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Today's Summary */}
        <div style={card}>
          <SectionLabel>Today's Summary</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Transactions', value: TODAY.transactions, color: '#17253d', bg: '#f7f9fc' },
              { label: 'Revenue',      value: `$${TODAY.revenue.toLocaleString()}`, color: '#15803d', bg: '#f0fdf4' },
              { label: 'Items Sold',   value: TODAY.itemsSold, color: '#1d4ed8', bg: '#eff6ff' },
              { label: 'Items Bought', value: TODAY.itemsBought, color: '#c2410c', bg: '#fff7ed' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: '1px solid #dde3ef' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: s.color, marginBottom: 3 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8292ac', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f2f6' }}>
            <button type="button" style={{ ...btnSecondary, width: '100%', textAlign: 'center' }}>View Full Report</button>
          </div>
        </div>

        {/* Active Queue */}
        <div style={card}>
          <SectionLabel>Active Queue</SectionLabel>
          <EmptyState
            icon="🟢"
            title="No active transactions"
            body="New transactions will appear here as they are opened at the counter."
            action={
              <button type="button" style={btnPrimary} onClick={() => onNav?.('transaction')}>
                + Start Transaction
              </button>
            }
          />
        </div>

        {/* Cash Drawer */}
        <div style={card}>
          <SectionLabel>Cash Drawer</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Opening Float', value: '$200.00' },
              { label: 'Cash Sales',    value: '+$325.00' },
              { label: 'Cash Payouts',  value: '-$0.00' },
              { label: 'Expected',      value: '$525.00', bold: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f2f6' }}>
                <span style={{ fontSize: '0.84rem', color: '#5f7294' }}>{row.label}</span>
                <span style={{ fontFamily: row.bold ? 'var(--font-display)' : 'inherit', fontWeight: row.bold ? 700 : 600, fontSize: row.bold ? '1rem' : '0.86rem', color: '#17253d' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button type="button" style={{ ...btnSecondary, marginTop: 14, width: '100%', textAlign: 'center' }}>Count Drawer</button>
        </div>

        {/* Recent Customers */}
        <div style={card}>
          <SectionLabel>Recent Customers</SectionLabel>
          {['Jordan M.', 'Sam R.', 'Casey L.', 'Riley K.'].map((name, i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid #f0f2f6' : 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: ['#eff6ff','#f0fdf4','#fff7ed','#fef2f2'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: ['#1d4ed8','#15803d','#c2410c','#b91c1c'][i], flexShrink: 0 }}>
                {name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#17253d' }}>{name}</div>
                <div style={{ fontSize: '0.72rem', color: '#8292ac' }}>Last visit: Jun {10 - i}, 2026</div>
              </div>
              <button type="button" style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.76rem' }}>View</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
