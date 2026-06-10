import { useState } from 'react'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, SectionLabel, Badge } from './shared'

const TABS = ['Store Info', 'Employees', 'Locations', 'Receipts', 'Security']

const DEMO_EMPLOYEES = [
  { id: 1, name: 'TestStoreUser', role: 'Owner',     pin: '••••••••', locations: 'All', lastLogin: '2026-06-10' },
  { id: 2, name: 'CashierOne',    role: 'Cashier',   pin: '••••',     locations: 'Main', lastLogin: '2026-06-09' },
  { id: 3, name: 'InventoryStaff',role: 'Inventory Staff', pin: '••••', locations: 'Main', lastLogin: '2026-06-08' },
]

const ROLE_STYLE = {
  Owner:           { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  Manager:         { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Cashier:         { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Inventory Staff': { bg: '#f7f9fc', color: '#5f7294', border: '#d4dbe8' },
}

export default function SettingsScreen({ session }) {
  const [activeTab, setActiveTab] = useState('Store Info')

  const [storeName,   setStoreName]   = useState(session?.storeName || 'CollectorsHub')
  const [storePhone,  setStorePhone]  = useState('(902) 555-0100')
  const [storeEmail,  setStoreEmail]  = useState('store@collectorshub.com')
  const [storeAddr,   setStoreAddr]   = useState('123 Barrington St')
  const [storeCity,   setStoreCity]   = useState('Halifax')
  const [storeProvince, setStoreProvince] = useState('NS')
  const [storePostal, setStorePostal] = useState('B3J 1Z2')
  const [taxRate,     setTaxRate]     = useState('8.5')
  const [receiptNote, setReceiptNote] = useState('Thank you for shopping at CollectorsHub!')

  return (
    <div style={page}>
      <PageHeader sub="Store Configuration" title="Settings" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid #dde3ef', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} type="button" onClick={() => setActiveTab(t)} style={{ padding: '9px 18px', borderRadius: '10px 10px 0 0', border: 0, background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#17253d' : '#5f7294', fontWeight: activeTab === t ? 700 : 600, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', borderBottom: activeTab === t ? '2px solid #17253d' : '2px solid transparent', marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Store Info' && (
        <div style={card}>
          <SectionLabel>Store Details</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Store Name</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} style={fld} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input type="tel" value={storePhone} onChange={e => setStorePhone(e.target.value)} style={fld} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} style={fld} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Street Address</label>
              <input type="text" value={storeAddr} onChange={e => setStoreAddr(e.target.value)} style={fld} />
            </div>
            <div>
              <label style={lbl}>City</label>
              <input type="text" value={storeCity} onChange={e => setStoreCity(e.target.value)} style={fld} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Province</label>
                <input type="text" value={storeProvince} onChange={e => setStoreProvince(e.target.value)} style={fld} />
              </div>
              <div>
                <label style={lbl}>Postal Code</label>
                <input type="text" value={storePostal} onChange={e => setStorePostal(e.target.value)} style={fld} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f2f6' }}>
            <SectionLabel>Tax</SectionLabel>
            <div style={{ maxWidth: 220 }}>
              <label style={lbl}>Default Tax Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} step="0.1" min="0" max="30" style={fld} />
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="button" style={btnPrimary}>Save Changes</button>
          </div>
        </div>
      )}

      {activeTab === 'Employees' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionLabel>Employees</SectionLabel>
            <button type="button" style={btnPrimary}>+ Add Employee</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Username', 'Role', 'PIN', 'Locations', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em', color: '#8292ac', textTransform: 'uppercase', textAlign: 'left', background: '#f7f9fc', borderBottom: '1px solid #dde3ef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_EMPLOYEES.map(emp => {
                const rs = ROLE_STYLE[emp.role] || ROLE_STYLE.Cashier
                return (
                  <tr key={emp.id}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6' }}><span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#17253d' }}>{emp.name}</span></td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6' }}><Badge color={rs.color} bg={rs.bg} border={rs.border}>{emp.role}</Badge></td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6', color: '#8292ac', fontSize: '0.86rem', letterSpacing: '0.1em' }}>{emp.pin}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6', color: '#5f7294', fontSize: '0.86rem' }}>{emp.locations}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6', color: '#8292ac', fontSize: '0.82rem' }}>{emp.lastLogin}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f6' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.76rem' }}>Edit</button>
                        {emp.role !== 'Owner' && <button type="button" style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.76rem', color: '#ef4444', borderColor: '#fecaca' }}>Remove</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Locations' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionLabel>Locations</SectionLabel>
            <button type="button" style={btnPrimary}>+ Add Location</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#f7f9fc', borderRadius: 12, border: '1px solid #dde3ef' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#17253d', marginBottom: 2 }}>Main — 123 Barrington St, Halifax NS</div>
              <div style={{ fontSize: '0.78rem', color: '#8292ac' }}>Store Code: 0000 · 3 employees assigned</div>
            </div>
            <Badge color="#15803d" bg="#f0fdf4" border="#bbf7d0">Active</Badge>
            <button type="button" style={{ ...btnSecondary, padding: '7px 14px', fontSize: '0.82rem' }}>Edit</button>
          </div>
        </div>
      )}

      {activeTab === 'Receipts' && (
        <div style={card}>
          <SectionLabel>Receipt Settings</SectionLabel>
          <div style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
            <div>
              <label style={lbl}>Footer Note</label>
              <textarea value={receiptNote} onChange={e => setReceiptNote(e.target.value)} style={{ ...fld, minHeight: 80, resize: 'vertical' }} />
            </div>
            {[
              { label: 'Show logo on receipts', checked: true },
              { label: 'Show tax breakdown', checked: true },
              { label: 'Print itemized conditions', checked: true },
              { label: 'Include return policy', checked: false },
            ].map(opt => (
              <label key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={opt.checked} style={{ width: 16, height: 16, accentColor: '#17253d' }} />
                <span style={{ fontSize: '0.86rem', color: '#17253d' }}>{opt.label}</span>
              </label>
            ))}
            <div><button type="button" style={btnPrimary}>Save</button></div>
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div style={card}>
          <SectionLabel>Security Settings</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
            {[
              { label: 'Require PIN for voids', sub: 'Manager PIN required to void a transaction', checked: true },
              { label: 'Require PIN for discounts', sub: 'Manager PIN required for manual discounts over 10%', checked: true },
              { label: 'Auto-lock after inactivity', sub: 'Lock POS after 15 minutes of inactivity', checked: false },
              { label: 'Require ID for buy intake', sub: 'Government ID must be captured before closing buy transactions', checked: true },
            ].map(opt => (
              <label key={opt.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: '#f7f9fc', borderRadius: 12, border: '1px solid #dde3ef' }}>
                <input type="checkbox" defaultChecked={opt.checked} style={{ width: 16, height: 16, accentColor: '#17253d', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#17253d', marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#8292ac' }}>{opt.sub}</div>
                </div>
              </label>
            ))}
            <div><button type="button" style={btnPrimary}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#8292ac', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }
