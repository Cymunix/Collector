#!/usr/bin/env node
// scripts/import-lego-set-minifigs.mjs
// Two-pass LEGO set ↔ minifig importer.
//
// PASS 1 — upsert every set and minifig item by its natural key.
//   Sets    → keyed by bricklink_id (set number, e.g. "75357-1")
//   Minifigs → keyed by bricklink_id when present (e.g. "sw1308");
//             when absent, keyed by LOWER(name)+collectible_set_id so codeless
//             figs stay distinct rather than collapsing or duplicating.
//
// PASS 2 — for each minifig row, resolve its parent_set (from the current
//   file's in-memory map OR a live DB lookup for cross-file imports), then
//   upsert the set_minifigs link.  Rows whose parent set cannot be resolved
//   are collected and printed as "UNRESOLVED" at the end.
//
// Supported CSV formats
// ──────────────────────
// Format A — type-discriminated (preferred):
//   type,bricklink_id,name,parent_set,quantity
//   set,75357-1,Ghost & Phantom II,,
//   minifig,sw1308,C1-10P (Chopper),75357-1,1
//   minifig,,Unlisted Trooper,75357-1,2        ← codeless: quantity=2
//   set,75416-1,Ahsoka's Shuttle,,
//   minifig,sw1308,C1-10P (Chopper),75416-1,1  ← same fig, second set
//
// Format B — flat join (backward-compatible with earlier exports):
//   set_bricklink_id,set_name,minifig_bricklink_id,minifig_name,quantity
//   75357-1,Ghost & Phantom II,sw1308,C1-10P (Chopper),1
//
// Run:
//   node scripts/import-lego-set-minifigs.mjs \
//     --file data/ahsoka.csv         \
//     --franchise-id      <uuid>     \
//     --set-brand-id      <uuid>     \
//     --minifig-brand-id  <uuid>     \
//     --collectible-set-id <uuid>    \
//     --category-id       <uuid>     \
//     --subcategory-id    <uuid>     \
//     [--dry-run]
//
// Tip: look up the required IDs in the CollectorsHub admin panel or by
//   querying Supabase: SELECT brand_id, name FROM brands;

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// ── CLI args ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const arg  = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined }

const DRY_RUN = flag('dry-run')

const csvFile          = arg('file')
const franchiseId      = arg('franchise-id')
const setBrandId       = arg('set-brand-id')
const minifigBrandId   = arg('minifig-brand-id')
const collectibleSetId = arg('collectible-set-id')
const categoryId       = arg('category-id')
const subcategoryId    = arg('subcategory-id')

const missing = [
  !csvFile          && '--file',
  !franchiseId      && '--franchise-id',
  !setBrandId       && '--set-brand-id',
  !minifigBrandId   && '--minifig-brand-id',
  !collectibleSetId && '--collectible-set-id',
  !categoryId       && '--category-id',
  !subcategoryId    && '--subcategory-id',
].filter(Boolean)

if (missing.length) {
  console.error(`Missing required arguments: ${missing.join(', ')}`)
  console.error('Run with --help for usage.')
  process.exit(1)
}

// ── Supabase ───────────────────────────────────────────────────────────────
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

// ── CSV parser ─────────────────────────────────────────────────────────────
function parseCsvLine(line) {
  const fields = []; let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
    else cur += ch
  }
  fields.push(cur.trim())
  return fields
}

