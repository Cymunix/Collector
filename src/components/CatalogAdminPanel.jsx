import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const TABS = [
  { id: 'subcategory',  label: 'Subcategory' },
  { id: 'franchise',    label: 'Franchise' },
  { id: 'set',          label: 'Collectible Set' },
  { id: 'subset',       label: 'Collectible Subset' },
]

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(10,20,40,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' },
  panel:   { background: '#fff', borderRadius: 18, width: '100%', maxWidth: 760, padding: '28px 32px 36px', boxShadow: '0 24px 60px rgba(8,24,56,0.22)' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title:   { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#17253d', margin: 0 },
  close:   { border: 0, background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#8292ac', padding: '4px 8px', borderRadius: 8 },
  tabs:    { display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #dde3ef', paddingBottom: 0 },
  tab:     (active) => ({ padding: '9px 18px', borderRadius: '10px 10px 0 0', border: 0, background: active ? '#fff' : 'transparent', color: active ? '#17253d' : '#5f7294', fontWeight: active ? 700 : 600, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', borderBottom: active ? '2px solid #17253d' : '2px solid transparent', marginBottom: -1 }),
  section: { display: 'grid', gap: 18 },
  card:    { background: '#f7f9fc', borderRadius: 14, border: '1px solid #dde3ef', padding: '20px 22px' },
  lbl:     { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#8292ac', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 },
  fld:     { width: '100%', border: '1.5px solid #d4dbe8', borderRadius: 10, padding: '9px 12px', fontSize: '0.86rem', color: '#17253d', outline: 'none', fontFamily: 'var(--font-ui)', background: '#fff', boxSizing: 'border-box' },
  btn:     { border: 0, borderRadius: 10, padding: '10px 20px', background: '#17253d', color: '#fff', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' },
  btnSm:   { border: '1.5px solid #d4dbe8', borderRadius: 8, padding: '6px 12px', background: '#fff', color: '#17253d', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' },
  err:     { color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 },
  ok:      { color: '#15803d', fontSize: '0.82rem', fontWeight: 600 },
  list:    { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' },
  listRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: '0.84rem', color: '#17253d' },
  divider: { borderTop: '1px solid #dde3ef', margin: '4px 0' },
}

function FormRow({ label, children }) {
  return (
    <div>
      <label style={s.lbl}>{label}</label>
      {children}
    </div>
  )
}

function Feedback({ error, success }) {
  if (error) return <p style={s.err}>{error}</p>
  if (success) return <p style={s.ok}>{success}</p>
  return null
}

// ── Subcategory Tab ───────────────────────────────────────────────────────────
function SubcategoryTab({ categories }) {
  const [categoryId, setCategoryId] = useState('')
  const [name, setName]             = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [items, setItems]           = useState([])

  useEffect(() => {
    if (!categoryId) { setItems([]); return }
    supabase.from('catalog_subcategories').select('id, name').eq('category_id', categoryId).eq('is_active', true).order('name')
      .then(({ data }) => setItems(data || []))
  }, [categoryId])

  const save = async () => {
    if (!name.trim() || !categoryId) return
    setSaving(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.from('catalog_subcategories')
      .insert({ name: name.trim(), category_id: categoryId, is_active: true })
      .select('id').single()
    if (err) { setError(err.message || 'Could not create subcategory.'); setSaving(false); return }
    setItems(prev => [...prev, { id: data.id, name: name.trim() }].sort((a, b) => a.name.localeCompare(b.name)))
    setSuccess(`"${name.trim()}" created.`)
    setName('')
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={s.card}>
        <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 14px', fontSize: '0.9rem' }}>Create Subcategory</p>
        <FormRow label="Category">
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSuccess('') }} style={s.fld}>
            <option value="">Select category…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormRow>
        <div style={{ marginTop: 14 }}>
          <FormRow label="Subcategory Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pokémon" style={s.fld}
              onKeyDown={e => e.key === 'Enter' && save()} />
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || !categoryId || saving}>
            {saving ? 'Saving…' : 'Create Subcategory'}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>

      {items.length > 0 && (
        <div style={s.card}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 12px', fontSize: '0.9rem' }}>Existing Subcategories</p>
          <div style={s.list}>
            {items.map(i => <div key={i.id} style={s.listRow}>{i.name}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Franchise Tab ─────────────────────────────────────────────────────────────
function FranchiseTab() {
  const [name, setName]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [items, setItems]   = useState([])

  useEffect(() => {
    supabase.from('catalog_franchise_brands').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setItems(data || []))
  }, [])

  const save = async () => {
    if (!name.trim()) return
    setSaving(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.from('catalog_franchise_brands')
      .insert({ name: name.trim(), is_active: true })
      .select('id').single()
    if (err) { setError(err.message || 'Could not create franchise.'); setSaving(false); return }
    setItems(prev => [...prev, { id: data.id, name: name.trim() }].sort((a, b) => a.name.localeCompare(b.name)))
    setSuccess(`"${name.trim()}" created.`)
    setName('')
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={s.card}>
        <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 14px', fontSize: '0.9rem' }}>Create Franchise</p>
        <FormRow label="Franchise Name">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Pokémon Company"
            style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
        </FormRow>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Create Franchise'}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>

      {items.length > 0 && (
        <div style={s.card}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 12px', fontSize: '0.9rem' }}>Existing Franchises</p>
          <div style={s.list}>
            {items.map(i => <div key={i.id} style={s.listRow}>{i.name}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collectible Set Tab ───────────────────────────────────────────────────────
function CollectibleSetTab({ categories }) {
  const [categoryId,    setCategoryId]    = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [franchiseId,   setFranchiseId]   = useState('')
  const [name,          setName]          = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [subcategories, setSubcategories] = useState([])
  const [franchises,    setFranchises]    = useState([])
  const [items,         setItems]         = useState([])

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); setSubcategoryId(''); return }
    supabase.from('catalog_subcategories').select('id, name').eq('category_id', categoryId).eq('is_active', true).order('name')
      .then(({ data }) => setSubcategories(data || []))
  }, [categoryId])

  useEffect(() => {
    supabase.from('catalog_franchise_brands').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setFranchises(data || []))
  }, [])

  useEffect(() => {
    if (!subcategoryId) { setItems([]); return }
    supabase.from('collectible_sets').select('id, set_name').eq('subcategory_id', subcategoryId).eq('is_active', true).order('set_name')
      .then(({ data }) => setItems(data || []))
  }, [subcategoryId])

  const save = async () => {
    if (!name.trim() || !categoryId || !subcategoryId) return
    setSaving(true); setError(''); setSuccess('')
    const { data: newId, error: err } = await supabase.rpc('upsert_catalog_collectible_set', {
      p_category_id:    categoryId,
      p_subcategory_id: subcategoryId,
      p_set_name:       name.trim(),
      p_franchise_id:   franchiseId || null,
    })
    if (err) { setError(err.message || 'Could not create collectible set.'); setSaving(false); return }
    setItems(prev => [...prev, { id: newId, set_name: name.trim() }].sort((a, b) => a.set_name.localeCompare(b.set_name)))
    setSuccess(`"${name.trim()}" created.`)
    setName('')
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={s.card}>
        <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 14px', fontSize: '0.9rem' }}>Create Collectible Set</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Category">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); setSuccess('') }} style={s.fld}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Subcategory">
            <select value={subcategoryId} onChange={e => { setSubcategoryId(e.target.value); setSuccess('') }} style={s.fld} disabled={!categoryId}>
              <option value="">Select subcategory…</option>
              {subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Franchise (optional)">
            <select value={franchiseId} onChange={e => setFranchiseId(e.target.value)} style={s.fld}>
              <option value="">None</option>
              {franchises.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Set Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Scarlet & Violet" style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || !categoryId || !subcategoryId || saving}>
            {saving ? 'Saving…' : 'Create Set'}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>

      {items.length > 0 && (
        <div style={s.card}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 12px', fontSize: '0.9rem' }}>Sets in Selected Subcategory</p>
          <div style={s.list}>
            {items.map(i => <div key={i.id} style={s.listRow}>{i.set_name}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collectible Subset Tab ────────────────────────────────────────────────────
function CollectibleSubsetTab({ categories }) {
  const [categoryId,    setCategoryId]    = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [parentSetId,   setParentSetId]   = useState('')
  const [name,          setName]          = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')
  const [subcategories, setSubcategories] = useState([])
  const [parentSets,    setParentSets]    = useState([])

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); setSubcategoryId(''); return }
    supabase.from('catalog_subcategories').select('id, name').eq('category_id', categoryId).eq('is_active', true).order('name')
      .then(({ data }) => setSubcategories(data || []))
  }, [categoryId])

  useEffect(() => {
    if (!subcategoryId) { setParentSets([]); setParentSetId(''); return }
    supabase.from('collectible_sets').select('id, set_name').eq('subcategory_id', subcategoryId).eq('is_active', true).order('set_name')
      .then(({ data }) => setParentSets(data || []))
  }, [subcategoryId])

  const save = async () => {
    if (!name.trim() || !categoryId || !subcategoryId || !parentSetId) return
    setSaving(true); setError(''); setSuccess('')
    const { error: err } = await supabase.from('collectible_sets').insert({
      set_name:       name.trim(),
      category_id:    categoryId,
      subcategory_id: subcategoryId,
      franchise_id:   parentSetId,
      is_active:      true,
    })
    if (err) { setError(err.message || 'Could not create subset.'); setSaving(false); return }
    setSuccess(`"${name.trim()}" created as a subset.`)
    setName('')
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={{ ...s.card, background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0 }}>
          A <strong>Collectible Subset</strong> is a child set nested under a parent Collectible Set — for example, "Base Set Unlimited" under "Base Set".
        </p>
      </div>

      <div style={s.card}>
        <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 14px', fontSize: '0.9rem' }}>Create Collectible Subset</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Category">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); setParentSetId(''); setSuccess('') }} style={s.fld}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Subcategory">
            <select value={subcategoryId} onChange={e => { setSubcategoryId(e.target.value); setParentSetId(''); setSuccess('') }} style={s.fld} disabled={!categoryId}>
              <option value="">Select subcategory…</option>
              {subcategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Parent Set">
            <select value={parentSetId} onChange={e => setParentSetId(e.target.value)} style={s.fld} disabled={!subcategoryId}>
              <option value="">Select parent set…</option>
              {parentSets.map(p => <option key={p.id} value={p.id}>{p.set_name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Subset Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Base Set Unlimited" style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || !categoryId || !subcategoryId || !parentSetId || saving}>
            {saving ? 'Saving…' : 'Create Subset'}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function CatalogAdminPanel({ categories = [], onClose }) {
  const [activeTab, setActiveTab] = useState('subcategory')

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>Manage Catalog</h2>
          <button type="button" style={s.close} onClick={onClose}>✕</button>
        </div>

        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} style={s.tab(activeTab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'subcategory' && <SubcategoryTab categories={categories} />}
        {activeTab === 'franchise'   && <FranchiseTab />}
        {activeTab === 'set'         && <CollectibleSetTab categories={categories} />}
        {activeTab === 'subset'      && <CollectibleSubsetTab categories={categories} />}
      </div>
    </div>
  )
}
