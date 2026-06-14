import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import InvoiceScreen           from './pos/InvoiceScreen'
import InventoryScreen         from './pos/InventoryScreen'
import TransactionHistoryScreen from './pos/TransactionHistoryScreen'
import StoreDeskScreen         from './pos/StoreDeskScreen'
import CollectorNetworkScreen  from './pos/CollectorNetworkScreen'
import SalesEventsScreen       from './pos/SalesEventsScreen'
import SettingsScreen          from './pos/SettingsScreen'

const NAV_ITEMS = [
  { id: 'transaction',  label: 'Transaction',         icon: '⟳' },
  { id: 'invoice',      label: 'Invoice',              icon: '🧾' },
  { id: 'inventory',    label: 'Inventory',            icon: '📦' },
  { id: 'history',      label: 'Transaction History',  icon: '📋' },
  { id: 'desk',         label: 'Store Desk',           icon: '🖥' },
  { id: 'network',      label: 'Collector Network',    icon: '👤' },
  { id: 'events',       label: 'Sales/Events',         icon: '🎪' },
  { id: 'settings',     label: 'Settings',             icon: '⚙' },
]

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG']

const COND_STYLE = {
  NM:  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  LP:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  MP:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  HP:  { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  DMG: { bg: '#fef2f2', color: '#7f1d1d', border: '#fca5a5' },
}

let nextId = 1

export default function StorePOSDashboard({ session, onLogout }) {
  const [activeNav,      setActiveNav]      = useState('transaction')
  const [invoiceNumber,  setInvoiceNumber]  = useState('')
  const [txMode,         setTxMode]         = useState('standard')
  const [customerName,   setCustomerName]   = useState('')
  const [customerPhone,  setCustomerPhone]  = useState('')
  const [customerGovId,  setCustomerGovId]  = useState('')
  const [items,          setItems]          = useState([])
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState([])
  const [isSearching,    setIsSearching]    = useState(false)
  const [showDropdown,   setShowDropdown]   = useState(false)
  const [paymentMethod,  setPaymentMethod]  = useState('')
  const [invoiceExpiry,  setInvoiceExpiry]  = useState('2026-06-16')
  const [showMoreDetails,setShowMoreDetails]= useState(false)

  const searchRef   = useRef(null)
  const debounceRef = useRef(null)
  const lookupRef   = useRef({ subjectMap: {}, setMap: {}, printTypeMap: {} })

  useEffect(() => {
    const loadLookups = async () => {
      const [{ data: subjects }, { data: sets }, { data: printTypes }] = await Promise.all([
        supabase.from('subjects').select('subject_id, subject_name'),
        supabase.from('collectible_sets').select('collectible_set_id, name'),
        supabase.from('print_types').select('print_type_id, name'),
      ])
      lookupRef.current = {
        subjectMap:   Object.fromEntries((subjects   || []).map(r => [r.subject_id,         r.subject_name])),
        setMap:       Object.fromEntries((sets        || []).map(r => [r.collectible_set_id, r.name])),
        printTypeMap: Object.fromEntries((printTypes  || []).map(r => [r.print_type_id,      r.name])),
      }
    }
    loadLookups()
  }, [])

  const totalIn  = items.filter(i => i.direction === 'IN') .reduce((s, i) => s + i.price, 0)
  const totalOut = items.filter(i => i.direction === 'OUT').reduce((s, i) => s + i.price, 0)
  const balance  = totalOut - totalIn

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced catalog search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const q = searchQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const { data: matchingPlayers } = await supabase
        .from('subjects')
        .select('subject_id')
        .ilike('subject_name', `%${q}%`)
        .limit(20)
      const playerIds = (matchingPlayers || []).map(p => p.subject_id)
      let results = []
      if (playerIds.length > 0) {
        const { data } = await supabase
          .from('items')
          .select('item_id, card_number, print_count, subject_id, collectible_set_id, print_type_id')
          .in('subject_id', playerIds)
          .limit(10)
        results = data || []
      }
      setSearchResults(results)
      setShowDropdown(true)
      setIsSearching(false)
    }, 280)
    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

  const buildItemDisplayName = (catalogItem) => {
    const { subjectMap, setMap, printTypeMap } = lookupRef.current
    const parts = [
      subjectMap[catalogItem.subject_id],
      setMap[catalogItem.collectible_set_id],
      printTypeMap[catalogItem.print_type_id],
      catalogItem.card_number ? `#${catalogItem.card_number}` : null,
    ].filter(Boolean)
    return parts.join(' — ') || 'Unknown Item'
  }

  const addCatalogItem = (catalogItem) => {
    setItems(prev => [...prev, {
      id:        nextId++,
      catalogId: catalogItem.item_id,
      name:      buildItemDisplayName(catalogItem),
      year:      null,
      image:     null,
      direction: 'IN',
      condition: 'NM',
      price:     0,
    }])
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
  }

  const removeItem     = (id)       => setItems(prev => prev.filter(i => i.id !== id))
  const updatePrice    = (id, val)  => setItems(prev => prev.map(i => i.id === id ? { ...i, price: Number(val) || 0 } : i))
  const updateDir      = (id, dir)  => setItems(prev => prev.map(i => i.id === id ? { ...i, direction: dir } : i))
  const updateCond     = (id, cond) => setItems(prev => prev.map(i => i.id === id ? { ...i, condition: cond } : i))

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: '#edf1fb' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 224, minHeight: '100svh', background: 'linear-gradient(180deg,#031333 0%,#081a46 60%,#10265c 100%)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
            <span style={{ width: 34, height: 34, background: 'rgba(94,197,255,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#5ec5ff', fontSize: '0.82rem', flexShrink: 0 }}>CH</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{session.storeName}</span>
          </div>
          <div style={{ paddingLeft: 43, color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', lineHeight: 1.4 }}>
            {session.storeMode}
            <br />
            <span style={{ display: 'inline-block', marginTop: 4, background: '#1cae5f', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{session.badge}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} type="button" onClick={() => setActiveNav(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: activeNav === item.id ? 'rgba(94,197,255,0.15)' : 'transparent', border: activeNav === item.id ? '1px solid rgba(94,197,255,0.28)' : '1px solid transparent', borderRadius: 10, color: activeNav === item.id ? '#5ec5ff' : 'rgba(255,255,255,0.58)', fontSize: '0.84rem', fontWeight: activeNav === item.id ? 700 : 500, cursor: 'pointer', textAlign: 'left', marginBottom: 2, fontFamily: 'var(--font-ui)', transition: 'all 0.14s' }}>
              <span style={{ fontSize: '0.9rem', width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginBottom: 8 }}>{session.username}</div>
          <button type="button" onClick={onLogout} style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', padding: '7px 12px', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left' }}>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {activeNav === 'invoice'   && <InvoiceScreen />}
        {activeNav === 'inventory' && <InventoryScreen />}
        {activeNav === 'history'   && <TransactionHistoryScreen />}
        {activeNav === 'desk'      && <StoreDeskScreen onNav={setActiveNav} />}
        {activeNav === 'network'   && <CollectorNetworkScreen />}
        {activeNav === 'events'    && <SalesEventsScreen />}
        {activeNav === 'settings'  && <SettingsScreen session={session} />}
        {activeNav === 'transaction' && <>
        <div style={{ padding: '32px 32px 0' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', color: '#8292ac', textTransform: 'uppercase', margin: '0 0 5px' }}>Unified Collectible Operations</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: '#17253d', margin: '0 0 22px', lineHeight: 1.1 }}>Transaction</h1>

          {/* Invoice bar */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', marginBottom: 22, border: '1px solid #dde3ef' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#8292ac', textTransform: 'uppercase', margin: '0 0 3px' }}>Live POS Transaction</p>
            <p style={{ color: '#5f7294', fontSize: '0.8rem', margin: '0 0 12px' }}>Scan, price, and settle in one workflow.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Enter invoice number (e.g. TXN-20260506-1234)" style={{ flex: 1, border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '10px 14px', fontSize: '0.88rem', color: '#17253d', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f7f9fc' }} />
              <button type="button" style={{ border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '10px 18px', background: '#fff', color: '#17253d', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' }}>Pull Invoice</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {['Standard', 'Pure Sell'].map(mode => (
                <button key={mode} type="button" onClick={() => setTxMode(mode.toLowerCase().replace(' ', '-'))} style={{ padding: '6px 14px', borderRadius: 8, border: 0, background: txMode === mode.toLowerCase().replace(' ', '-') ? '#17253d' : '#edf1fb', color: txMode === mode.toLowerCase().replace(' ', '-') ? '#fff' : '#5f7294', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{mode}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Three-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '254px 1fr 272px', gap: 18, padding: '0 32px 32px', alignItems: 'start' }}>

          {/* CUSTOMER */}
          <div style={panel}>
            <SLabel>Customer</SLabel>
            <FLabel>Customer Name *</FLabel>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" style={fld} />
            <FLabel>Phone Number *</FLabel>
            <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" style={fld} />
            <FLabel>Government ID *</FLabel>
            <input type="text" value={customerGovId} onChange={e => setCustomerGovId(e.target.value)} placeholder="Optional" style={fld} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, padding: '9px 11px', background: '#f0fdf4', borderRadius: 9, border: '1px solid #bbf7d0' }}>
              <span style={{ color: '#15803d', fontSize: '0.82rem' }}>✓</span>
              <span style={{ color: '#15803d', fontSize: '0.76rem', fontWeight: 700 }}>Not captured</span>
            </div>
            <p style={{ color: '#c2410c', fontSize: '0.73rem', margin: '8px 0 0', lineHeight: 1.4 }}>
              ID capture, contact records and transaction history are required before buy intake closes.
            </p>
            <button type="button" onClick={() => setShowMoreDetails(v => !v)} style={{ marginTop: 14, background: 'none', border: 0, color: '#5f7294', fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{showMoreDetails ? '▼' : '▶'}</span> More details
            </button>
          </div>

          {/* TRANSACTION */}
          <div style={panel}>
            <SLabel>Transaction</SLabel>

            {/* Search with dropdown */}
            <div ref={searchRef} style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f7f9fc', border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '9px 13px' }}>
                <span style={{ color: '#8292ac', flexShrink: 0 }}>{isSearching ? '⏳' : '🔍'}</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Scan barcode or search catalog..."
                  style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '0.88rem', color: '#17253d', flex: 1, fontFamily: 'var(--font-ui)' }}
                />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false) }} style={{ background: 'none', border: 0, color: '#8292ac', cursor: 'pointer', padding: 0, fontSize: '0.9rem', lineHeight: 1 }}>✕</button>
                )}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #d4dbe8', borderRadius: 12, boxShadow: '0 8px 24px rgba(17,37,61,0.12)', zIndex: 100, maxHeight: 280, overflowY: 'auto' }}>
                  {searchResults.map(result => (
                    <button
                      key={result.item_id}
                      type="button"
                      onMouseDown={() => addCatalogItem(result)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 0, borderBottom: '1px solid #f0f2f6', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-ui)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f7f9fc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 7, background: '#edf1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '1rem' }}>📦</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#17253d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{buildItemDisplayName(result)}</div>
                        {result.card_number && <div style={{ fontSize: '0.72rem', color: '#8292ac' }}>#{result.card_number}{result.print_count ? ` /${result.print_count}` : ''}</div>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#5ec5ff', fontWeight: 700, flexShrink: 0 }}>+ Add</span>
                    </button>
                  ))}
                </div>
              )}

              {showDropdown && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #d4dbe8', borderRadius: 12, padding: '14px', zIndex: 100, color: '#8292ac', fontSize: '0.84rem', textAlign: 'center' }}>
                  No items found for "{searchQuery}"
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8292ac', fontSize: '0.86rem' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
                Search the catalog above to add items to this transaction.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                    onPriceChange={v => updatePrice(item.id, v)}
                    onDirChange={d => updateDir(item.id, d)}
                    onCondChange={c => updateCond(item.id, c)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SUMMARY */}
          <div style={panel}>
            <SLabel>Summary</SLabel>
            <SummaryRow label="Total IN"  value={`$${totalIn.toLocaleString()}`}  color="#15803d" bg="#f0fdf4" />
            <SummaryRow label="Total OUT" value={`$${totalOut.toLocaleString()}`} color="#1d4ed8" bg="#eff6ff" />
            <div style={{ padding: '12px 0', borderTop: '1px solid #e8edf5', marginTop: 4 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#8292ac', textTransform: 'uppercase', marginBottom: 4 }}>Balance</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: balance > 0 ? '#1d4ed8' : balance < 0 ? '#15803d' : '#8292ac' }}>
                {balance > 0 ? `Customer owes $${balance.toLocaleString()}` : balance < 0 ? `Store owes $${Math.abs(balance).toLocaleString()}` : items.length === 0 ? '—' : 'Balanced'}
              </div>
            </div>
            <FLabel>Payment Method</FLabel>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...fld, cursor: 'pointer' }}>
              <option value="">Select payment method</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="store-credit">Store Credit</option>
              <option value="etransfer">E-Transfer</option>
            </select>
            <p style={{ color: '#8292ac', fontSize: '0.7rem', margin: '4px 0 0' }}>Default tax rate: 8.5%</p>
            <FLabel>Invoice Expiry Date</FLabel>
            <input type="date" value={invoiceExpiry} onChange={e => setInvoiceExpiry(e.target.value)} style={fld} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              <button type="button" style={btnSec}>Cancel</button>
              <button type="button" style={btnSec}>Save Invoice</button>
              <button type="button" style={{ ...btnPri, background: items.length > 0 ? '#17253d' : '#8292ac', cursor: items.length > 0 ? 'pointer' : 'default' }}>
                Complete Transaction
              </button>
            </div>
          </div>
        </div>
        </>}
      </main>
    </div>
  )
}

