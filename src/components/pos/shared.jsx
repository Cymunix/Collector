export const page = { padding: '32px 32px 36px', flex: 1 }
export const card = { background: '#fff', borderRadius: 16, border: '1px solid #dde3ef', padding: '20px 22px' }
export const cardSm = { background: '#fff', borderRadius: 12, border: '1px solid #dde3ef', padding: '16px 18px' }
export const fld = { width: '100%', border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '9px 12px', fontSize: '0.86rem', color: '#17253d', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f7f9fc', boxSizing: 'border-box', display: 'block' }
export const btnPrimary = { border: 0, borderRadius: 10, padding: '10px 18px', background: '#17253d', color: '#fff', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }
export const btnSecondary = { border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '9px 16px', background: '#fff', color: '#17253d', fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }

export function PageHeader({ sub, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: '#8292ac', textTransform: 'uppercase', margin: '0 0 5px' }}>{sub}</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: '#17253d', margin: 0, lineHeight: 1.1 }}>{title}</h1>
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, color = '#17253d', bg = '#f7f9fc', icon }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '16px 18px', border: '1px solid #dde3ef', flex: 1 }}>
      {icon && <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#8292ac', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    </div>
  )
}

export function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8292ac', textTransform: 'uppercase', marginBottom: 12 }}>{children}</div>
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8292ac' }}>
      <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#17253d', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '0.84rem', lineHeight: 1.5, marginBottom: action ? 18 : 0 }}>{body}</div>
      {action}
    </div>
  )
}

export function Badge({ children, color = '#5f7294', bg = '#edf1fb', border = '#dde3ef' }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.04em' }}>
      {children}
    </span>
  )
}

export const STATUS_STYLES = {
  Draft:     { bg: '#f7f9fc', color: '#5f7294', border: '#d4dbe8' },
  Active:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Paid:      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Overdue:   { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Void:      { bg: '#f7f9fc', color: '#8292ac', border: '#d4dbe8' },
  Completed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Pending:   { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  Cancelled: { bg: '#f7f9fc', color: '#8292ac', border: '#d4dbe8' },
  'In Stock':   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Low Stock':  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Out of Stock': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Active_green: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Upcoming:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Ended:     { bg: '#f7f9fc', color: '#8292ac', border: '#d4dbe8' },
}

export function Th({ children, right }) {
  return <th style={{ padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: '#8292ac', textTransform: 'uppercase', textAlign: right ? 'right' : 'left', background: '#f7f9fc', borderBottom: '1px solid #dde3ef', whiteSpace: 'nowrap' }}>{children}</th>
}
export function Td({ children, right, muted }) {
  return <td style={{ padding: '12px 14px', fontSize: '0.86rem', color: muted ? '#8292ac' : '#17253d', textAlign: right ? 'right' : 'left', borderBottom: '1px solid #f0f2f6', verticalAlign: 'middle' }}>{children}</td>
}
