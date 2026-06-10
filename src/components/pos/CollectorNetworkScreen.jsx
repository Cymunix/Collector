import { useState } from 'react'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, SectionLabel, EmptyState, Badge, STATUS_STYLES } from './shared'

const DEMO_COLLECTORS = [
  { id: 1, handle: '@pokefan_hfx', name: 'Alex B.', city: 'Halifax, NS', rating: 4.9, trades: 42, badge: 'Verified', specialty: 'Pokémon' },
  { id: 2, handle: '@vinylvault',   name: 'Sam T.',  city: 'Dartmouth, NS', rating: 4.7, trades: 19, badge: 'Active',   specialty: 'Music / Vinyl' },
  { id: 3, handle: '@mtg_pro',      name: 'Jordan K.', city: 'Truro, NS',  rating: 5.0, trades: 87, badge: 'Top Trader', specialty: 'Magic: The Gathering' },
]

const DEMO_REQUESTS = [
  { id: 1, from: '@pokefan_hfx', item: 'Charizard Holo Base Set', offer: '$180 store credit', type: 'Buy', date: 'Jun 9' },
  { id: 2, from: '@mtg_pro',      item: 'Black Lotus Alpha', offer: 'Trade: 3x Force of Will', type: 'Trade', date: 'Jun 8' },
]

export default function CollectorNetworkScreen() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('network')

  return (
    <div style={page}>
      <PageHeader
        sub="Marketplace & Network"
        title="Collector Network"
        action={<button type="button" style={btnPrimary}>List an Item</button>}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'network',  label: 'Collectors' },
          { id: 'requests', label: `Requests (${DEMO_REQUESTS.length})` },
          { id: 'listings', label: 'Your Listings' },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 0, background: tab === t.id ? '#17253d' : '#fff', color: tab === t.id ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', border: tab === t.id ? 0 : '1.5px solid #dde3ef' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'network' && (
        <>
          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search collectors by name, specialty, or location..." style={{ ...fld, maxWidth: 440 }} />
          </div>

          {/* Collector cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {DEMO_COLLECTORS.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.specialty.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#edf1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: '#17253d', flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#17253d' }}>{c.name}</span>
                      {c.badge === 'Top Trader' && <Badge color="#b45309" bg="#fffbeb" border="#fde68a">{c.badge}</Badge>}
                      {c.badge === 'Verified'   && <Badge color="#15803d" bg="#f0fdf4" border="#bbf7d0">{c.badge}</Badge>}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#8292ac' }}>{c.handle} · {c.city}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: '0.82rem', color: '#5f7294' }}>
                  <span>⭐ {c.rating}</span>
                  <span>🔄 {c.trades} trades</span>
                  <span>📦 {c.specialty}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={{ ...btnSecondary, flex: 1, textAlign: 'center', fontSize: '0.82rem', padding: '7px' }}>View Profile</button>
                  <button type="button" style={{ ...btnSecondary, flex: 1, textAlign: 'center', fontSize: '0.82rem', padding: '7px' }}>Send Offer</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DEMO_REQUESTS.map(r => (
            <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#edf1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#17253d', flexShrink: 0 }}>
                {r.from[1].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#17253d', marginBottom: 3 }}>{r.item}</div>
                <div style={{ fontSize: '0.8rem', color: '#5f7294' }}>From {r.from} · Offer: {r.offer}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <Badge color={r.type === 'Trade' ? '#1d4ed8' : '#15803d'} bg={r.type === 'Trade' ? '#eff6ff' : '#f0fdf4'} border={r.type === 'Trade' ? '#bfdbfe' : '#bbf7d0'}>{r.type}</Badge>
                <span style={{ fontSize: '0.76rem', color: '#8292ac' }}>{r.date}</span>
                <button type="button" style={{ ...btnPrimary, padding: '7px 14px', fontSize: '0.82rem' }}>Accept</button>
                <button type="button" style={{ ...btnSecondary, padding: '7px 14px', fontSize: '0.82rem' }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'listings' && (
        <div style={card}>
          <EmptyState
            icon="🏷️"
            title="No active listings"
            body="List items from your inventory on the Collector Network marketplace."
            action={<button type="button" style={btnPrimary}>List an Item</button>}
          />
        </div>
      )}
    </div>
  )
}