function parseFile(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  const col = (...names) => { for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i } return -1 }

  // Detect format
  const isFormatA = headers.includes('type') && headers.includes('parent_set')
  const isFormatB = headers.includes('set_bricklink_id') && headers.includes('minifig_bricklink_id')

  if (!isFormatA && !isFormatB) {
    console.error(`Unrecognised CSV format. Expected header columns:`)
    console.error(`  Format A: type, bricklink_id, name, parent_set, quantity`)
    console.error(`  Format B: set_bricklink_id, set_name, minifig_bricklink_id, minifig_name, quantity`)
    process.exit(1)
  }

  // Format A indices
  const iType   = col('type')
  const iBlId   = col('bricklink_id', 'bl_id', 'fig_id', 'set_number')
  const iName   = col('name', 'description')
  const iParent = col('parent_set', 'parent_set_number', 'set_number_ref')
  const iQtyA   = col('quantity', 'qty', 'count')

  // Format B indices
  const iSetBl   = col('set_bricklink_id', 'set_bl_id')
  const iSetName = col('set_name', 'set_description')
  const iFigBl   = col('minifig_bricklink_id', 'minifig_bl_id', 'minifig_code')
  const iFigName = col('minifig_name', 'minifig_description')
  const iQtyB    = col('quantity', 'qty', 'count')

  const rows = []
  for (const [lineIdx, line] of lines.slice(1).entries()) {
    if (!line.trim()) continue
    const f = parseCsvLine(line)
    const g = (i) => (i >= 0 && f[i] ? f[i].trim() : '')

    if (isFormatA) {
      const type = g(iType).toLowerCase()
      if (type !== 'set' && type !== 'minifig') continue
      rows.push({
        type,
        bricklink_id: g(iBlId)  || null,
        name:         g(iName)  || null,
        parent_set:   g(iParent) || null,
        quantity:     parseInt(g(iQtyA), 10) || 1,
        _line:        lineIdx + 2,
      })
    } else {
      // Format B — convert to two rows (set + minifig)
      const setBl  = g(iSetBl)
      const figBl  = g(iFigBl)
      if (!setBl || !figBl) continue
      rows.push({ type: 'set',     bricklink_id: setBl,  name: g(iSetName) || setBl, parent_set: null, quantity: 1,                        _line: lineIdx + 2 })
      rows.push({ type: 'minifig', bricklink_id: figBl,  name: g(iFigName) || figBl, parent_set: setBl, quantity: parseInt(g(iQtyB), 10) || 1, _line: lineIdx + 2 })
    }
  }
  return rows
}

// ── Codeless minifig fallback key ──────────────────────────────────────────
// When a minifig has no BrickLink code, use name+collectible_set_id as a
// stable local key so it stays distinct across re-uploads.
function codelessKey(name) {
  return `__CODELESS__::${(name || '').trim().toLowerCase()}::${collectibleSetId}`
}

// ── Item resolution helpers ────────────────────────────────────────────────
const setIdByBlId     = new Map()   // set bricklink_id → item_id
const figIdByBlId     = new Map()   // minifig bricklink_id → item_id
const figIdByFallback = new Map()   // codeless key → item_id

// Stats
const stats = {
  setsNew: 0, setsMatched: 0,
  figsNew: 0, figsMatched: 0,
  linksUpserted: 0,
  unresolved: [],
}

let dryRunCounter = 0
function dryId() { return `dry:${++dryRunCounter}` }

async function resolveSet(blId, name) {
  if (!blId) return null
  if (setIdByBlId.has(blId)) return setIdByBlId.get(blId)

  // DB lookup — may have been imported in a previous file run
  const { data: existing } = await supabase
    .from('items')
    .select('item_id')
    .eq('bricklink_id', blId)
    .maybeSingle()

  if (existing) {
    setIdByBlId.set(blId, existing.item_id)
    stats.setsMatched++
    return existing.item_id
  }

  // Create
  if (DRY_RUN) {
    const id = dryId()
    setIdByBlId.set(blId, id)
    stats.setsNew++
    return id
  }
  const { data: created, error } = await supabase
    .from('items')
    .insert({
      category_id:        categoryId,
      subcategory_id:     subcategoryId,
      franchise_id:       franchiseId,
      brand_id:           setBrandId,
      collectible_set_id: collectibleSetId,
      bricklink_id:       blId,
      description:        name || blId,
    })
    .select('item_id')
    .single()
  if (error) { console.error(`  ✗ create set ${blId}: ${error.message}`); return null }
  setIdByBlId.set(blId, created.item_id)
  stats.setsNew++
  return created.item_id
}