function ItemRow({ item, onRemove, onPriceChange, onDirChange, onCondChange }) {
  const cond    = COND_STYLE[item.condition] || COND_STYLE.NM
  const dirSty  = item.direction === 'IN'
    ? { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
    : { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e8edf5', borderRadius: 12, padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        {/* Thumbnail */}
        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#edf1fb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.image
            ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '1.3rem' }}>📦</span>
          }
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#17253d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>{item.name}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {/* Direction toggle */}
            {['IN', 'OUT'].map(d => (
              <button key={d} type="button" onClick={() => onDirChange(d)} style={{ background: item.direction === d ? dirSty.bg : '#f0f2f6', color: item.direction === d ? dirSty.color : '#8292ac', border: `1px solid ${item.direction === d ? dirSty.border : '#e8edf5'}`, fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>{d}</button>
            ))}
            {/* Condition select */}
            <select value={item.condition} onChange={e => onCondChange(e.target.value)} style={{ background: cond.bg, color: cond.color, border: `1px solid ${cond.border}`, fontSize: '0.62rem', fontWeight: 700, padding: '2px 5px', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--font-ui)', outline: 'none' }}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.68rem', color: '#8292ac', fontWeight: 700, letterSpacing: '0.06em' }}>PRICE</span>
            <input type="number" value={item.price} onChange={e => onPriceChange(e.target.value)} style={{ width: 70, border: '1.5px solid #d4dbe8', borderRadius: 7, padding: '5px 7px', fontSize: '0.86rem', fontWeight: 700, color: '#17253d', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f7f9fc', textAlign: 'right' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#17253d' }}>${item.price.toLocaleString()}</span>
            <button type="button" onClick={onRemove} style={{ background: 'none', border: 0, color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)' }}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SLabel({ children }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#8292ac', textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>
}
function FLabel({ children }) {
  return <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: '#8292ac', textTransform: 'uppercase', marginBottom: 5, marginTop: 12 }}>{children}</div>
}
function SummaryRow({ label, value, color, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e8edf5' }}>
      <span style={{ fontSize: '0.84rem', color: '#5f7294', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.98rem', color, background: bg, padding: '2px 10px', borderRadius: 6 }}>{value}</span>
    </div>
  )
}

const panel  = { background: '#fff', borderRadius: 16, padding: '18px', border: '1px solid #dde3ef' }
const fld    = { width: '100%', border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '9px 12px', fontSize: '0.86rem', color: '#17253d', outline: 'none', fontFamily: 'var(--font-ui)', background: '#f7f9fc', boxSizing: 'border-box', display: 'block' }
const btnSec = { border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '10px', background: '#fff', color: '#17253d', fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'center' }
const btnPri = { border: 0, borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-display)', letterSpacing: '0.03em', textAlign: 'center' }
