#!/usr/bin/env node
// scripts/dedup-lego-items.mjs
// Finds items with duplicate bricklink_id values and merges them:
// keeps the record with the most references, re-points all FKs, deletes orphans.
// Must be run BEFORE the idx_items_bricklink_id_unique index can be created.
//
// Run:    node scripts/dedup-lego-items.mjs
// Flags:  --dry-run   (preview only, no writes)

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

// ── env ────────────────────────────────────────────────────────────────────
const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env    = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL    || env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL) { console.error('VITE_SUPABASE_URL not set'); process.exit(1) }
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_KEY not set (needed to bypass RLS)'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (DRY_RUN) console.log('DRY RUN — no changes will be written.\n')

// ── 1. Load all items that have a bricklink_id ──────────────────────────────
console.log('Loading items with bricklink_id…')
const { data: allItems, error: itemErr } = await supabase
  .from('items')
  .select('item_id, bricklink_id, description')
  .not('bricklink_id', 'is', null)
  .order('item_id')

if (itemErr) { console.error('Failed to load items:', itemErr.message); process.exit(1) }
console.log(`  Loaded ${allItems.length} items with a bricklink_id.\n`)

// ── 2. Group by lowercase bricklink_id, find duplicates ────────────────────
const groups = new Map()
for (const item of allItems) {
  const key = item.bricklink_id.trim().toLowerCase()
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(item)
}

const dupeGroups = [...groups.values()].filter(g => g.length > 1)
if (dupeGroups.length === 0) {
  console.log('No duplicate bricklink_id values found. Nothing to do.')
  process.exit(0)
}
console.log(`Found ${dupeGroups.length} duplicate bricklink_id group(s).\n`)

// ── 3. Count references per item to pick canonical ─────────────────────────
const allItemIds = allItems.map(i => i.item_id)

const refTables = [
  { table: 'item_subjects',  fk: 'item_id' },
  { table: 'item_teams',     fk: 'item_id' },
  { table: 'item_card_types', fk: 'item_id' },
  { table: 'item_images',    fk: 'item_id' },
  { table: 'set_minifigs',   fk: 'set_item_id' },
  { table: 'set_minifigs',   fk: 'minifig_item_id' },
]

const refCount = {}
for (const { table, fk } of refTables) {
  const { data: rows } = await supabase.from(table).select(fk).in(fk, allItemIds)
  for (const r of rows || []) {
    const id = r[fk]
    refCount[id] = (refCount[id] || 0) + 1
  }
}

// ── 4. Process each duplicate group ────────────────────────────────────────
let totalMerged = 0

