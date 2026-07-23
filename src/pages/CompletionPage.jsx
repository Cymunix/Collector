import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Completion hierarchy for Building Blocks, Toys, Sports Cards and Trading Cards ───
// Uses the full catalogue for totals and the user's collection for owned counts.
// Each category has its own taxonomy path; empty levels are skipped automatically.

const NORDVIK_COMPLETION_CATEGORY_SLOTS = [
  { slot: 1, name: 'Building Blocks', image: '/nordvik-scenes/Building_Blocks.png' },
  { slot: 2, name: 'Toys', image: '/nordvik-scenes/Toys.png' },
  { slot: 3, name: 'Placeholder', image: '/nordvik-scenes/3.png' },
  { slot: 4, name: 'Trading Cards', image: '/nordvik-scenes/Trading_Cards.png' },
  { slot: 5, name: 'Sports Cards', image: '/nordvik-scenes/Sports_Cards.png' },
  { slot: 6, name: 'Comics', image: '/nordvik-scenes/Comics.png' },
  { slot: 7, name: 'Video Games', image: '/nordvik-scenes/Video_Games.png' },
  { slot: 8, name: 'Movies', image: '/nordvik-scenes/Movies.png' },
  { slot: 9, name: 'Music', image: '/nordvik-scenes/Music.png' },
]


const nordvikSceneVariant = (value = '') => {
  let hash = 0
  const str = String(value)
  for (let i = 0; i < str.length; i += 1) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  const positions = ['15% center', '32% center', '50% center', '68% center', '85% center']
  const sizes = ['112% 112%', '120% 120%', '128% 128%', '136% 136%']
  const n = Math.abs(hash)
  return { position: positions[n % positions.length], size: sizes[n % sizes.length] }
}

const normaliseCompletionCategoryName = (value = '') =>
  String(value).trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

export default function CompletionPage({
  ownedCatalogItemIds,
  onOpenItem,
  searchQuery = '',
  filterCategory = '',
  filterSubcategory = '',
  filterFranchise = '',
  filterBrand = '',
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [path, setPath] = useState([])

  const supportedCategories = ['Building Blocks', 'Toys', 'Sports Cards', 'Trading Cards']

  const firstValue = (row, keys) => {
    for (const key of keys) {
      const value = row?.[key]
      if (Array.isArray(value)) {
        const names = value.map(v => typeof v === 'string' ? v : (v?.name || '')).filter(Boolean)
        if (names.length) return names.join(', ')
      }
      if (value && typeof value === 'object') {
        const nested = value.name || value.title || value.label || value.subcategory_name || value.franchise_name || value.product_line_name || value.series_name || value.subfranchise_name || value.property_name || value.item_type_name
        if (nested && String(nested).trim()) return String(nested).trim()
      }
      if (value && String(value).trim() && String(value).toUpperCase() !== 'N/A' && String(value) !== '[object Object]') return String(value).trim()
    }
    return ''
  }

  const configs = {
    'Building Blocks': [
      { key: 'subcategory', label: 'Subcategory', fields: ['subcategory'] },
      { key: 'franchise', label: 'Franchise', fields: ['franchise'] },
      { key: 'itemType', label: 'Item Type', fields: ['item_type'] },
    ],
    Toys: [
      { key: 'subcategory', label: 'Subcategory', fields: ['subcategory'] },
      { key: 'franchise', label: 'Franchise', fields: ['franchise'] },
      { key: 'productLine', label: 'Product Line', fields: ['product_lines'] },
      { key: 'series', label: 'Series', fields: ['series'] },
      { key: 'subfranchise', label: 'Subfranchise', fields: ['subfranchise'] },
      { key: 'property', label: 'Property', fields: ['property'] },
      { key: 'itemType', label: 'Item Type', fields: ['item_type'] },
    ],
    'Sports Cards': [
      { key: 'subcategory', label: 'Sport', fields: ['subcategory'] },
      { key: 'franchise', label: 'League / Franchise', fields: ['franchise'] },
      { key: 'manufacturer', label: 'Manufacturer', fields: ['subset', 'subfranchise', 'subtheme'] },
      { key: 'productLine', label: 'Product Line', fields: ['product_line', 'product_line_name', 'product_lines', 'collectible_set'] },
      { key: 'itemType', label: 'Item Type', fields: ['brand'] },
      { key: 'series', label: 'Series', fields: ['print_type', 'series'] },
    ],
    'Trading Cards': [
      { key: 'subcategory', label: 'Game / Type', fields: ['subcategory'] },
      { key: 'franchise', label: 'Franchise', fields: ['franchise'] },
      { key: 'manufacturer', label: 'Manufacturer', fields: ['subset', 'subfranchise', 'subtheme'] },
      { key: 'productLine', label: 'Product Line', fields: ['product_line', 'product_line_name', 'product_lines', 'collectible_set'] },
      { key: 'itemType', label: 'Item Type', fields: ['brand'] },
      { key: 'series', label: 'Series', fields: ['print_type', 'series'] },
    ],
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const { data: cats, error: catError } = await supabase
          .from('categories').select('category_id, name').in('name', supportedCategories)
        if (catError) throw catError
        const catMap = new Map((cats || []).map(x => [x.category_id, x.name]))
        const ids = [...catMap.keys()]

        const all = []
        for (let from = 0; ; from += 1000) {
          const { data, error: pageError } = await supabase
            .from('items')
            .select('item_id, name, category_id, subcategory_id, franchise_id, series_id, subset_id, brand_id')
            .in('category_id', ids).range(from, from + 999)
          if (pageError) throw pageError
          all.push(...(data || []))
          if (!data || data.length < 1000) break
        }

        const uniq = (key) => [...new Set(all.map(r => r[key]).filter(Boolean))]
        const lookup = async (table, idCol, idsToLoad) => {
          if (!idsToLoad.length) return new Map()
          const out = []
          for (let i = 0; i < idsToLoad.length; i += 500) {
            const { data, error } = await supabase.from(table).select(`${idCol}, name`).in(idCol, idsToLoad.slice(i, i + 500))
            if (error) throw error
            out.push(...(data || []))
          }
          return new Map(out.map(x => [x[idCol], x.name]))
        }

        const [subcats, franchises, seriesMap, subsets, itemTypes] = await Promise.all([
          lookup('subcategories', 'subcategory_id', uniq('subcategory_id')),
          lookup('franchises', 'franchise_id', uniq('franchise_id')),
          lookup('series', 'series_id', uniq('series_id')),
          lookup('subsets', 'subset_id', uniq('subset_id')),
          lookup('brands', 'brand_id', uniq('brand_id')),
        ])

        // Product Line is many-to-many through item_product_lines.
        const itemIds = all.map(r => r.item_id).filter(Boolean)
        const links = []
        for (let i = 0; i < itemIds.length; i += 500) {
          const { data, error } = await supabase.from('item_product_lines')
            .select('item_id, product_line_id').in('item_id', itemIds.slice(i, i + 500))
          if (error) throw error
          links.push(...(data || []))
        }
        const productLineIds = [...new Set(links.map(x => x.product_line_id).filter(Boolean))]
        const productLines = await lookup('product_lines', 'product_line_id', productLineIds)

        const propertyLinks = []
        for (let i = 0; i < itemIds.length; i += 500) {
          const { data, error } = await supabase.from('item_properties')
            .select('item_id, property_id').in('item_id', itemIds.slice(i, i + 500))
          if (error) throw error
          propertyLinks.push(...(data || []))
        }
        const propertyIds = [...new Set(propertyLinks.map(x => x.property_id).filter(Boolean))]
        const properties = await lookup('properties', 'property_id', propertyIds)
        const itemProperties = new Map()
        for (const link of propertyLinks) {
          if (!itemProperties.has(link.item_id)) itemProperties.set(link.item_id, [])
          const name = properties.get(link.property_id)
          if (name) itemProperties.get(link.item_id).push(name)
        }

        const itemProductLines = new Map()
        for (const link of links) {
          if (!itemProductLines.has(link.item_id)) itemProductLines.set(link.item_id, [])
          const name = productLines.get(link.product_line_id)
          if (name) itemProductLines.get(link.item_id).push(name)
        }

        const imageByItemId = new Map()
        for (let i = 0; i < itemIds.length; i += 500) {
          const { data: imageRows, error: imageError } = await supabase
            .from('item_details')
            .select('item_id, front_image_path')
            .in('item_id', itemIds.slice(i, i + 500))
          if (imageError) throw imageError
          for (const imageRow of (imageRows || [])) {
            if (imageRow.front_image_path) imageByItemId.set(imageRow.item_id, imageRow.front_image_path)
          }
        }

        const enriched = all.map(r => ({
          ...r,
          category: catMap.get(r.category_id) || '',
          subcategory: subcats.get(r.subcategory_id) || '',
          franchise: franchises.get(r.franchise_id) || '',
          product_lines: itemProductLines.get(r.item_id) || [],
          series: seriesMap.get(r.series_id) || '',
          subfranchise: subsets.get(r.subset_id) || '',
          property: itemProperties.get(r.item_id) || [],
          item_type: itemTypes.get(r.brand_id) || '',
          subject: r.name || '',
          front_image_path: imageByItemId.get(r.item_id) || '',
        }))
        if (!cancelled) setRows(enriched)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load completion data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const ownedSet = ownedCatalogItemIds instanceof Set ? ownedCatalogItemIds : new Set(ownedCatalogItemIds || [])
  const categoryOf = row => firstValue(row, ['category'])
  const itemName = row => firstValue(row, ['subject', 'name', 'description']) || 'Unnamed item'
  const isOwned = row => ownedSet.has(String(row.item_id)) || ownedSet.has(row.item_id)

  const normalizedCompletionSearch = String(searchQuery || '').trim().toLowerCase()
  const supportedRows = rows.filter(r => supportedCategories.includes(categoryOf(r)))
  const filteredSupportedRows = supportedRows.filter(row => {
    if (filterCategory && categoryOf(row) !== filterCategory) return false
    if (filterSubcategory && firstValue(row, ['subcategory']) !== filterSubcategory) return false
    if (filterFranchise && firstValue(row, ['franchise']) !== filterFranchise) return false
    if (filterBrand && firstValue(row, ['item_type', 'brand']) !== filterBrand) return false
    if (!normalizedCompletionSearch) return true

    const searchableValues = [
      itemName(row),
      categoryOf(row),
      firstValue(row, ['subcategory']),
      firstValue(row, ['franchise']),
      firstValue(row, ['item_type', 'brand']),
      firstValue(row, ['product_lines', 'product_line', 'product_line_name']),
      firstValue(row, ['series']),
      firstValue(row, ['subfranchise']),
      firstValue(row, ['property']),
    ]
    return searchableValues.some(value => String(value || '').toLowerCase().includes(normalizedCompletionSearch))
  })
  const ownedCategories = new Set(filteredSupportedRows.filter(isOwned).map(categoryOf))

  let scoped = filteredSupportedRows
  for (const step of path) {
    if (step.type === 'category') scoped = scoped.filter(r => categoryOf(r) === step.value)
    else scoped = scoped.filter(r => firstValue(r, step.fields) === step.value)
  }

  const currentCategory = path.find(p => p.type === 'category')?.value || ''
  const config = configs[currentCategory] || []
  const usedKeys = new Set(path.filter(p => p.type === 'level').map(p => p.key))
  const nextLevel = config.find(level => {
    if (usedKeys.has(level.key)) return false
    const values = new Set(scoped.map(r => firstValue(r, level.fields)).filter(Boolean))
    return values.size > 0
  })

  const rollup = list => {
    const unique = new Map()
    for (const row of list) if (row.item_id) unique.set(String(row.item_id), row)
    const items = [...unique.values()]
    const ownedItems = items.filter(isOwned)
    const missingItems = items.filter(row => !isOwned(row))
    const owned = ownedItems.length
    const total = items.length
    const collectedValue = ownedItems.reduce((sum, row) => sum + (Number(row.estimated_value) || 0), 0)
    const estimatedCostToComplete = missingItems.reduce((sum, row) => sum + (Number(row.estimated_value) || 0), 0)
    return { owned, total, percent: total ? (owned / total) * 100 : 0, collectedValue, estimatedCostToComplete }
  }

  const makeGroups = () => {
    if (!currentCategory) {
      return [...ownedCategories].sort().map(name => {
        const list = supportedRows.filter(r => categoryOf(r) === name)
        return { name, rows: list, step: { type: 'category', value: name } }
      })
    }
    if (!nextLevel) return []
    const map = new Map()
    for (const row of scoped) {
      const value = firstValue(row, nextLevel.fields)
      if (!value) continue
      if (!map.has(value)) map.set(value, [])
      map.get(value).push(row)
    }
    return [...map.entries()]
      .map(([name, list]) => ({
        name,
        rows: list,
        step: { type: 'level', key: nextLevel.key, label: nextLevel.label, fields: nextLevel.fields, value: name },
      }))
      .filter(g => rollup(g.rows).total > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const groups = makeGroups()
  const scopeRollup = rollup(scoped)

  if (loading) return <article className="catalog-card catalog-loading-panel">Loading completion hierarchy…</article>
  if (error) return <article className="catalog-card catalog-loading-panel">{error}</article>

  return (
    <div className="completion-main">
      <style>{`
        .completion-nav-block {
          position: relative;
          overflow: hidden;
          min-height: 240px;
          padding: 20px 20px 18px;
          border: 2px solid #9b673f;
          border-radius: 16px;
          background:
            radial-gradient(circle at 58% 52%, rgba(29,55,73,.07), transparent 28%),
            linear-gradient(145deg, #fff 0%, #f5f7f8 100%);
          box-shadow: 0 10px 24px rgba(15,35,55,.10);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .completion-nav-block:hover { transform: translateY(-3px); }
        .completion-nav-block.completion-rank-bronze {
          border-color: #a86432;
          box-shadow: 0 0 0 1px rgba(168,100,50,.18), 0 10px 25px rgba(168,100,50,.24);
        }
        .completion-nav-block.completion-rank-silver {
          border-color: #9aa3aa;
          box-shadow: 0 0 0 1px rgba(154,163,170,.22), 0 10px 25px rgba(95,105,112,.20);
        }
        .completion-nav-block.completion-rank-gold {
          border-color: #c79414;
          box-shadow: 0 0 0 1px rgba(199,148,20,.22), 0 10px 27px rgba(199,148,20,.25);
        }
        .completion-nav-block.completion-rank-platinum {
          border-color: #258ac1;
          box-shadow: 0 0 0 1px rgba(37,138,193,.22), 0 0 22px rgba(37,138,193,.30), 0 12px 28px rgba(37,138,193,.20);
        }
        .completion-nav-block-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          min-height: 112px;
          padding-right: 0;
        }
        .completion-nav-block-head strong {
          width: calc(100% - 82px);
          max-width: calc(100% - 82px);
          min-width: 0;
          padding-right: 8px;
          font-size: 19px;
          line-height: 1.12;
          overflow-wrap: break-word;
          word-break: normal;
          color: #102a49;
        }
        .completion-nav-block-pct {
          position: absolute;
          left: 20px;
          top: 104px;
          margin: 0;
          font-family: Georgia, serif;
          font-size: 48px;
          font-weight: 500;
          line-height: .95;
          color: #8b4f25;
        }
        .completion-rank-silver .completion-nav-block-pct { color: #4e5358; }
        .completion-rank-gold .completion-nav-block-pct { color: #a86d00; }
        .completion-nav-block .completion-progress,
        .completion-nav-block .completion-nav-progress,
        .completion-nav-block .progress-bar {
          margin-top: 18px;
        }
        .completion-nav-block-head + * {
          position: relative;
          z-index: 2;
        }

        .completion-viking-medallion {
          --metal: #a86432;
          --metal-light: #e3a36d;
          --metal-dark: #63351d;
          position: absolute;
          top: 12px;
          right: 14px;
          z-index: 4;
          width: 58px;
          height: 64px;
          filter: drop-shadow(0 5px 5px rgba(0,0,0,.24));
        }
        .completion-medallion-silver { --metal:#9da7b0; --metal-light:#eef2f5; --metal-dark:#515a63; }
        .completion-medallion-gold { --metal:#c68a00; --metal-light:#ffd760; --metal-dark:#765000; }
        .completion-medallion-platinum { --metal:#7fc8e8; --metal-light:#e4f8ff; --metal-dark:#245f83; }

        .completion-medallion-ring {
          position: absolute;
          inset: 6px 5px 5px;
          border: 4px double var(--metal);
          border-radius: 50%;
          background:
            radial-gradient(circle at 38% 30%, rgba(255,255,255,.28), transparent 20%),
            radial-gradient(circle, #182631 0 52%, var(--metal-dark) 53% 57%, transparent 58%);
          box-shadow: inset 0 0 0 2px var(--metal-light), 0 0 0 2px var(--metal-dark);
        }
        .completion-medallion-ring::before,
        .completion-medallion-ring::after {
          content:'';
          position:absolute;
          bottom:-7px;
          width:22px;
          height:31px;
          border:4px solid var(--metal);
          background:#17242e;
          transform:rotate(28deg);
          z-index:-1;
        }
        .completion-medallion-ring::before { left:-7px; }
        .completion-medallion-ring::after { right:-7px; transform:rotate(-28deg); }

        .completion-medallion-ship {
          position:absolute;
          inset:0;
        }
        .completion-ship-mast {
          position:absolute;
          left:50%;
          top:15px;
          width:3px;
          height:31px;
          background:var(--metal-light);
          transform:translateX(-50%);
        }
        .completion-ship-sail {
          position:absolute;
          left:23px;
          top:17px;
          width:25px;
          height:26px;
          border-left:4px solid var(--metal);
          border-bottom:4px solid var(--metal);
          border-radius:0 0 0 24px;
          transform:skewY(-16deg);
        }
        .completion-ship-hull {
          position:absolute;
          left:14px;
          bottom:13px;
          width:39px;
          height:15px;
          border:5px solid var(--metal);
          border-top:0;
          border-radius:0 0 28px 28px;
          transform:skewX(-10deg);
        }
        .completion-ship-prow {
          position:absolute;
          right:9px;
          bottom:22px;
          width:15px;
          height:25px;
          border-right:5px solid var(--metal);
          border-top:5px solid var(--metal);
          border-radius:0 18px 0 0;
          transform:rotate(-17deg);
        }
        .completion-platinum-gem {
          position:absolute;
          top:-4px;
          left:50%;
          width:18px;
          height:23px;
          background:linear-gradient(145deg,var(--metal-light),var(--metal-dark));
          border:2px solid #e8fbff;
          clip-path:polygon(50% 0,100% 42%,50% 100%,0 42%);
          transform:translateX(-50%);
          filter:drop-shadow(0 0 5px rgba(95,202,255,.8));
        }
        .completion-complete-seal {
          position:absolute;
          left:20px;
          top:100px;
          display:flex;
          align-items:center;
          justify-content:center;
          width:64px;
          height:64px;
          margin:0;
          border:5px double #258ac1;
          border-radius:50%;
          color:#17619a;
          background:rgba(255,255,255,.72);
          box-shadow:0 0 0 4px rgba(37,138,193,.10);
        }
        .completion-checkmark {
          font-size:44px;
          font-weight:700;
          line-height:1;
          transform:translateY(-2px);
        }

        .completion-nav-block .completion-progress-track {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 52px;
          height: 10px;
          border-radius: 999px;
          background: #dfe7f1;
          overflow: hidden;
        }
        .completion-nav-block .completion-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb, #22a779);
        }
        .completion-nav-block-meta {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 20px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: #63779a;
        }


        /* Completion card flex layout */
        .completion-nav-block {
          width: 100%;
          min-width: 0;
          height: 192px;
          min-height: 192px;
          box-sizing: border-box;
          padding: 18px 20px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .completion-card-top {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          min-height: 54px;
        }
        .completion-card-title {
          display: block;
          min-width: 0;
          max-width: calc(100% - 68px);
          font-size: 18px;
          line-height: 1.15;
          color: #102a49;
          overflow-wrap: break-word;
        }
        .completion-card-top .completion-viking-medallion {
          position: relative;
          top: auto;
          right: auto;
          flex: 0 0 56px;
          width: 56px;
          height: 60px;
          margin-top: -7px;
        }
        .completion-card-middle {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          min-height: 58px;
        }
        .completion-card-middle .completion-nav-block-pct {
          position: static;
          margin: 0;
          font-size: 42px;
          line-height: 1;
        }
        .completion-card-middle .completion-complete-seal {
          position: static;
          width: 54px;
          height: 54px;
          margin: 0;
          border-width: 3px;
        }
        .completion-card-middle .completion-checkmark {
          font-size: 36px;
        }
        .completion-card-bottom {
          position: relative;
          z-index: 3;
          width: 100%;
          margin-top: auto;
        }
        .completion-card-bottom .completion-progress-track {
          position: static;
          width: 100%;
          height: 8px;
          margin: 0 0 10px;
          border-radius: 999px;
          background: #d7dde5;
          overflow: hidden;
        }
        .completion-card-bottom .completion-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: #a86432;
        }
        .completion-rank-silver .completion-progress-fill { background: #94a3b8; }
        .completion-rank-gold .completion-progress-fill { background: #d4af37; }
        .completion-rank-platinum .completion-progress-fill { background: #38bdf8; }
        .completion-rank-none .completion-progress-fill { background: #64748b; }
        .completion-card-bottom .completion-nav-block-meta {
          position: static;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          font-weight: 500;
          color: #637083;
        }


        /* Final Nordvik completion cards */
        .completion-groups-grid {
          grid-template-columns: repeat(auto-fill, minmax(340px, 360px)) !important;
        }
        .completion-nav-block {
          width: 100%;
          max-width: 360px;
          height: 230px;
          min-height: 230px;
          padding: 22px 24px 20px;
          border-radius: 16px;
        }
        .completion-card-top { min-height: 88px; gap: 18px; }
        .completion-card-title {
          max-width: calc(100% - 112px);
          font-size: 23px;
          line-height: 1.08;
        }
        .completion-card-top .completion-viking-medallion {
          position: relative;
          top: auto;
          right: auto;
          width: 96px;
          height: 96px;
          flex: 0 0 96px;
          margin: -12px -7px 0 0;
          background: transparent;
          filter: none;
        }
        .completion-tier-badge-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent;
          border: 0;
          filter: drop-shadow(0 7px 7px rgba(15,23,42,.28));
        }
        .completion-card-middle { min-height: 62px; }
        .completion-card-middle .completion-nav-block-pct { font-size: 54px; }
        .completion-card-middle .completion-complete-seal {
          width: 64px;
          height: 64px;
          border-width: 4px;
        }
        .completion-card-middle .completion-checkmark { font-size: 42px; }
        .completion-card-bottom .completion-progress-track {
          height: 10px;
          margin-bottom: 11px;
        }
        .completion-card-bottom .completion-nav-block-meta { font-size: 13px; }


        /* Wider completion cards */
        .completion-groups-grid {
          grid-template-columns: repeat(auto-fill, minmax(390px, 430px)) !important;
          gap: 24px !important;
        }
        .completion-nav-block {
          width: 100% !important;
          max-width: 430px !important;
          min-width: 390px !important;
          height: 230px !important;
          min-height: 230px !important;
        }
        .completion-card-title {
          width: auto !important;
          max-width: calc(100% - 118px) !important;
          white-space: normal !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
          hyphens: none !important;
        }


        /* Responsive completion grid: prevent card overlap */
        .completion-groups-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)) !important;
          gap: 20px !important;
          width: 100% !important;
          align-items: stretch !important;
        }
        .completion-nav-block {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
          height: 230px !important;
          min-height: 230px !important;
          box-sizing: border-box !important;
        }
        .completion-card-title {
          min-width: 0 !important;
          max-width: calc(100% - 112px) !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }
        @media (max-width: 760px) {
          .completion-groups-grid {
            grid-template-columns: 1fr !important;
          }
        }


        /* Three completion cards across the available content area */
        .completion-groups-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 18px !important;
          width: 100% !important;
        }
        .completion-nav-block {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          height: 230px !important;
          min-height: 230px !important;
        }
        .completion-card-title {
          max-width: calc(100% - 100px) !important;
          font-size: 21px !important;
          overflow-wrap: normal !important;
          word-break: normal !important;
        }
        .completion-card-top .completion-viking-medallion {
          width: 82px !important;
          height: 82px !important;
          flex-basis: 82px !important;
        }
        @media (max-width: 1050px) {
          .completion-groups-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 700px) {
          .completion-groups-grid {
            grid-template-columns: 1fr !important;
          }
        }


        /* Force category completion cards into three equal columns */
        .completion-groups-grid,
        .completion-nav-grid,
        .completion-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          grid-auto-columns: minmax(0, 1fr) !important;
          gap: 18px !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .completion-groups-grid > .completion-nav-block,
        .completion-nav-grid > .completion-nav-block,
        .completion-grid > .completion-nav-block {
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 1050px) {
          .completion-groups-grid,
          .completion-nav-grid,
          .completion-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 700px) {
          .completion-groups-grid,
          .completion-nav-grid,
          .completion-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }


        /* Actual completion hierarchy grid */
        .completion-block-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 18px !important;
          width: 100% !important;
          max-width: 100% !important;
          align-items: stretch !important;
        }
        .completion-block-grid > .completion-nav-block {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 1050px) {
          .completion-block-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 700px) {
          .completion-block-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }


        .completion-nav-block.completion-rank-none {
          border-color: #d7e0ea !important;
          box-shadow: 0 8px 20px rgba(15,35,55,.08) !important;
        }


        .completion-nav-block.completion-rank-none .completion-nav-block-pct {
          color: #334155 !important;
        }
        .completion-nav-block.completion-rank-bronze .completion-nav-block-pct {
          color: #8c4a23 !important;
        }
        .completion-nav-block.completion-rank-silver .completion-nav-block-pct {
          color: #475569 !important;
        }
        .completion-nav-block.completion-rank-gold .completion-nav-block-pct {
          color: #a86d00 !important;
        }
        .completion-nav-block.completion-rank-platinum .completion-nav-block-pct {
          color: #0284c7 !important;
        }


        /* NORDVIK shared panoramic scenic background system */
        .completion-block-grid .completion-nav-block {
          position: relative !important;
          isolation: isolate;
          overflow: hidden !important;
          background: #f8fbff !important;
        }
        .completion-scenic-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          overflow: hidden;
          pointer-events: none;
          background-image:
            linear-gradient(90deg, rgba(249,252,255,.76), rgba(249,252,255,.48), rgba(249,252,255,.66)),
            linear-gradient(0deg, rgba(248,251,255,.92) 0%, rgba(248,251,255,.18) 58%, rgba(248,251,255,.38) 100%),
            var(--nordvik-scene-image);
          background-size: 100% 100%, 100% 100%, 300% 100%;
          background-position: center, center, var(--nordvik-scene-position, 50%) center;
          background-repeat: no-repeat;
          opacity: .82;
          filter: saturate(.72) contrast(.90);
        }
        .completion-card-top,
        .completion-card-middle,
        .completion-card-bottom {
          position: relative;
          z-index: 2;
        }


        /* Visible NORDVIK scenic panorama treatment */
        .completion-block-grid .completion-nav-block {
          background: #eef5fb !important;
        }
        .completion-block-grid .completion-scenic-background {
          z-index: 0 !important;
          opacity: 1 !important;
          filter: saturate(.82) contrast(.96) !important;
          background-image:
            linear-gradient(90deg, rgba(248,251,255,.40), rgba(248,251,255,.16), rgba(248,251,255,.34)),
            linear-gradient(0deg, rgba(248,251,255,.70) 0%, rgba(248,251,255,.02) 62%, rgba(248,251,255,.18) 100%),
            var(--nordvik-scene-image) !important;
        }
        .completion-block-grid .completion-card-top,
        .completion-block-grid .completion-card-middle,
        .completion-block-grid .completion-card-bottom {
          position: relative !important;
          z-index: 3 !important;
        }


        /* Inline NORDVIK panorama — no external background asset required */
        .completion-block-grid .completion-scenic-background {
          background-image:
            linear-gradient(0deg, rgba(248,251,255,.62) 0%, rgba(248,251,255,.04) 58%, rgba(248,251,255,.18) 100%),
            radial-gradient(ellipse at 18% 82%, rgba(91,124,148,.42) 0 12%, transparent 12.5%),
            radial-gradient(ellipse at 42% 76%, rgba(111,139,158,.40) 0 15%, transparent 15.5%),
            radial-gradient(ellipse at 68% 80%, rgba(86,119,143,.38) 0 13%, transparent 13.5%),
            radial-gradient(ellipse at 88% 72%, rgba(104,132,151,.38) 0 17%, transparent 17.5%),
            linear-gradient(165deg, transparent 0 42%, rgba(130,157,176,.36) 42.5% 52%, transparent 52.5%),
            linear-gradient(195deg, transparent 0 45%, rgba(105,139,162,.30) 45.5% 57%, transparent 57.5%),
            linear-gradient(180deg, #dbe9f4 0%, #edf5fa 55%, #c9dce9 56%, #e7f0f6 100%) !important;
          background-size:
            100% 100%,
            300% 100%,
            300% 100%,
            300% 100%,
            300% 100%,
            300% 100%,
            300% 100%,
            100% 100% !important;
          background-position:
            center,
            var(--nordvik-scene-position, 50%) center,
            var(--nordvik-scene-position, 50%) center,
            var(--nordvik-scene-position, 50%) center,
            var(--nordvik-scene-position, 50%) center,
            var(--nordvik-scene-position, 50%) center,
            var(--nordvik-scene-position, 50%) center,
            center !important;
          background-repeat: no-repeat !important;
          opacity: 1 !important;
          filter: none !important;
        }


        /* Final illustrated NORDVIK panorama background system */
        .completion-block-grid .completion-scenic-background {
          background-image:
            linear-gradient(0deg, rgba(248,251,255,.72) 0%, rgba(248,251,255,.08) 55%, rgba(248,251,255,.24) 100%),
            linear-gradient(90deg, rgba(248,251,255,.26), rgba(248,251,255,.08), rgba(248,251,255,.22)),
            url("/nordvik-scenes/nordvik-category-panorama.jpg") !important;
          background-repeat: no-repeat !important;
          background-size:
            100% 100%,
            100% 100%,
            calc(var(--nordvik-visible-count, 3) * 100%) 100% !important;
          background-position:
            center,
            center,
            var(--nordvik-panorama-position, 0%) center !important;
          opacity: .78 !important;
          filter: saturate(.68) contrast(.90) brightness(1.08) !important;
        }


        /* Fixed 3x3 NORDVIK category scene system */
        .completion-block-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 18px !important;
        }
        .completion-block-grid .completion-scenic-background {
          background-image:
            linear-gradient(0deg, rgba(248,251,255,.72) 0%, rgba(248,251,255,.06) 58%, rgba(248,251,255,.22) 100%),
            linear-gradient(90deg, rgba(248,251,255,.24), rgba(248,251,255,.06), rgba(248,251,255,.20)),
            var(--nordvik-card-scene) !important;
          background-size: 100% 100%, 100% 100%, cover !important;
          background-position: center, center, center !important;
          background-repeat: no-repeat !important;
          opacity: .82 !important;
          filter: saturate(.70) contrast(.92) brightness(1.06) !important;
        }
        .completion-block-grid .completion-slot-locked {
          border-color: #c8d2dc !important;
          box-shadow: 0 7px 18px rgba(15,35,55,.07) !important;
        }
        .completion-block-grid .completion-slot-locked .completion-scenic-background {
          opacity: .48 !important;
          filter: grayscale(.55) saturate(.35) contrast(.86) brightness(1.10) !important;
        }
        .completion-block-grid .completion-slot-locked .completion-nav-block-pct {
          color: #718096 !important;
        }
        .completion-block-grid .completion-placeholder-slot {
          cursor: default !important;
        }
        @media (max-width: 1050px) {
          .completion-block-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 700px) {
          .completion-block-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }


        /* Make each supplied scene image fill its card exactly */
        .completion-block-grid .completion-scenic-background {
          background-image:
            linear-gradient(0deg, rgba(248,251,255,.44) 0%, rgba(248,251,255,.01) 58%, rgba(248,251,255,.12) 100%),
            linear-gradient(90deg, rgba(248,251,255,.10), rgba(248,251,255,.01), rgba(248,251,255,.08)),
            var(--nordvik-card-scene) !important;
          background-size: 100% 100%, 100% 100%, 100% 100% !important;
          background-position: center, center, center !important;
          background-repeat: no-repeat !important;
          opacity: 1 !important;
          filter: saturate(.82) contrast(.94) brightness(1.03) !important;
        }
        .completion-block-grid .completion-slot-locked .completion-scenic-background {
          opacity: .72 !important;
          filter: grayscale(.28) saturate(.55) contrast(.90) brightness(1.06) !important;
        }


        /* Deeper hierarchy inherits the top-level category's Nordic region */
        .completion-block-grid .completion-scenic-background {
          background-size:
            100% 100%,
            100% 100%,
            var(--nordvik-scene-size, 100% 100%) !important;
          background-position:
            center,
            center,
            var(--nordvik-scene-position, center) !important;
        }


        /* Centre the 100% completion seal */
        .completion-nav-block.completion-rank-platinum .completion-card-middle {
          position: absolute !important;
          inset: 0 !important;
          z-index: 3 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none;
        }
        .completion-nav-block.completion-rank-platinum .completion-complete-seal {
          position: static !important;
          margin: 0 !important;
          width: 72px !important;
          height: 72px !important;
        }
        .completion-nav-block.completion-rank-platinum .completion-checkmark {
          font-size: 46px !important;
        }


        /* Slightly larger centred completion seal */
        .completion-nav-block.completion-rank-platinum .completion-complete-seal {
          width: 88px !important;
          height: 88px !important;
        }
        .completion-nav-block.completion-rank-platinum .completion-checkmark {
          font-size: 56px !important;
        }

        .completion-rank-platinum::after {
          content:'';
          position:absolute;
          inset:-80%;
          background:linear-gradient(115deg,transparent 45%,rgba(255,255,255,.22) 50%,transparent 55%);
          transform:translateX(-55%);
          animation:completionPlatinumShimmer 4s ease-in-out infinite;
          pointer-events:none;
        }
        @keyframes completionPlatinumShimmer {
          0%,60% { transform:translateX(-55%); }
          88%,100% { transform:translateX(55%); }
        }
      `}</style>
      {path.length > 0 && (
        <nav className="completion-breadcrumb" aria-label="Completion breadcrumb">
          <button type="button" className="completion-crumb" onClick={() => setPath([])}>All categories</button>
          {path.map((step, index) => (
            <span key={`${step.type}-${step.key || ''}-${step.value}`} style={{ display: 'contents' }}>
              <span className="completion-crumb-sep" aria-hidden="true">›</span>
              <button type="button" className={`completion-crumb${index === path.length - 1 ? ' completion-crumb-current' : ''}`} onClick={() => setPath(path.slice(0, index + 1))}>
                {step.value}
              </button>
            </span>
          ))}
        </nav>
      )}

      {currentCategory && (
        <article className="catalog-card completion-context-header">
          <div className="completion-context-header-body">
            <h3 className="completion-context-name">{path[path.length - 1]?.value || currentCategory}</h3>
            <div className="completion-context-meta">
              <span>{scopeRollup.owned} / {scopeRollup.total} collected</span>
              <span aria-hidden="true">·</span>
              <span>{scopeRollup.percent.toFixed(1)}% complete</span>
              <span aria-hidden="true">·</span>
              <span>Estimated cost to complete: ${scopeRollup.estimatedCostToComplete.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span aria-hidden="true">·</span>
              <span>Collected value: ${scopeRollup.collectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

            </div>
          </div>
          <div className="collection-allocation-bar-track completion-context-bar">
            <div className="collection-allocation-bar-fill" style={{ width: `${Math.min(scopeRollup.percent, 100)}%` }} />
          </div>
        </article>
      )}

      {groups.length > 0 ? (
        <section className="completion-block-grid">
          {(path.length === 0 ? NORDVIK_COMPLETION_CATEGORY_SLOTS : groups.map(group => ({
            slot: null,
            name: group.name,
            image: null,
            dynamicGroup: group
          }))).map(slotConfig => {
            const group = slotConfig.dynamicGroup || groups.find(g =>
              normaliseCompletionCategoryName(g.name) === normaliseCompletionCategoryName(slotConfig.name)
            )
            const isPlaceholder = path.length === 0 && slotConfig.slot === 3
            const groupRows = group?.rows || []
            const stats = group ? rollup(groupRows) : { owned: 0, total: 0, percent: 0 }
            const isLocked = stats.percent === 0
            const rootCategoryName = path.length > 0 ? path[0]?.value : slotConfig.name
            const rootSceneConfig = NORDVIK_COMPLETION_CATEGORY_SLOTS.find(slot =>
              normaliseCompletionCategoryName(slot.name) === normaliseCompletionCategoryName(rootCategoryName)
            )
            const sceneVariant = nordvikSceneVariant(group?.name || slotConfig.name)

            if (isPlaceholder && !group) {
              return (
                <div
                  key="nordvik-placeholder-slot-3"
                  className="completion-nav-block completion-rank-none completion-slot-locked completion-placeholder-slot"
                  style={{
                    '--nordvik-card-scene': slotConfig.image ? `url("${slotConfig.image}")` : 'none'
                  }}
                  aria-label="Reserved collection category"
                >
                  <div className="completion-scenic-background" aria-hidden="true" />
                  <div className="completion-card-top">
                    <strong className="completion-card-title">Coming Soon</strong>
                  </div>
                  <div className="completion-card-middle">
                    <p className="completion-nav-block-pct">—</p>
                  </div>
                  <div className="completion-card-bottom">
                    <div className="completion-progress-track"><span style={{ width: '0%' }} /></div>
                    <div className="completion-nav-block-meta">
                      <span>Reserved</span><span>Category</span>
                    </div>
                  </div>
                </div>
              )
            }

            if (!group) {
              return (
                <div
                  key={`nordvik-empty-${slotConfig.slot}`}
                  className="completion-nav-block completion-rank-none completion-slot-locked"
                  style={{ '--nordvik-card-scene': slotConfig.image ? `url("${slotConfig.image}")` : 'none' }}
                >
                  <div className="completion-scenic-background" aria-hidden="true" />
                  <div className="completion-card-top">
                    <strong className="completion-card-title">{slotConfig.name}</strong>
                  </div>
                  <div className="completion-card-middle">
                    <p className="completion-nav-block-pct">0%</p>
                  </div>
                  <div className="completion-card-bottom">
                    <div className="completion-progress-track"><span style={{ width: '0%' }} /></div>
                    <div className="completion-nav-block-meta">
                      <span>0 collected</span><span>Category</span>
                    </div>
                  </div>
                </div>
              )
            }
            const r = rollup(group.rows)
            return (
              <article
                key={`${group.step.key || group.step.type}-${group.name}`}
                className={`catalog-card completion-nav-block ${
                  r.percent >= 100 ? 'completion-rank-platinum' :
                  r.percent >= 75 ? 'completion-rank-gold' :
                  r.percent >= 50 ? 'completion-rank-silver' :
                  r.percent >= 25 ? 'completion-rank-bronze' : 'completion-rank-none'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => setPath([...path, group.step])}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPath([...path, group.step]) } }}
                style={{
                  '--nordvik-card-scene': `url("${path.length === 0 ? slotConfig.image : (rootSceneConfig?.image || slotConfig.image || '')}")`,
                  '--nordvik-scene-position': 'center',
                  '--nordvik-scene-size': '100% 100%'
                }}
              >
                <div className="completion-scenic-background" aria-hidden="true" />
                <div className="completion-card-top">
                  <strong className="completion-card-title">{group.name}</strong>
                  {r.percent >= 25 && (
                    <span
                      className={`completion-viking-medallion ${
                        r.percent >= 100 ? 'completion-medallion-platinum' :
                        r.percent >= 75 ? 'completion-medallion-gold' :
                        r.percent >= 50 ? 'completion-medallion-silver' :
                        'completion-medallion-bronze'
                      }`}
                      title={
                        r.percent >= 100 ? 'Platinum — 100% Complete' :
                        r.percent >= 75 ? 'Gold — 75–99% Complete' :
                        r.percent >= 50 ? 'Silver — 50–74% Complete' :
                        'Bronze — 25–49% Complete'
                      }
                    >
                      <img
                        className="completion-tier-badge-image"
                        src={
                          r.percent >= 100 ? '/nordvik-badges/nordvik-platinum.png' :
                          r.percent >= 75 ? '/nordvik-badges/nordvik-gold.png' :
                          r.percent >= 50 ? '/nordvik-badges/nordvik-silver.png' :
                          '/nordvik-badges/nordvik-bronze.png'
                        }
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>

                <div className="completion-card-middle">
                  {r.percent >= 100 ? (
                    <span className="completion-complete-seal" title="Collection complete" aria-label="100% complete">
                      <span className="completion-checkmark">✓</span>
                    </span>
                  ) : (
                    <span className="completion-nav-block-pct">{Math.round(r.percent)}%</span>
                  )}
                </div>

                <div className="completion-card-bottom">
                  <div className="completion-progress-track" aria-hidden="true">
                    <div className="completion-progress-fill" style={{ width: `${Math.min(100, Math.max(0, r.percent))}%` }} />
                  </div>
                  <div className="completion-nav-block-meta">
                    <span>{r.owned} of {r.total} collected</span>
                    <span>{currentCategory ? (nextLevel?.label || 'Items') : 'Category'}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : currentCategory ? (
        <div className="completion-sheet-grid">
          {[...new Map(scoped.map(row => [String(row.item_id), row])).values()]
            .sort((a, b) => itemName(a).localeCompare(itemName(b)))
            .map((row, index) => {
              const owned = isOwned(row)
              return (
                <button
                  key={row.item_id}
                  type="button"
                  className={`completion-sheet-item${owned ? ' owned' : ' missing'}`} style={{ width: '100%', minWidth: 0, height: '100%', boxSizing: 'border-box' }}
                  onClick={() => onOpenItem?.(row.item_id)}
                >
                  <span className="completion-sheet-num">{index + 1}</span>
                  <div className="completion-sheet-figure" style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {row.front_image_path ? <img src={row.front_image_path.startsWith('http') ? row.front_image_path : (supabase.storage.from('item-images').getPublicUrl(row.front_image_path).data?.publicUrl || '')} alt={itemName(row)} className="completion-sheet-img" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> : <span className="completion-sheet-silhouette">?</span>}
                  </div>
                  <div className="completion-sheet-info">
                    <strong>{itemName(row)}</strong>
                    
                  </div>
                </button>
              )
            })}
        </div>
      ) : (
        <article className="catalog-card catalog-loading-panel">
          Add an item from Building Blocks, Toys, Sports Cards or Trading Cards to see completion progress.
        </article>
      )}
    </div>
  )
}
