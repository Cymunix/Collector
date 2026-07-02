#!/usr/bin/env node
// scripts/dedup-subjects.mjs
// Finds duplicate subject records (same name, case-insensitive) and merges them
// into one canonical record, re-pointing all references then deleting the dupes.
// Run: node scripts/dedup-subjects.mjs
// Add --dry-run to preview changes without writing anything.

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

// ── 1. Load all subjects ───────────────────────────────────────────────────
console.log('Loading all subjects…')
const { data: allSubjects, error: subErr } = await supabase
  .from('subjects')
  .select('subject_id, subject_name, subject_type')
  .order('subject_name')

if (subErr) { console.error('Failed to load subjects:', subErr.message); process.exit(1) }
console.log(`  Loaded ${allSubjects.length} subjects.\n`)

// ── 2. Group by lowercased name ────────────────────────────────────────────
const groups = new Map()
for (const s of allSubjects) {
  const key = s.subject_name.trim().toLowerCase()
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(s)
}

const dupeGroups = [...groups.values()].filter(g => g.length > 1)
if (dupeGroups.length === 0) {
  console.log('No duplicate subjects found. Nothing to do.')
  process.exit(0)
}
console.log(`Found ${dupeGroups.length} duplicate name group(s):\n`)

// ── 3. Load reference counts to pick the best canonical record ─────────────
// Count how many items reference each subject_id (via items.subject_id)
const { data: itemRefRows } = await supabase
  .from('items')
  .select('subject_id')
  .not('subject_id', 'is', null)

const itemRefCount = {}
for (const r of itemRefRows || []) {
  itemRefCount[r.subject_id] = (itemRefCount[r.subject_id] || 0) + 1
}

// Count item_subjects references
const { data: isRefRows } = await supabase
  .from('item_subjects')
  .select('subject_id')

const isRefCount = {}
for (const r of isRefRows || []) {
  isRefCount[r.subject_id] = (isRefCount[r.subject_id] || 0) + 1
}

// ── 4. Process each duplicate group ───────────────────────────────────────
let totalMerged = 0

for (const group of dupeGroups) {
  // Pick canonical: highest combined reference count, then earliest UUID (lexicographic)
  group.sort((a, b) => {
    const scoreA = (itemRefCount[a.subject_id] || 0) + (isRefCount[a.subject_id] || 0)
    const scoreB = (itemRefCount[b.subject_id] || 0) + (isRefCount[b.subject_id] || 0)
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.subject_id < b.subject_id ? -1 : 1
  })

  const canonical  = group[0]
  const duplicates = group.slice(1)
  const dupeIds    = duplicates.map(d => d.subject_id)

  console.log(`"${canonical.subject_name}"`)
  console.log(`  Canonical : ${canonical.subject_id} (${(itemRefCount[canonical.subject_id] || 0) + (isRefCount[canonical.subject_id] || 0)} refs)`)
  for (const d of duplicates) {
    console.log(`  Duplicate : ${d.subject_id} (${(itemRefCount[d.subject_id] || 0) + (isRefCount[d.subject_id] || 0)} refs)`)
  }

  if (DRY_RUN) { console.log('  [dry-run] skipping writes\n'); continue }

  // ── 4a. Re-point items.subject_id ─────────────────────────────────────
  const { error: itemsErr } = await supabase
    .from('items')
    .update({ subject_id: canonical.subject_id })
    .in('subject_id', dupeIds)
  if (itemsErr) { console.error(`  ✗ items update failed: ${itemsErr.message}`); continue }

  // ── 4b. Re-point item_subjects (junction table) ───────────────────────
  // Find all items that link to a duplicate subject_id
  const { data: dupeLinks } = await supabase
    .from('item_subjects')
    .select('item_id, subject_id')
    .in('subject_id', dupeIds)

  if (dupeLinks?.length) {
    // Get item_ids that already have the canonical subject linked
    const affectedItemIds = [...new Set(dupeLinks.map(r => r.item_id))]
    const { data: existingCanonical } = await supabase
      .from('item_subjects')
      .select('item_id')
      .eq('subject_id', canonical.subject_id)
      .in('item_id', affectedItemIds)
    const alreadyLinked = new Set((existingCanonical || []).map(r => r.item_id))

    // Insert canonical link for items that don't already have it
    const toInsert = dupeLinks
      .filter(r => !alreadyLinked.has(r.item_id))
      .map(r => ({ item_id: r.item_id, subject_id: canonical.subject_id }))
    if (toInsert.length) {
      const { error: insErr } = await supabase.from('item_subjects').insert(toInsert)
      if (insErr) console.error(`  ✗ item_subjects insert failed: ${insErr.message}`)
    }

    // Delete all duplicate links
    const { error: delErr } = await supabase
      .from('item_subjects')
      .delete()
      .in('subject_id', dupeIds)
    if (delErr) console.error(`  ✗ item_subjects delete failed: ${delErr.message}`)
  }

  // ── 4c. Merge subject_franchise links ────────────────────────────────
  const { data: dupeFranchises } = await supabase
    .from('subject_franchise')
    .select('franchise_id')
    .in('subject_id', dupeIds)

  if (dupeFranchises?.length) {
    const franchiseIds = [...new Set(dupeFranchises.map(r => r.franchise_id))]
    for (const fid of franchiseIds) {
      await supabase.from('subject_franchise').upsert(
        { subject_id: canonical.subject_id, franchise_id: fid },
        { onConflict: 'subject_id,franchise_id', ignoreDuplicates: true }
      )
    }
    await supabase.from('subject_franchise').delete().in('subject_id', dupeIds)
  }

  // ── 4d. Delete duplicate subject records ─────────────────────────────
  const { error: delSubErr } = await supabase
    .from('subjects')
    .delete()
    .in('subject_id', dupeIds)
  if (delSubErr) {
    console.error(`  ✗ subjects delete failed: ${delSubErr.message}`)
  } else {
    console.log(`  ✓ Merged ${duplicates.length} duplicate(s) into ${canonical.subject_id}\n`)
    totalMerged += duplicates.length
  }
}

if (!DRY_RUN) {
  console.log(`Done. ${totalMerged} duplicate subject record(s) removed.`)
} else {
  console.log(`\nDry run complete. Run without --dry-run to apply changes.`)
}
