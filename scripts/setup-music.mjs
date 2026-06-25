#!/usr/bin/env node
// scripts/setup-music.mjs
// One-time setup for Music category in CollectorsHub.
// Creates the "Music" franchise (if absent) and links all Music subcategories
// to it via franchise_subcategory so the cascade works correctly.
// Run: node scripts/setup-music.mjs

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

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

// ── 1. Find the Music category ─────────────────────────────────────────────
console.log('Looking up Music category…')
const { data: catRow, error: catErr } = await supabase
  .from('categories').select('category_id, name').ilike('name', 'Music').maybeSingle()
if (catErr) { console.error('categories lookup failed:', catErr.message); process.exit(1) }
if (!catRow) { console.error('No "Music" category found. Add it to the categories table first.'); process.exit(1) }
console.log(`  ✓ Category: ${catRow.name} (${catRow.category_id})`)

// ── 2. Find all subcategories under Music category ─────────────────────────
console.log('Loading Music subcategories…')
const { data: subRows, error: subErr } = await supabase
  .from('subcategories').select('subcategory_id, name').eq('category_id', catRow.category_id).order('name')
if (subErr) { console.error('subcategories lookup failed:', subErr.message); process.exit(1) }
if (!subRows?.length) {
  console.error('No subcategories found under Music. Create Vinyl, CDs, Cassette Tapes first.')
  process.exit(1)
}
console.log(`  Found ${subRows.length} subcategories: ${subRows.map(s => s.name).join(', ')}`)

// ── 3. Find or create the "Music" franchise ────────────────────────────────
console.log('Looking up Music franchise…')
const { data: franRows, error: franErr } = await supabase
  .from('franchises').select('franchise_id, name').eq('name', 'Music')
if (franErr) { console.error('franchises lookup failed:', franErr.message); process.exit(1) }

let franRow = franRows?.[0] || null

// If multiple rows named "Music", pick the first and warn
if (franRows?.length > 1) {
  console.warn(`\n  ⚠ WARNING: ${franRows.length} franchises named "Music" found!`)
  console.warn('  This was likely the cause of your duplicate-ID problem.')
  console.warn('  Checking which has data so we can use the right one…')
  // Pick the franchise that has the most albums attached
  let bestFran = franRows[0]
  let bestCount = 0
  for (const f of franRows) {
    const { data: fAlbums } = await supabase.from('collectible_sets').select('name').eq('franchise_id', f.franchise_id).order('name')
    const { data: fBfRows } = await supabase.from('brand_franchise').select('brand_id').eq('franchise_id', f.franchise_id)
    const fBrandIds = (fBfRows || []).map(r => r.brand_id)
    let fLabels = []
    if (fBrandIds.length) {
      const { data: bRows } = await supabase.from('brands').select('name').in('brand_id', fBrandIds).order('name')
      fLabels = (bRows || []).map(b => b.name)
    }
    const score = (fAlbums?.length ?? 0) + fLabels.length
    console.warn(`    ${f.franchise_id}:`)
    console.warn(`      Albums: ${fAlbums?.map(a => a.name).join(', ') || 'none'}`)
    console.warn(`      Labels: ${fLabels.join(', ') || 'none'}`)
    if (score > bestCount) { bestFran = f; bestCount = score }
  }
  franRow = bestFran
  console.warn(`  Using franchise with most data: ${franRow.franchise_id}`)
  console.warn('\n  ACTION REQUIRED — run this in Supabase SQL editor to consolidate:')
  for (const f of franRows) {
    if (f.franchise_id !== franRow.franchise_id) {
      console.warn(`    -- Move albums from duplicate to keeper:`)
      console.warn(`    UPDATE collectible_sets SET franchise_id = '${franRow.franchise_id}' WHERE franchise_id = '${f.franchise_id}';`)
      console.warn(`    -- Move record labels from duplicate to keeper:`)
      console.warn(`    UPDATE brand_franchise SET franchise_id = '${franRow.franchise_id}' WHERE franchise_id = '${f.franchise_id}' AND NOT EXISTS (SELECT 1 FROM brand_franchise WHERE franchise_id = '${franRow.franchise_id}' AND brand_id = brand_franchise.brand_id);`)
      console.warn(`    DELETE FROM brand_franchise WHERE franchise_id = '${f.franchise_id}';`)
      console.warn(`    -- Delete duplicate franchise:`)
      console.warn(`    DELETE FROM franchises WHERE franchise_id = '${f.franchise_id}';`)
    }
  }
  console.warn('')
}

if (!franRow) {
  console.log('  Creating Music franchise…')
  const { data: newFran, error: createErr } = await supabase
    .from('franchises').insert({ name: 'Music', shorthand: 'MUS' }).select('franchise_id, name').single()
  if (createErr) { console.error('Failed to create franchise:', createErr.message); process.exit(1) }
  franRow = newFran
  console.log(`  ✓ Created: ${franRow.name} (${franRow.franchise_id})`)
} else {
  console.log(`  ✓ Franchise exists: ${franRow.name} (${franRow.franchise_id})`)
}

// ── 4. Link each subcategory to Music franchise ────────────────────────────
console.log('Linking subcategories → Music franchise…')
for (const sub of subRows) {
  const { error: linkErr } = await supabase
    .from('franchise_subcategory')
    .upsert({ franchise_id: franRow.franchise_id, subcategory_id: sub.subcategory_id }, { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true })
  if (linkErr) {
    console.error(`  ✗ Failed to link ${sub.name}: ${linkErr.message}`)
  } else {
    console.log(`  ✓ ${sub.name} → Music`)
  }
}

// ── 5. Report existing brands (record labels) under Music franchise ─────────
const { data: bfRows } = await supabase
  .from('brand_franchise').select('brand_id').eq('franchise_id', franRow.franchise_id)
const brandIds = (bfRows || []).map(r => r.brand_id)
if (brandIds.length) {
  const { data: brands } = await supabase.from('brands').select('name').in('brand_id', brandIds).order('name')
  console.log(`\nRecord Labels already under Music: ${(brands || []).map(b => b.name).join(', ') || 'none'}`)
} else {
  console.log('\nNo Record Labels linked to Music franchise yet. Add them via the app (they will auto-link to Music).')
}

// ── 6. Report existing albums under Music franchise ────────────────────────
const { data: albums } = await supabase
  .from('collectible_sets').select('name').eq('franchise_id', franRow.franchise_id).order('name')
if (albums?.length) {
  console.log(`Albums under Music franchise: ${albums.map(a => a.name).join(', ')}`)
} else {
  console.log('No Albums linked to Music franchise yet.')
}

console.log('\nDone. Music category is ready.')
console.log(`Music franchise ID: ${franRow.franchise_id}`)
