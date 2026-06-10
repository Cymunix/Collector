import { useState } from 'react'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, SectionLabel, EmptyState, Badge, STATUS_STYLES } from './shared'

const DEMO_EVENTS = [
  { id: 1, name: 'Summer Pokémon Blowout', type: 'Sale', discount: '20% off all Pokémon', start: '2026-06-15', end: '2026-06-22', status: 'Upcoming', registrations: 0 },
  { id: 2, name: 'MTG Draft Night', type: 'Event', discount: null, start: '2026-06-14', end: '2026-06-14', status: 'Upcoming', registrations: 12 },
  { id: 3, name: 'Spring Clearance Sale', type: 'Sale', discount: '15% off store-wide', start: '2026-05-01', end: '2026-05-31', status: 'Ended', registrations: 0 },
  { id: 4, name: 'Collector Card Show', type: 'Event', discount: null, start: '2026-04-20', end: '2026-04-20', status: 'Ended', registrations: 47 },
]

export default function SalesEventsScreen() {
  const [tab, setTab] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Sale', discount: '', start: '', end: '', description: '' })

  const filtered = tab === 'all' ? DEMO_EVENTS : DEMO_EVENTS.filter(e => e.status.toLowerCase() === tab || e.type.toLowerCase() === tab)

  return (
    <div style={page}>
      <PageHeader
        sub="Promotions & Events"
        title="Sales / Events"
        action={<button type="button" style={btnPrimary} onClick={() => setShowCreate(v => !v)}>+ Create</button>}
      />

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, marginBottom: 22, background: '#f7f9fc', border: '2px solid #5ec5ff' }}>
          <SectionLabel>New Sale or Event</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Sale" style={fld} />
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...fld, cursor: 'pointer' }}>
                <option value="Sale">Sale / Promotion</option>
                <option value="Event">In-Store Event</option>
              </select>
            </div>
            {form.type === 'Sale' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Discount Details</label>
                <input type="text" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="e.g. 15% off all Pokémon cards" style={fld} />
              </div>
            )}
            <div>
              <label style={lbl}>Start Date</label>
              <input type="date" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} style={fld} />
            </div>
            <div>
              <label style={lbl}>End Date</label>
              <input type="date" value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} style={fld} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes or details..." style={{ ...fld, minHeight: 72, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" style={btnPrimary}>Save</button>
            <button type="button" style={btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['all','All'],['upcoming','Upcoming'],['ended','Past'],['sale','Sales'],['event','Events']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={{ padding: '7px 14px', borderRadius: 8, border: tab === id ? 0 : '1.5px solid #dde3ef', background: tab === id ? '#17253d' : '#fff', color: tab === id ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{label}</button>
        ))}
      </div>

      {/* Events list */}
      {filtered.length === 0 ? (
        <div style={card}><EmptyState icon="🎪" title="Nothing here yet" body="Create a sale or event to get started." action={<button type="button" style={btnPrimary} onClick={() => setShowCreate(true)}>+ Create</button>} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(ev => {
            const st = ev.status === 'Upcoming' ? STATUS_STYLES.Upcoming : STATUS_STYLES.Ended
            const typeStyle = ev.type === 'Sale' ? { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' } : { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
            return (
              <div key={ev.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {ev.type === 'Sale' ? '🏷️' : '🎪'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#17253d' }}>{ev.name}</span>
                    <Badge color={typeStyle.color} bg={typeStyle.bg} border={typeStyle.border}>{ev.type}</Badge>
                    <Badge color={st.color} bg={st.bg} border={st.border}>{ev.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5f7294' }}>
                    {ev.start === ev.end ? ev.start : `${ev.start} → ${ev.end}`}
                    {ev.discount && <span style={{ marginLeft: 12, color: '#c2410c', fontWeight: 600 }}>{ev.discount}</span>}
                    {ev.type === 'Event' && <span style={{ marginLeft: 12 }}>👥 {ev.registrations} registered</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button type="button" style={{ ...btnSecondary, padding: '7px 14px', fontSize: '0.82rem' }}>Edit</button>
                  {ev.status === 'Upcoming' && <button type="button" style={{ ...btnSecondary, padding: '7px 14px', fontSize: '0.82rem', color: '#ef4444', borderColor: '#fecaca' }}>Cancel</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#8292ac', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }
