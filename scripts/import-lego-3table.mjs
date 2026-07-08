#!/usr/bin/env node
// scripts/import-lego-3table.mjs
// Three-table LEGO importer: Sets · Minifigs · Set↔Minifig links.
//
// Imports THREE files, in this ORDER (required by the FKs):
//   1. --sets      sets.csv        (depends on nothing)
//   2. --minifigs  minifigs.csv    (depends on nothing; duplicates collapse here)
//   3. --links     set_minifigs.csv (both sides must already exist)
//
// The core fix this implements: minifigs and sets are INDEPENDENT item rows,
// connected by the set_minifigs many-to-many join. The same minifig appearing
// in N sets is ONE minifig row + N join rows — never N minifig copies. A join
// row NEVER creates a minifig; it only references figs/sets already imported
// (in an earlier pass OR an earlier run — resolution hits the whole DB).
//
// Identity / dedupe keys
//   Sets    → (lego_set_number + name)  natural key. Same number + different
//             name = distinct release (multi-variant sets are NOT collapsed).
//   Minifigs→ rebrickable fig-num. Unique-where-present; a minifig exists
//             independently of any set. (Internal PK is item_id — the join
//             references THAT, so changing an external code breaks no links.)
//
// CSV columns (header names are matched case-insensitively; extra columns ignored)
//   sets.csv     : category, subcategory, franchise, brand, collectible_set,
//                  subject_name, set_number, release_year, piece_count,
//                  factions, description, image_url
//   minifigs.csv : category, subcategory, franchise, brand, subject_name,
//                  description, factions, species, rebrickable_id, image_url
//   set_minifigs : set_number, rebrickable_id, quantity
//
// Run:
//   node scripts/import-lego-3table.mjs --sets sets.csv --minifigs minifigs.csv --links set_minifigs.csv [--dry-run]
//   (any subset of --sets/--minifigs/--links may be supplied; whichever are
//    given run in sets→minifigs→links order.)

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(`--${n}`)
const arg  = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined }
const DRY_RUN   = flag('dry-run')
const setsFile  = arg('sets')
const figsFile  = arg('minifigs')
const linksFile = arg('links')

if (!setsFile && !figsFile && !linksFile) {
  console.error('Usage: node scripts/import-lego-3table.mjs --sets sets.csv --minifigs minifigs.csv --links set_minifigs.csv [--dry-run]')
  process.exit(1)
}

// ── Env / client ─────────────────────────────────────────────────────────────
const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env    = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL    || env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL) { console.error('VITE_SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_KEY not set (needed to bypass RLS)'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (DRY_RUN) console.log('DRY RUN — no writes will be made.\n')

// ── CSV parsing (quoted-field aware) ─────────────────────────────────────────
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []
  const parseRow = (line) => {
    const out = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { out.push(cur.trim()); cur = '' }
      else cur += ch
    }
    out.push(cur.trim())
    return out
  }
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  const idx = (...names) => { for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i } return -1 }
  const rows = []
  for (const [i, line] of lines.slice(1).entries()) {
    if (!line.trim()) continue
    const f = parseRow(line)
    rows.push({ _line: i + 2, get: (...names) => { const c = idx(...names); return c >= 0 ? (f[c] || '').trim() : '' } })
  }
  return rows
}

const clean   = (s) => (s || '').trim()
const norm    = (s) => clean(s).toLowerCase()
const toInt   = (s) => { const n = parseInt(clean(s), 10); return Number.isFinite(n) ? n : null }
const splitMulti = (s) => clean(s).split(/[,;]/).map(x => x.trim()).filter(Boolean)

// ── Caches ───────────────────────────────────────────────────────────────────
const cache = {
  category:   new Map(),  // name_lc → id
  subcat:     new Map(),  // cat::name_lc → id
  franchise:  new Map(),  // name_lc → id
  brand:      new Map(),  // fid::name_lc → id
  colset:     new Map(),  // fid::bid::name_lc → id
  subject:    new Map(),  // type::name_lc → id
  species:    new Map(),  // name_lc → id
  team:       new Map(),  // fid::name_lc → id
}

// ── Taxonomy resolvers ───────────────────────────────────────────────────────
async function resolveCategory(name) {
  const k = norm(name); if (!k) return null
  if (cache.category.has(k)) return cache.category.get(k)
  const { data } = await supabase.from('categories').select('category_id').ilike('name', name).limit(1).maybeSingle()
  const id = data?.category_id || null
  if (id) cache.category.set(k, id)
  return id
}
async function resolveSubcategory(name, categoryId) {
  const k = `${categoryId}::${norm(name)}`; if (!norm(name) || !categoryId) return null
  if (cache.subcat.has(k)) return cache.subcat.get(k)
  const { data } = await supabase.from('subcategories').select('subcategory_id').ilike('name', name).eq('category_id', categoryId).limit(1).maybeSingle()
  const id = data?.subcategory_id || null
  if (id) cache.subcat.set(k, id)
  return id
}
async function resolveFranchise(name, subcategoryId) {
  const k = norm(name); if (!k) return null
  if (cache.franchise.has(k)) return cache.franchise.get(k)
  const { data: found } = await supabase.from('franchises').select('franchise_id').ilike('name', name).limit(1).maybeSingle()
  let id = found?.franchise_id || null
  if (!id && !DRY_RUN) {
    const { data: created } = await supabase.from('franchises').insert({ name }).select('franchise_id').single()
    id = created?.franchise_id || null
  }
  if (id && subcategoryId && !DRY_RUN)
    await supabase.from('franchise_subcategory').upsert({ franchise_id: id, subcategory_id: subcategoryId }, { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true })
  const val = id || `dry:franchise:${k}`
  cache.franchise.set(k, val)
  return val
}
async function resolveBrand(name, franchiseId) {
  const k = `${franchiseId}::${norm(name)}`; if (!norm(name)) return null
  if (cache.brand.has(k)) return cache.brand.get(k)
  const isReal = franchiseId && !String(franchiseId).startsWith('dry:')
  let id = null
  if (isReal) {
    const { data: bf } = await supabase.from('brand_franchise').select('brand_id').eq('franchise_id', franchiseId)
    const linked = (bf || []).map(r => r.brand_id)
    if (linked.length) {
      const { data: found } = await supabase.from('brands').select('brand_id').ilike('name', name).in('brand_id', linked).limit(1).maybeSingle()
      id = found?.brand_id || null
    }
  }
  if (!id) {
    const { data: any } = await supabase.from('brands').select('brand_id').ilike('name', name).limit(1).maybeSingle()
    id = any?.brand_id || null
    if (!id && !DRY_RUN) {
      const { data: created } = await supabase.from('brands').insert({ name }).select('brand_id').single()
      id = created?.brand_id || null
    }
    if (id && isReal && !DRY_RUN)
      await supabase.from('brand_franchise').upsert({ brand_id: id, franchise_id: franchiseId }, { onConflict: 'brand_id,franchise_id', ignoreDuplicates: true })
  }
  const val = id || `dry:brand:${k}`
  cache.brand.set(k, val)
  return val
}
async function resolveCollectibleSet(name, franchiseId, brandId) {
  if (!norm(name)) return null
  const k = `${franchiseId}::${brandId}::${norm(name)}`
  if (cache.colset.has(k)) return cache.colset.get(k)
  let q = supabase.from('collectible_sets').select('collectible_set_id').ilike('name', name)
  if (brandId && !String(brandId).startsWith('dry:')) q = q.eq('brand_id', brandId)
  else if (franchiseId && !String(franchiseId).startsWith('dry:')) q = q.eq('franchise_id', franchiseId)
  const { data: found } = await q.limit(1).maybeSingle()
  let id = found?.collectible_set_id || null
  if (!id && !DRY_RUN) {
    const { data: created } = await supabase.from('collectible_sets').insert({
      name,
      brand_id:     (brandId     && !String(brandId).startsWith('dry:'))     ? brandId     : null,
      franchise_id: (franchiseId && !String(franchiseId).startsWith('dry:')) ? franchiseId : null,
    }).select('collectible_set_id').single()
    id = created?.collectible_set_id || null
  }
  const val = id || `dry:colset:${k}`
  cache.colset.set(k, val)
  return val
}
async function resolveSpecies(name) {
  const k = norm(name); if (!k) return null
  if (cache.species.has(k)) return cache.species.get(k)
  const { data: found } = await supabase.from('species').select('species_id').ilike('name', name).limit(1).maybeSingle()
  let id = found?.species_id || null
  if (!id && !DRY_RUN) {
    // Species are global (franchise_id nullable). Create on demand.
    const { data: created } = await supabase.from('species').insert({ name, franchise_id: null }).select('species_id').single()
    id = created?.species_id || null
  }
  if (id) cache.species.set(k, id)
  return id
}
async function resolveSubject(name, type, franchiseId, speciesId) {
  const k = `${type}::${norm(name)}`; if (!norm(name)) return null
  if (cache.subject.has(k)) return cache.subject.get(k)
  const { data: found } = await supabase.from('subjects').select('subject_id, species_id').ilike('subject_name', name).eq('subject_type', type).limit(1).maybeSingle()
  let id = found?.subject_id || null
  if (!id && !DRY_RUN) {
    const { data: created } = await supabase.from('subjects')
      .insert({ subject_name: name, subject_type: type, species_id: speciesId || null })
      .select('subject_id').single()
    id = created?.subject_id || null
  } else if (id && speciesId && !found?.species_id && !DRY_RUN) {
    await supabase.from('subjects').update({ species_id: speciesId }).eq('subject_id', id)
  }
  if (id && franchiseId && !String(franchiseId).startsWith('dry:') && !DRY_RUN)
    await supabase.from('subject_franchise').upsert({ subject_id: id, franchise_id: franchiseId }, { onConflict: 'subject_id,franchise_id', ignoreDuplicates: true })
  const val = id || `dry:subject:${k}`
  cache.subject.set(k, val)
  return val
}
async function resolveTeam(name, franchiseId) {
  if (!norm(name)) return null
  const isReal = franchiseId && !String(franchiseId).startsWith('dry:')
  const k = `${franchiseId}::${norm(name)}`
  if (cache.team.has(k)) return cache.team.get(k)
  let id = null
  if (isReal) {
    const { data: found } = await supabase.from('teams').select('team_id').ilike('name', name).eq('franchise_id', franchiseId).limit(1).maybeSingle()
    id = found?.team_id || null
    if (!id && !DRY_RUN) {
      const { data: created } = await supabase.from('teams').insert({ name, franchise_id: franchiseId }).select('team_id').single()
      id = created?.team_id || null
    }
  }
  if (id) cache.team.set(k, id)
  return id
}

// ── Shared taxonomy resolution for a row (sets + minifigs) ───────────────────
async function resolveHierarchy(row, defaultBrand) {
  const categoryName    = row.get('category')          || 'Building Blocks'
  const subcategoryName = row.get('subcategory')       || 'LEGO'
  const franchiseName   = row.get('franchise', 'theme') || 'Unknown'
  const brandName       = row.get('brand', 'brand_name') || defaultBrand
  const colSetName      = row.get('collectible_set', 'collectible_set_name', 'subtheme')

  const categoryId    = await resolveCategory(categoryName)
  const subcategoryId = categoryId ? await resolveSubcategory(subcategoryName, categoryId) : null
  const franchiseId   = await resolveFranchise(franchiseName, subcategoryId)
  const brandId       = await resolveBrand(brandName, franchiseId)
  const collectibleSetId = colSetName ? await resolveCollectibleSet(colSetName, franchiseId, brandId) : null
  return { categoryId, subcategoryId, franchiseId, brandId, collectibleSetId, franchiseName }
}
const realId = (v) => (v && !String(v).startsWith('dry:')) ? v : null

async function attachTeams(itemId, factionsRaw, franchiseId) {
  const names = splitMulti(factionsRaw)
  if (!names.length || DRY_RUN || !realId(itemId)) return
  for (const n of names) {
    const teamId = await resolveTeam(n, franchiseId)
    if (teamId) await supabase.from('item_teams').upsert({ item_id: itemId, team_id: teamId }, { onConflict: 'item_id,team_id', ignoreDuplicates: true })
  }
}
async function linkSubject(itemId, subjectId) {
  if (DRY_RUN || !realId(itemId) || !realId(subjectId)) return
  await supabase.from('item_subjects').upsert({ item_id: itemId, subject_id: subjectId }, { onConflict: 'item_id,subject_id', ignoreDuplicates: true })
}

// ── Stats / review ───────────────────────────────────────────────────────────
const stats = { setsNew: 0, setsMatched: 0, figsNew: 0, figsMatched: 0, linksUpserted: 0 }
const unresolved = []   // { file, line, key, reason }

// Maps for cross-pass resolution (also fall back to DB lookups)
const setIdBySetNumber = new Map()   // set_number → [item_id, …]  (variants share number)
const figIdByFigNum    = new Map()   // fig-num    → item_id

// ═══════════════════════════════════════════════════════════════════════════
// PASS 1 — SETS
// ═══════════════════════════════════════════════════════════════════════════
async function importSets(rows) {
  console.log(`\n── Pass 1: Sets (${rows.length} rows) ──────────────────────────`)
  for (const row of rows) {
    const name      = row.get('subject_name', 'set_name', 'name', 'description')
    const setNumber = row.get('set_number', 'lego_set_number', 'set_num')
    if (!setNumber && !name) { unresolved.push({ file: 'sets', line: row._line, key: '(blank)', reason: 'row has neither set_number nor name' }); continue }

    const h = await resolveHierarchy(row, 'Sets')

    // Natural key: (lego_set_number + lower(name)). Variants keep distinct names.
    let existing = null
    if (realId(h.brandId)) {
      let q = supabase.from('items').select('item_id').eq('brand_id', h.brandId)
      q = setNumber ? q.eq('lego_set_number', setNumber) : q.is('lego_set_number', null)
      const { data: candidates } = await q.ilike('description', name || '')
      existing = candidates?.[0] || null
    }

    const releaseYear = toInt(row.get('release_year', 'year'))
    const pieceCount  = toInt(row.get('piece_count', 'pieces'))
    const imageUrl    = row.get('image_url', 'image', 'photo_url')
    const description = name

    let setItemId
    if (existing) {
      setItemId = existing.item_id
      stats.setsMatched++
      console.log(`  = matched  ${(setNumber || '–').padEnd(10)} "${name}"`)
    } else if (DRY_RUN) {
      setItemId = `dry:set:${setNumber}:${norm(name)}`
      stats.setsNew++
      console.log(`  + [dry]    ${(setNumber || '–').padEnd(10)} "${name}"`)
    } else {
      const attributes = imageUrl ? { source_image_url: imageUrl } : {}
      const { data: created, error } = await supabase.from('items').insert({
        category_id:        realId(h.categoryId),
        subcategory_id:     realId(h.subcategoryId),
        franchise_id:       realId(h.franchiseId),
        brand_id:           realId(h.brandId),
        collectible_set_id: realId(h.collectibleSetId),
        lego_set_number:    setNumber || null,
        description,
        release_year:       releaseYear,
        piece_count:        pieceCount,
        attributes,
      }).select('item_id').single()
      if (error) { unresolved.push({ file: 'sets', line: row._line, key: setNumber || name, reason: `create failed: ${error.message}` }); continue }
      setItemId = created.item_id
      stats.setsNew++
      console.log(`  + created  ${(setNumber || '–').padEnd(10)} "${name}"`)
      // A set's own name is its Subject (subject_type 'set').
      const subjectId = await resolveSubject(name, 'set', h.franchiseId, null)
      if (realId(subjectId)) { await supabase.from('items').update({ subject_id: subjectId }).eq('item_id', setItemId); await linkSubject(setItemId, subjectId) }
      await attachTeams(setItemId, row.get('factions', 'faction', 'teams'), h.franchiseId)
    }
    if (setNumber) {
      const arr = setIdBySetNumber.get(setNumber) || []
      if (!arr.includes(setItemId)) arr.push(setItemId)
      setIdBySetNumber.set(setNumber, arr)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 2 — MINIFIGS  (dedupe by fig-num)
// ═══════════════════════════════════════════════════════════════════════════
async function importMinifigs(rows) {
  console.log(`\n── Pass 2: Minifigs (${rows.length} rows) ──────────────────────`)
  for (const row of rows) {
    const charName = row.get('subject_name', 'name', 'minifig_name', 'character')
    const figNum   = row.get('rebrickable_id', 'rebrickable_fig_id', 'fig_num', 'rb_id')
    if (!charName && !figNum) { unresolved.push({ file: 'minifigs', line: row._line, key: '(blank)', reason: 'row has neither name nor rebrickable_id' }); continue }

    // Dedupe key = fig-num. Match against the whole DB, not just this file.
    let existingId = figNum ? figIdByFigNum.get(figNum) : null
    if (!existingId && figNum) {
      const { data } = await supabase.from('items').select('item_id').eq('rebrickable_fig_id', figNum).limit(1).maybeSingle()
      existingId = data?.item_id || null
    }

    const h = await resolveHierarchy(row, 'Minifigures')
    const speciesId = await resolveSpecies(row.get('species'))
    const subjectId = await resolveSubject(charName, 'character', h.franchiseId, speciesId)

    if (existingId) {
      stats.figsMatched++
      figIdByFigNum.set(figNum, existingId)
      console.log(`  = matched  ${(figNum || '–').padEnd(14)} "${charName}"`)
      // Ensure subject/species/team links exist even on a matched fig.
      if (realId(subjectId)) { await linkSubject(existingId, subjectId); if (!DRY_RUN) await supabase.from('items').update({ subject_id: subjectId }).eq('item_id', existingId).is('subject_id', null) }
      await attachTeams(existingId, row.get('factions', 'faction', 'teams'), h.franchiseId)
      continue
    }

    if (DRY_RUN) {
      const id = `dry:fig:${figNum || norm(charName)}`
      if (figNum) figIdByFigNum.set(figNum, id)
      stats.figsNew++
      console.log(`  + [dry]    ${(figNum || '–').padEnd(14)} "${charName}"`)
      continue
    }

    const imageUrl = row.get('image_url', 'image', 'photo_url')
    const { data: created, error } = await supabase.from('items').insert({
      category_id:        realId(h.categoryId),
      subcategory_id:     realId(h.subcategoryId),
      franchise_id:       realId(h.franchiseId),
      brand_id:           realId(h.brandId),
      collectible_set_id: realId(h.collectibleSetId),
      subject_id:         realId(subjectId),
      rebrickable_fig_id: figNum || null,
      description:        row.get('description') || charName || null,
      attributes:         imageUrl ? { source_image_url: imageUrl } : {},
    }).select('item_id').single()
    if (error) { unresolved.push({ file: 'minifigs', line: row._line, key: figNum || charName, reason: `create failed: ${error.message}` }); continue }
    stats.figsNew++
    if (figNum) figIdByFigNum.set(figNum, created.item_id)
    console.log(`  + created  ${(figNum || '–').padEnd(14)} "${charName}"`)
    await linkSubject(created.item_id, subjectId)
    await attachTeams(created.item_id, row.get('factions', 'faction', 'teams'), h.franchiseId)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 3 — LINKS  (never creates items; resolves both sides against the DB)
// ═══════════════════════════════════════════════════════════════════════════
async function resolveSetIds(setNumber) {
  if (setIdBySetNumber.has(setNumber)) return setIdBySetNumber.get(setNumber)
  const { data } = await supabase.from('items').select('item_id').eq('lego_set_number', setNumber)
  const ids = (data || []).map(r => r.item_id)
  setIdBySetNumber.set(setNumber, ids)
  return ids
}
async function resolveFigId(figNum) {
  if (figIdByFigNum.has(figNum)) return figIdByFigNum.get(figNum)
  const { data } = await supabase.from('items').select('item_id').eq('rebrickable_fig_id', figNum).limit(1).maybeSingle()
  const id = data?.item_id || null
  if (id) figIdByFigNum.set(figNum, id)
  return id
}
async function importLinks(rows) {
  console.log(`\n── Pass 3: Set↔Minifig links (${rows.length} rows) ─────────────`)
  for (const row of rows) {
    const setNumber = row.get('set_number', 'lego_set_number', 'set_num')
    const figNum    = row.get('rebrickable_id', 'rebrickable_fig_id', 'fig_num')
    const quantity  = toInt(row.get('quantity', 'qty', 'count')) || 1
    if (!setNumber || !figNum) { unresolved.push({ file: 'links', line: row._line, key: `${setNumber}/${figNum}`, reason: 'missing set_number or rebrickable_id' }); continue }

    const setIds = await resolveSetIds(setNumber)
    if (!setIds.length) { unresolved.push({ file: 'links', line: row._line, key: setNumber, reason: `set_number "${setNumber}" not found — import it in sets.csv first` }); continue }
    const figId = await resolveFigId(figNum)
    if (!figId) { unresolved.push({ file: 'links', line: row._line, key: figNum, reason: `fig-num "${figNum}" not found — import it in minifigs.csv first` }); continue }

    if (setIds.length > 1)
      console.log(`  ! set_number ${setNumber} has ${setIds.length} variants — linking fig to all`)

    for (const setId of setIds) {
      if (DRY_RUN || String(setId).startsWith('dry:') || String(figId).startsWith('dry:')) {
        console.log(`  ↔ [dry]  ${setNumber} → ${figNum}  ×${quantity}`)
        stats.linksUpserted++
        continue
      }
      const { error } = await supabase.from('set_minifigs').upsert(
        { set_item_id: setId, minifig_item_id: figId, quantity },
        { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: false }
      )
      if (error) unresolved.push({ file: 'links', line: row._line, key: `${setNumber}/${figNum}`, reason: `link upsert failed: ${error.message}` })
      else { console.log(`  ↔ linked ${(setNumber).padEnd(10)} → ${figNum}  ×${quantity}`); stats.linksUpserted++ }
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (setsFile)  await importSets(parseCsv(fs.readFileSync(path.resolve(setsFile), 'utf8')))
if (figsFile)  await importMinifigs(parseCsv(fs.readFileSync(path.resolve(figsFile), 'utf8')))
if (linksFile) await importLinks(parseCsv(fs.readFileSync(path.resolve(linksFile), 'utf8')))

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`
══════════════════════════════════════════════════════
  Import summary${DRY_RUN ? ' (DRY RUN)' : ''}
──────────────────────────────────────────────────────
  Sets     : ${stats.setsNew} new, ${stats.setsMatched} matched existing
  Minifigs : ${stats.figsNew} new, ${stats.figsMatched} matched existing
  Links    : ${stats.linksUpserted} upserted
  Unresolved: ${unresolved.length} row(s)`)
if (unresolved.length) {
  console.log(`\n  UNRESOLVED — review, never silently dropped:`)
  for (const u of unresolved) console.log(`    [${u.file}:${String(u.line).padStart(4)}] ${u.key} — ${u.reason}`)
}
console.log(`══════════════════════════════════════════════════════`)
process.exit(unresolved.length ? 2 : 0)
