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
    supabase.from('subcategories').select('subcategory_id, name').eq('category_id', categoryId).order('name')
      .then(({ data }) => setItems((data || []).map(r => ({ id: r.subcategory_id, name: r.name }))))
  }, [categoryId])

  const save = async () => {
    if (!name.trim() || !categoryId) return
    setSaving(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.from('subcategories')
      .insert({ name: name.trim(), category_id: categoryId })
      .select('subcategory_id')
      .single()
    if (err) { setError(err.message || 'Could not create subcategory.'); setSaving(false); return }
    setItems(prev => [...prev, { id: data.subcategory_id, name: name.trim() }].sort((a, b) => a.name.localeCompare(b.name)))
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
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pokémon"
              style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
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
  const [editingId, setEditingId]     = useState('')   // '' = creating new
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl]         = useState('')
  const [uploading, setUploading]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [items, setItems]             = useState([])

  const loadList = () => {
    supabase.from('franchises').select('franchise_id, name, description, logo_url').order('name')
      .then(({ data, error }) => {
        if (error) console.error('franchises load error:', error)
        setItems((data || []).map(r => ({ id: r.franchise_id, name: r.name, description: r.description || '', logo_url: r.logo_url || '' })))
      })
  }
  useEffect(loadList, [])

  const resetForm = () => { setEditingId(''); setName(''); setDescription(''); setLogoUrl(''); setError(''); setSuccess('') }
  const selectForEdit = (it) => { setEditingId(it.id); setName(it.name); setDescription(it.description); setLogoUrl(it.logo_url); setError(''); setSuccess('') }

  const uploadLogo = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    const ext  = (file.name.split('.').pop() || 'png').toLowerCase()
    const path = `franchise-logos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upErr } = await supabase.storage.from('item-images').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setError(upErr.message || 'Logo upload failed.'); setUploading(false); return }
    setLogoUrl(supabase.storage.from('item-images').getPublicUrl(path).data?.publicUrl || '')
    setUploading(false)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true); setError(''); setSuccess('')
    const payload = { name: name.trim(), description: description.trim() || null, logo_url: logoUrl.trim() || null }
    if (editingId) {
      const { error: err } = await supabase.from('franchises').update(payload).eq('franchise_id', editingId)
      if (err) { console.error('franchises update error:', err); setError(err.message || 'Could not update franchise.'); setSaving(false); return }
      setSuccess(`"${payload.name}" updated.`)
    } else {
      const { data, error: err } = await supabase.from('franchises').insert(payload).select('franchise_id').single()
      if (err) { console.error('franchises insert error:', err); setError(err.message || 'Could not create franchise.'); setSaving(false); return }
      setEditingId(data.franchise_id)
      setSuccess(`"${payload.name}" created.`)
    }
    loadList()
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 14px' }}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: 0, fontSize: '0.9rem' }}>{editingId ? 'Edit Franchise' : 'Create Franchise'}</p>
          {editingId && <button type="button" style={s.btnSm} onClick={resetForm}>+ New Franchise</button>}
        </div>
        <FormRow label="Franchise Name">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NFL" style={s.fld} />
        </FormRow>
        <div style={{ marginTop: 14 }}>
          <FormRow label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description shown in the catalog Context panel…"
              style={{ ...s.fld, minHeight: 84, resize: 'vertical', fontFamily: 'var(--font-ui)' }} />
          </FormRow>
        </div>
        <div style={{ marginTop: 14 }}>
          <FormRow label="Logo / Photo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {logoUrl
                ? <img src={logoUrl} alt="Franchise logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 10, border: '1px solid #dde3ef', background: '#fff', flex: '0 0 auto' }} />
                : <div style={{ width: 60, height: 60, borderRadius: 10, border: '1px dashed #c3ccdd', background: '#fff', flex: '0 0 auto' }} />}
              <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                <label style={{ ...s.btnSm, display: 'inline-block', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Uploading…' : (logoUrl ? 'Replace image' : 'Upload image')}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }} />
                </label>
                <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="…or paste an image URL" style={{ ...s.fld, fontSize: '0.8rem' }} />
                {logoUrl && <button type="button" style={{ ...s.btnSm, justifySelf: 'start' }} onClick={() => setLogoUrl('')}>Remove image</button>}
              </div>
            </div>
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || saving || uploading}>
            {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Franchise')}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>

      {items.length > 0 && (
        <div style={s.card}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 12px', fontSize: '0.9rem' }}>Existing Franchises <span style={{ fontWeight: 500, color: '#8292ac' }}>· click to edit</span></p>
          <div style={s.list}>
            {items.map(i => (
              <button key={i.id} type="button" onClick={() => selectForEdit(i)}
                style={{ ...s.listRow, cursor: 'pointer', textAlign: 'left', gap: 10, background: editingId === i.id ? '#eef2fb' : '#fff', borderColor: editingId === i.id ? '#b9c8e8' : '#e8ecf4' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  {i.logo_url
                    ? <img src={i.logo_url} alt="" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6, border: '1px solid #e8ecf4', flex: '0 0 auto' }} />
                    : <span style={{ width: 26, height: 26, borderRadius: 6, background: '#eef2f8', flex: '0 0 auto' }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: '#8292ac', flex: '0 0 auto' }}>{i.description ? '📝' : ''}{i.logo_url ? '🖼️' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collectible Set Tab ───────────────────────────────────────────────────────
// collectible_sets: collectible_set_id, name, brand_id → brands
function CollectibleSetTab() {
  const [brandId,  setBrandId]  = useState('')
  const [name,     setName]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [brands,   setBrands]   = useState([])
  const [items,    setItems]    = useState([])

  useEffect(() => {
    supabase.from('brands').select('brand_id, name').order('name')
      .then(({ data }) => setBrands((data || []).map(r => ({ id: r.brand_id, name: r.name }))))
  }, [])

  useEffect(() => {
    supabase.from('collectible_sets').select('collectible_set_id, name').order('name')
      .then(({ data }) => setItems((data || []).map(r => ({ id: r.collectible_set_id, name: r.name }))))
  }, [])

  const save = async () => {
    if (!name.trim()) return
    setSaving(true); setError(''); setSuccess('')
    const { data, error: err } = await supabase.from('collectible_sets')
      .insert({ name: name.trim(), brand_id: brandId || null })
      .select('collectible_set_id, name')
      .single()
    if (err) { setError(err.message || 'Could not create collectible set.'); setSaving(false); return }
    setItems(prev => [...prev, { id: data.collectible_set_id, name: data.name }].sort((a, b) => a.name.localeCompare(b.name)))
    setSuccess(`"${data.name}" created.`)
    setName('')
    setSaving(false)
  }

  return (
    <div style={s.section}>
      <div style={s.card}>
        <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 14px', fontSize: '0.9rem' }}>Create Collectible Set</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormRow label="Brand (optional)">
            <select value={brandId} onChange={e => { setBrandId(e.target.value); setSuccess('') }} style={s.fld}>
              <option value="">None</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Set Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 2024 Panini Prizm" style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : 'Create Set'}
          </button>
          <Feedback error={error} success={success} />
        </div>
      </div>

      {items.length > 0 && (
        <div style={s.card}>
          <p style={{ fontWeight: 700, color: '#17253d', margin: '0 0 12px', fontSize: '0.9rem' }}>Existing Collectible Sets</p>
          <div style={s.list}>
            {items.map(i => <div key={i.id} style={s.listRow}>{i.name}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collectible Subset Tab ────────────────────────────────────────────────────
// subcollectible_sets: subcollectble_set_id (note: intentional typo), collectible_set_id, name
function CollectibleSubsetTab() {
  const [parentSetId, setParentSetId] = useState('')
  const [name,        setName]        = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [parentSets,  setParentSets]  = useState([])

  useEffect(() => {
    supabase.from('collectible_sets').select('collectible_set_id, name').order('name')
      .then(({ data }) => setParentSets((data || []).map(r => ({ id: r.collectible_set_id, name: r.name }))))
  }, [])

  const save = async () => {
    if (!name.trim() || !parentSetId) return
    setSaving(true); setError(''); setSuccess('')
    const { error: err } = await supabase.from('subcollectible_sets').insert({
      name:               name.trim(),
      collectible_set_id: parentSetId,
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
          <FormRow label="Parent Set">
            <select value={parentSetId} onChange={e => { setParentSetId(e.target.value); setSuccess('') }} style={s.fld}>
              <option value="">Select parent set…</option>
              {parentSets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormRow>
          <FormRow label="Subset Name">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Base Set Unlimited" style={s.fld} onKeyDown={e => e.key === 'Enter' && save()} />
          </FormRow>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" style={s.btn} onClick={save} disabled={!name.trim() || !parentSetId || saving}>
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
        {activeTab === 'set'         && <CollectibleSetTab />}
        {activeTab === 'subset'      && <CollectibleSubsetTab />}
      </div>
    </div>
  )
}
