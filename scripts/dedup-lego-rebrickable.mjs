#!/usr/bin/env node
// scripts/dedup-lego-rebrickable.mjs
// Merges items that share a rebrickable_fig_id (the LEGO minifig identity key).
// Keeps the record with the most references, re-points all FKs, deletes the rest.
// Must run BEFORE idx_items_rebrickable_fig_id_unique can be created
// (see supabase/migrations/20260705_lego_rebrickable_unique.sql).
//
// Sibling of dedup-lego-items.mjs (which dedups by bricklink_id). Same merge
// strategy; different key. A minifig is identified by its fig-num, so two rows
// with the same fig-num but different bricklink codes are the SAME minifig and
// are collapsed into one.
//
// Run:    node scripts/dedup-lego-rebrickable.mjs
// Flags:  --dry-run           (preview only, no writes)
//         --only <fig-num>    (merge only this one fig-num group; repeatable)

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
// Collect any --only <fig-num> filters (case-insensitive). Empty = all groups.
const ONLY = new Set()
for (let i = 0; i < process.argv.length; i++)
  if (process.argv[i] === '--only' && process.argv[i + 1]) ONLY.add(process.argv[i + 1].trim().toLowerCase())

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

if (DRY_RUN) console.log('DRY RUN — no changes will be written.\n')

// ── 1. Load all items with a rebrickable_fig_id ──────────────────────────────
console.log('Loading items with rebrickable_fig_id…')
const { data: allItems, error: itemErr } = await supabase
  .from('items')
  .select('item_id, rebrickable_fig_id, bricklink_id, description')
  .not('rebrickable_fig_id', 'is', null)
  .order('item_id')

if (itemErr) { console.error('Failed to load items:', itemErr.message); process.exit(1) }
console.log(`  Loaded ${allItems.length} items with a rebrickable_fig_id.\n`)

// ── 2. Group by fig-num, find duplicates ─────────────────────────────────────
const groups = new Map()
for (const item of allItems) {
  const key = item.rebrickable_fig_id.trim().toLowerCase()
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(item)
}
let dupeGroups = [...groups.values()].filter(g => g.length > 1)
if (ONLY.size) {
  dupeGroups = dupeGroups.filter(g => ONLY.has(g[0].rebrickable_fig_id.trim().toLowerCase()))
  console.log(`--only filter active: merging ${dupeGroups.length} of the matching group(s): ${[...ONLY].join(', ')}\n`)
}
if (dupeGroups.length === 0) {
  console.log('No duplicate rebrickable_fig_id values found. Nothing to do.')
  process.exit(0)
}
console.log(`Found ${dupeGroups.length} duplicate fig-num group(s).\n`)

// ── 3. Count references per item to pick the canonical row ────────────────────
const allItemIds = allItems.map(i => i.item_id)
const refTables = [
  { table: 'item_subjects',   fk: 'item_id' },
  { table: 'item_teams',      fk: 'item_id' },
  { table: 'item_card_types', fk: 'item_id' },
  { table: 'item_images',     fk: 'item_id' },
  { table: 'set_minifigs',    fk: 'set_item_id' },
  { table: 'set_minifigs',    fk: 'minifig_item_id' },
]
const refCount = {}
for (const { table, fk } of refTables) {
  const { data: rows } = await supabase.from(table).select(fk).in(fk, allItemIds)
  for (const r of rows || []) refCount[r[fk]] = (refCount[r[fk]] || 0) + 1
}

// ── 4. Merge each duplicate group ────────────────────────────────────────────
let totalMerged = 0
for (const group of dupeGroups) {
  group.sort((a, b) => {
    const sA = refCount[a.item_id] || 0, sB = refCount[b.item_id] || 0
    if (sB !== sA) return sB - sA
    return a.item_id < b.item_id ? -1 : 1
  })
  const canonical  = group[0]
  const duplicates = group.slice(1)
  const dupeIds    = duplicates.map(d => d.item_id)

  console.log(`fig-num "${canonical.rebrickable_fig_id}" — "${canonical.description || '(no description)'}"`)
  console.log(`  Canonical : ${canonical.item_id} (bl:${canonical.bricklink_id || '–'}, ${refCount[canonical.item_id] || 0} refs)`)
  for (const d of duplicates) console.log(`  Duplicate : ${d.item_id} (bl:${d.bricklink_id || '–'}, ${refCount[d.item_id] || 0} refs)`)

  if (DRY_RUN) { console.log('  [dry-run] skipping writes\n'); continue }

  // 4a. item_subjects (avoid PK collision)
  const { data: dupeSubs } = await supabase.from('item_subjects').select('item_id, subject_id').in('item_id', dupeIds)
  if (dupeSubs?.length) {
    const { data: existing } = await supabase.from('item_subjects').select('subject_id').eq('item_id', canonical.item_id)
    const linked = new Set((existing || []).map(r => r.subject_id))
    const toInsert = dupeSubs.filter(r => !linked.has(r.subject_id)).map(r => ({ item_id: canonical.item_id, subject_id: r.subject_id }))
    if (toInsert.length) await supabase.from('item_subjects').insert(toInsert)
    await supabase.from('item_subjects').delete().in('item_id', dupeIds)
  }

  // 4b. item_teams
  const { data: dupeTeams } = await supabase.from('item_teams').select('item_id, team_id').in('item_id', dupeIds)
  if (dupeTeams?.length) {
    const { data: existing } = await supabase.from('item_teams').select('team_id').eq('item_id', canonical.item_id)
    const linked = new Set((existing || []).map(r => r.team_id))
    const toInsert = dupeTeams.filter(r => !linked.has(r.team_id)).map(r => ({ item_id: canonical.item_id, team_id: r.team_id }))
    if (toInsert.length) await supabase.from('item_teams').insert(toInsert)
    await supabase.from('item_teams').delete().in('item_id', dupeIds)
  }

  // 4c. item_images (no unique constraint — straight re-point)
  await supabase.from('item_images').update({ item_id: canonical.item_id }).in('item_id', dupeIds)

  // 4d. set_minifigs (composite PK — upsert then delete, both directions)
  for (const dupeId of dupeIds) {
    const { data: setRows } = await supabase.from('set_minifigs').select('set_item_id, minifig_item_id, quantity').eq('set_item_id', dupeId)
    for (const row of setRows || [])
      await supabase.from('set_minifigs').upsert({ set_item_id: canonical.item_id, minifig_item_id: row.minifig_item_id, quantity: row.quantity }, { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true })
    await supabase.from('set_minifigs').delete().eq('set_item_id', dupeId)

    const { data: figRows } = await supabase.from('set_minifigs').select('set_item_id, minifig_item_id, quantity').eq('minifig_item_id', dupeId)
    for (const row of figRows || [])
      await supabase.from('set_minifigs').upsert({ set_item_id: row.set_item_id, minifig_item_id: canonical.item_id, quantity: row.quantity }, { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true })
    await supabase.from('set_minifigs').delete().eq('minifig_item_id', dupeId)
  }

  // 4e. delete the duplicate item rows
  const { error: delErr } = await supabase.from('items').delete().in('item_id', dupeIds)
  if (delErr) console.error(`  ✗ items delete failed: ${delErr.message}`)
  else { console.log(`  ✓ Merged ${duplicates.length} duplicate(s) into ${canonical.item_id}\n`); totalMerged += duplicates.length }
}

console.log(DRY_RUN
  ? `\nDry run complete. Run without --dry-run to apply changes.`
  : `Done. ${totalMerged} duplicate item record(s) removed.`)