async function resolveMinifig(blId, name) {
  // ── Keyed minifig (has bricklink_id) ───────────────────────────────────
  if (blId) {
    if (figIdByBlId.has(blId)) return figIdByBlId.get(blId)

    const { data: existing } = await supabase
      .from('items')
      .select('item_id')
      .eq('bricklink_id', blId)
      .maybeSingle()
    if (existing) {
      figIdByBlId.set(blId, existing.item_id)
      stats.figsMatched++
      return existing.item_id
    }

    if (DRY_RUN) {
      const id = dryId(); figIdByBlId.set(blId, id); stats.figsNew++; return id
    }
    const { data: created, error } = await supabase
      .from('items')
      .insert({
        category_id:        categoryId,
        subcategory_id:     subcategoryId,
        franchise_id:       franchiseId,
        brand_id:           minifigBrandId,
        collectible_set_id: collectibleSetId,
        bricklink_id:       blId,
        description:        name || blId,
      })
      .select('item_id')
      .single()
    if (error) { console.error(`  ✗ create minifig ${blId}: ${error.message}`); return null }
    figIdByBlId.set(blId, created.item_id)
    stats.figsNew++
    return created.item_id
  }

  // ── Codeless minifig (no bricklink_id) ─────────────────────────────────
  const fkey = codelessKey(name)
  if (figIdByFallback.has(fkey)) return figIdByFallback.get(fkey)

  const { data: existing } = await supabase
    .from('items')
    .select('item_id')
    .eq('brand_id', minifigBrandId)
    .eq('collectible_set_id', collectibleSetId)
    .ilike('description', (name || '').trim())
    .limit(1)
    .maybeSingle()
  if (existing) {
    figIdByFallback.set(fkey, existing.item_id)
    stats.figsMatched++
    return existing.item_id
  }

  if (DRY_RUN) {
    const id = dryId(); figIdByFallback.set(fkey, id); stats.figsNew++; return id
  }
  const { data: created, error } = await supabase
    .from('items')
    .insert({
      category_id:        categoryId,
      subcategory_id:     subcategoryId,
      franchise_id:       franchiseId,
      brand_id:           minifigBrandId,
      collectible_set_id: collectibleSetId,
      bricklink_id:       null,
      description:        (name || '').trim(),
    })
    .select('item_id')
    .single()
  if (error) { console.error(`  ✗ create codeless minifig "${name}": ${error.message}`); return null }
  figIdByFallback.set(fkey, created.item_id)
  stats.figsNew++
  return created.item_id
}

// ── Main ───────────────────────────────────────────────────────────────────
const csvText = fs.readFileSync(path.resolve(csvFile), 'utf8')
const rows    = parseFile(csvText)

if (rows.length === 0) {
  console.error('No valid rows found in CSV.'); process.exit(1)
}

const setRows    = rows.filter(r => r.type === 'set')
const minifigRows = rows.filter(r => r.type === 'minifig')
// Deduplicate: process each unique bricklink_id once
const uniqueSets    = new Map()
const uniqueMinifigs = []  // preserve all rows for pass 2; dedup handled in resolver

for (const r of setRows) {
  if (r.bricklink_id && !uniqueSets.has(r.bricklink_id)) {
    uniqueSets.set(r.bricklink_id, r.name)
  }
}

const seenFigKeys = new Set()
for (const r of minifigRows) {
  const key = r.bricklink_id || codelessKey(r.name)
  if (!seenFigKeys.has(key)) {
    seenFigKeys.add(key)
    uniqueMinifigs.push(r)
  }
}

console.log(`Parsed ${rows.length} rows → ${uniqueSets.size} unique sets, ${uniqueMinifigs.length} unique minifigs.`)
if (DRY_RUN) console.log()

// ── Pass 1: upsert items ──────────────────────────────────────────────────
console.log(`\n── Pass 1: upserting items ────────────────────────────────────`)