for (const group of dupeGroups) {
  group.sort((a, b) => {
    const scoreA = refCount[a.item_id] || 0
    const scoreB = refCount[b.item_id] || 0
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.item_id < b.item_id ? -1 : 1
  })

  const canonical  = group[0]
  const duplicates = group.slice(1)
  const dupeIds    = duplicates.map(d => d.item_id)

  console.log(`"${canonical.bricklink_id}" — "${canonical.description || '(no description)'}"`)
  console.log(`  Canonical : ${canonical.item_id} (${refCount[canonical.item_id] || 0} refs)`)
  for (const d of duplicates) {
    console.log(`  Duplicate : ${d.item_id} (${refCount[d.item_id] || 0} refs)`)
  }

  if (DRY_RUN) { console.log('  [dry-run] skipping writes\n'); continue }

  // ── 4a. Re-point item_subjects ──────────────────────────────────────────
  const { data: dupeSubs } = await supabase
    .from('item_subjects')
    .select('item_id, subject_id')
    .in('item_id', dupeIds)

  if (dupeSubs?.length) {
    const { data: existingSubs } = await supabase
      .from('item_subjects')
      .select('subject_id')
      .eq('item_id', canonical.item_id)
    const alreadyLinked = new Set((existingSubs || []).map(r => r.subject_id))
    const toInsert = dupeSubs.filter(r => !alreadyLinked.has(r.subject_id))
      .map(r => ({ item_id: canonical.item_id, subject_id: r.subject_id }))
    if (toInsert.length) {
      await supabase.from('item_subjects').insert(toInsert)
    }
    await supabase.from('item_subjects').delete().in('item_id', dupeIds)
  }

  // ── 4b. Re-point item_teams ─────────────────────────────────────────────
  const { data: dupeTeams } = await supabase
    .from('item_teams')
    .select('item_id, team_id')
    .in('item_id', dupeIds)

  if (dupeTeams?.length) {
    const { data: existingTeams } = await supabase
      .from('item_teams')
      .select('team_id')
      .eq('item_id', canonical.item_id)
    const alreadyLinked = new Set((existingTeams || []).map(r => r.team_id))
    const toInsert = dupeTeams.filter(r => !alreadyLinked.has(r.team_id))
      .map(r => ({ item_id: canonical.item_id, team_id: r.team_id }))
    if (toInsert.length) await supabase.from('item_teams').insert(toInsert)
    await supabase.from('item_teams').delete().in('item_id', dupeIds)
  }

  // ── 4c. Re-point item_card_types ────────────────────────────────────────
  const { data: dupeCts } = await supabase
    .from('item_card_types')
    .select('item_id, card_type_id')
    .in('item_id', dupeIds)

  if (dupeCts?.length) {
    const { data: existingCts } = await supabase
      .from('item_card_types')
      .select('card_type_id')
      .eq('item_id', canonical.item_id)
    const alreadyLinked = new Set((existingCts || []).map(r => r.card_type_id))
    const toInsert = dupeCts.filter(r => !alreadyLinked.has(r.card_type_id))
      .map(r => ({ item_id: canonical.item_id, card_type_id: r.card_type_id }))
    if (toInsert.length) await supabase.from('item_card_types').insert(toInsert)
    await supabase.from('item_card_types').delete().in('item_id', dupeIds)
  }

  // ── 4d. Re-point item_images ────────────────────────────────────────────
  await supabase
    .from('item_images')
    .update({ item_id: canonical.item_id })
    .in('item_id', dupeIds)

  // ── 4e. Re-point set_minifigs (both directions) ─────────────────────────
  // set_minifigs has composite PK (set_item_id, minifig_item_id) so we must
  // avoid collisions before re-pointing.
  for (const dupeId of dupeIds) {
    // set side
    const { data: setRows } = await supabase
      .from('set_minifigs')
      .select('set_item_id, minifig_item_id, quantity')
      .eq('set_item_id', dupeId)

    for (const row of setRows || []) {
      const { error } = await supabase
        .from('set_minifigs')
        .upsert(
          { set_item_id: canonical.item_id, minifig_item_id: row.minifig_item_id, quantity: row.quantity },
          { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true }
        )
      if (error) console.error('  ✗ set_minifigs (set side) upsert:', error.message)
    }
    await supabase.from('set_minifigs').delete().eq('set_item_id', dupeId)

    // minifig side
    const { data: figRows } = await supabase
      .from('set_minifigs')
      .select('set_item_id, minifig_item_id, quantity')
      .eq('minifig_item_id', dupeId)

    for (const row of figRows || []) {
      await supabase
        .from('set_minifigs')
        .upsert(
          { set_item_id: row.set_item_id, minifig_item_id: canonical.item_id, quantity: row.quantity },
          { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true }
        )
    }
    await supabase.from('set_minifigs').delete().eq('minifig_item_id', dupeId)
  }

  // ── 4f. Delete duplicate item rows ──────────────────────────────────────
  const { error: delErr } = await supabase
    .from('items')
    .delete()
    .in('item_id', dupeIds)

  if (delErr) {
    console.error(`  ✗ items delete failed: ${delErr.message}`)
  } else {
    console.log(`  ✓ Merged ${duplicates.length} duplicate(s) into ${canonical.item_id}\n`)
    totalMerged += duplicates.length
  }
}

if (!DRY_RUN) {
  console.log(`Done. ${totalMerged} duplicate item record(s) removed.`)
} else {
  console.log(`\nDry run complete. Run without --dry-run to apply changes.`)
}
