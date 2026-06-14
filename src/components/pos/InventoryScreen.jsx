import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { page, card, fld, btnPrimary, btnSecondary, PageHeader, StatCard, SectionLabel, EmptyState, Badge, STATUS_STYLES, Th, Td } from './shared'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG']
const COND_STYLE = {
  NM:  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  LP:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  MP:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  HP:  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  DMG: { bg: '#fef2f2', color: '#7f1d1d', border: '#fca5a5' },
}

export default function InventoryScreen() {
  const [search,     setSearch]     = useState('')
  const [condFilter, setCondFilter] = useState('All')
  const [items,      setItems]      = useState([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [page_,      setPage]       = useState(1)
  const [total,      setTotal]      = useState(0)
  const PAGE_SIZE = 20

  const lookupRef = useRef({ subjectMap: {}, setMap: {}, printTypeMap: {} })

  useEffect(() => {
    const loadLookups = async () => {
      const [{ data: subjects }, { data: sets }, { data: printTypes }] = await Promise.all([
        supabase.from('subjects').select('subject_id, subject_name'),
        supabase.from('collectible_sets').select('collectible_set_id, name'),
        supabase.from('print_types').select('print_type_id, name'),
      ])
      lookupRef.current = {
        subjectMap:   Object.fromEntries((subjects   || []).map(r => [r.subject_id,          r.subject_name])),
        setMap:       Object.fromEntries((sets        || []).map(r => [r.collectible_set_id,  r.name])),
        printTypeMap: Object.fromEntries((printTypes  || []).map(r => [r.print_type_id,       r.name])),
      }
    }
    loadLookups()
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      let playerIds = null
      if (search.trim().length >= 2) {
        const { data: matchingPlayers } = await supabase
          .from('subjects')
          .select('subject_id')
          .ilike('subject_name', `%${search.trim()}%`)
        playerIds = (matchingPlayers || []).map(p => p.subject_id)
      }

      let q = supabase
        .from('items')
        .select('item_id, card_number, print_count, description, subject_id, collectible_set_id, print_type_id', { count: 'exact' })
        .order('card_number')
        .range((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE - 1)

      if (playerIds !== null) {
        if (playerIds.length === 0) {
          setItems([])
          setTotal(0)
          setIsLoading(false)
          return
        }
        q = q.in('subject_id', playerIds)
      }

      const { data, count } = await q
      const { subjectMap, setMap, printTypeMap } = lookupRef.current
      const buildName = (item) => {
        const parts = [
          subjectMap[item.subject_id],
          setMap[item.collectible_set_id],
          printTypeMap[item.print_type_id],
          item.card_number ? `#${item.card_number}` : null,
        ].filter(Boolean)
        return parts.join(' — ') || item.description || 'Unknown Item'
      }
      setItems((data || []).map(item => ({ ...item, id: item.item_id, name: buildName(item) })))
      setTotal(count || 0)
      setIsLoading(false)
    }
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, page_])

  const displayed = items

  const inStock  = items.length
  const lowStock = 0
  const outStock = 0

  return (
    <div style={page}>
      <PageHeader
        sub="Stock Management"
        title="Inventory"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={btnSecondary}>Import CSV</button>
            <button type="button" style={btnPrimary}>+ Add Item</button>
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Items"    value={total}    color="#17253d" bg="#f7f9fc"  icon="📦" />
        <StatCard label="In Stock"       value={inStock}  color="#15803d" bg="#f0fdf4"  icon="✅" />
        <StatCard label="Low Stock"      value={lowStock} color="#c2410c" bg="#fff7ed"  icon="⚠️" />
        <StatCard label="Out of Stock"   value={outStock} color="#b91c1c" bg="#fef2f2"  icon="❌" />
      </div>

      <div style={card}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search catalog items..."
            style={{ ...fld, maxWidth: 300, padding: '7px 12px' }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {['All', ...CONDITIONS].map(c => (
              <button key={c} type="button" onClick={() => setCondFilter(c)} style={{ padding: '6px 11px', borderRadius: 8, border: 0, background: condFilter === c ? '#17253d' : '#edf1fb', color: condFilter === c ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{c}</button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', color: '#8292ac', fontSize: '0.8rem' }}>{total.toLocaleString()} item{total !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Year</Th>
                <Th>Condition</Th>
                <Th right>Buy Price</Th>
                <Th right>Sell Price</Th>
                <Th>Stock</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#8292ac', fontSize: '0.86rem' }}>Loading catalog...</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon="📦" title="No items found" body={search ? `No results for "${search}"` : 'Your inventory is empty. Add items or import a CSV.'} /></td></tr>
              ) : displayed.map(item => {
                const cond = item.dynamic_fields?.condition || 'NM'
                const cs = COND_STYLE[cond] || COND_STYLE.NM
                return (
                  <tr key={item.id}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 7, background: '#edf1fb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {item.metadata?.image_url
                            ? <img src={item.metadata.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '1.1rem' }}>📦</span>
                          }
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.name}</span>
                      </div>
                    </Td>
                    <Td muted>{item.release_year || '—'}</Td>
                    <Td><span style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>{cond}</span></Td>
                    <Td right muted>—</Td>
                    <Td right muted>—</Td>
                    <Td><span style={{ ...STATUS_STYLES['In Stock'], fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: STATUS_STYLES['In Stock'].bg, color: STATUS_STYLES['In Stock'].color, border: `1px solid ${STATUS_STYLES['In Stock'].border}` }}>In Stock</span></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.76rem' }}>Edit</button>
                        <button type="button" style={{ ...btnSecondary, padding: '5px 10px', fontSize: '0.76rem', color: '#ef4444', borderColor: '#fecaca' }}>Remove</button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f2f6' }}>
            <span style={{ color: '#8292ac', fontSize: '0.82rem' }}>Page {page_} of {Math.ceil(total / PAGE_SIZE)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page_ === 1} style={{ ...btnSecondary, padding: '6px 14px', opacity: page_ === 1 ? 0.4 : 1 }}>← Prev</button>
              <button type="button" onClick={() => setPage(p => p + 1)} disabled={page_ >= Math.ceil(total / PAGE_SIZE)} style={{ ...btnSecondary, padding: '6px 14px', opacity: page_ >= Math.ceil(total / PAGE_SIZE) ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