console.log(`\nSets (${uniqueSets.size}):`)
for (const [blId, name] of uniqueSets) {
  const itemId = await resolveSet(blId, name)
  const tag = itemId?.startsWith('dry:') ? '[dry-run]' : (stats.setsNew > 0 ? 'new' : 'exists')
  console.log(`  ${itemId?.startsWith('dry:') ? '[dry]' : (setIdByBlId.get(blId) === itemId && !DRY_RUN ? 'exists' : 'new  ')}  ${blId.padEnd(12)} "${name}"`)
}

console.log(`\nMinifigs (${uniqueMinifigs.length}):`)
for (const r of uniqueMinifigs) {
  const itemId = await resolveMinifig(r.bricklink_id, r.name)
  const key = r.bricklink_id || `(codeless) "${r.name}"`
  const label = itemId ? (itemId.startsWith('dry:') ? '[dry]  ' : 'exists ') : 'FAILED '
  console.log(`  ${label} ${key.padEnd(14)} "${r.name || ''}"`)
}

// ── Pass 2: upsert set_minifigs links ─────────────────────────────────────
console.log(`\n── Pass 2: upserting links ────────────────────────────────────`)

for (const r of minifigRows) {
  const parentBlId = r.parent_set?.trim() || null

  if (!parentBlId) {
    stats.unresolved.push({ row: r._line, key: r.bricklink_id || `"${r.name}"`, reason: 'no parent_set value in row' })
    continue
  }

  // Resolve set — may exist in DB even if not in this file (cross-file import)
  const setItemId = await resolveSet(parentBlId, null)

  if (!setItemId) {
    stats.unresolved.push({ row: r._line, key: r.bricklink_id || `"${r.name}"`, reason: `parent_set "${parentBlId}" not found in DB or current file` })
    continue
  }

  const figItemId = await resolveMinifig(r.bricklink_id, r.name)

  if (!figItemId) {
    stats.unresolved.push({ row: r._line, key: r.bricklink_id || `"${r.name}"`, reason: 'minifig item could not be resolved' })
    continue
  }

  const qty = r.quantity || 1

  if (DRY_RUN) {
    console.log(`  [dry]   ${parentBlId} → ${r.bricklink_id || `"${r.name}"`}  qty:${qty}`)
    stats.linksUpserted++
    continue
  }

  const { error } = await supabase
    .from('set_minifigs')
    .upsert(
      { set_item_id: setItemId, minifig_item_id: figItemId, quantity: qty },
      { onConflict: 'set_item_id,minifig_item_id' }
    )

  if (error) {
    stats.unresolved.push({ row: r._line, key: r.bricklink_id || `"${r.name}"`, reason: `DB error: ${error.message}` })
  } else {
    console.log(`  ✓  ${parentBlId.padEnd(12)} → ${(r.bricklink_id || `"${r.name}"`).padEnd(12)}  qty:${qty}`)
    stats.linksUpserted++
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
const NEW_SETS_TOTAL = stats.setsNew
const MATCHED_SETS   = stats.setsMatched
const NEW_FIGS       = stats.figsNew
const MATCHED_FIGS   = stats.figsMatched

console.log(`
══════════════════════════════════════════
  Import summary${DRY_RUN ? ' (DRY RUN)' : ''}
──────────────────────────────────────────
  Sets     : ${uniqueSets.size} processed  (${NEW_SETS_TOTAL} new, ${MATCHED_SETS} matched existing)
  Minifigs : ${uniqueMinifigs.length} processed  (${NEW_FIGS} new, ${MATCHED_FIGS} matched existing)
  Links    : ${stats.linksUpserted} upserted
  Unresolved: ${stats.unresolved.length} row(s)`)

if (stats.unresolved.length > 0) {
  console.log(`\n  UNRESOLVED — review before re-running:`)
  for (const u of stats.unresolved) {
    console.log(`    Line ${String(u.row).padStart(4)}: ${u.key} — ${u.reason}`)
  }
}
console.log(`══════════════════════════════════════════`)

if (stats.unresolved.length > 0) process.exit(2)
