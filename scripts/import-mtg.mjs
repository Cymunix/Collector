#!/usr/bin/env node
// scripts/import-mtg.mjs
// Import Magic: The Gathering cards from a Scryfall bulk JSON export.
//
// Usage:
//   node scripts/import-mtg.mjs
//   SETS=blb,zen,tsp node scripts/import-mtg.mjs    (specific sets only)
//   DRY_RUN=1        node scripts/import-mtg.mjs    (preview — no writes)
//
// If Node runs out of memory: node --max-old-space-size=8192 scripts/import-mtg.mjs

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
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── known IDs ──────────────────────────────────────────────────────────────
const CATEGORY_ID    = '2b10a9b7-a49b-4c5b-8843-9615cc719921' // Trading Cards
const SUBCATEGORY_ID = '58ec347f-bd78-4b7b-ae0f-624dde651e50' // Magic: The Gathering
const BRAND_ID       = 'f00f2488-03da-43b3-815c-1bd3b3501db5' // Wizards of the Coast
const FRANCHISE_ID   = '73d85cb9-a83a-45cf-bf96-0095af2433eb' // Magic

// ── options ────────────────────────────────────────────────────────────────
const FILTER_SETS = process.env.SETS
  ? new Set(process.env.SETS.split(',').map(s => s.trim().toLowerCase()))
  : null
const DRY_RUN    = process.env.DRY_RUN === '1'
const BATCH_SIZE = 200

const SKIP_LAYOUTS = new Set(['token', 'art_series', 'emblem', 'double_faced_token'])

// ── helpers ────────────────────────────────────────────────────────────────
function subjectType(typeLine = '') {
  const t = typeLine.toLowerCase()
  if (t.includes('creature'))     return 'Creature'
  if (t.includes('planeswalker')) return 'Planeswalker'
  if (t.includes('instant'))      return 'Instant'
  if (t.includes('sorcery'))      return 'Sorcery'
  if (t.includes('enchantment'))  return 'Enchantment'
  if (t.includes('artifact'))     return 'Artifact'
  if (t.includes('land'))         return 'Land'
  if (t.includes('battle'))       return 'Battle'
  return 'card'
}

function isForil(card) {
  // foil-only finish → mark as foil; nonfoil or mixed → nonfoil
  const finishes = card.finishes || []
  return finishes.length === 1 && finishes[0] === 'foil'
}

async function insertBatches(table, rows) {
  let count = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + BATCH_SIZE))
    if (error) console.error(`  [${table}] batch ${i} error:`, error.message)
    else count += Math.min(BATCH_SIZE, rows.length - i)
  }
  return count
}

// ── load + filter ──────────────────────────────────────────────────────────
const jsonFile = path.resolve('all-cards-20260617212523.json')
console.log(`Reading ${path.basename(jsonFile)} …`)
const raw = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
console.log(`Total in file: ${raw.length.toLocaleString()}`)

const cards = raw.filter(c =>
  c.lang === 'en' &&
  !c.digital &&
  !SKIP_LAYOUTS.has(c.layout) &&
  (!FILTER_SETS || FILTER_SETS.has(c.set))
)
console.log(`After filters: ${cards.length.toLocaleString()} cards`)

if (DRY_RUN) {
  const sets = [...new Set(cards.map(c => `${c.set_name} (${c.set})`))].sort()
  console.log(`\nDRY_RUN — sets (${sets.length}):`)
  sets.slice(0, 30).forEach(s => console.log('  ', s))
  if (sets.length > 30) console.log(`  … and ${sets.length - 30} more`)
  process.exit(0)
}

const franchiseId = FRANCHISE_ID

// ── collectible sets ───────────────────────────────────────────────────────
console.log('\n[1/4] Upserting collectible sets …')
const uniqueSetNames = [...new Map(cards.map(c => [c.set_name, {
  set:          c.set,
  name:         c.set_name,
  franchise_id: franchiseId,
  brand_id:     BRAND_ID,
  release_year: c.released_at ? parseInt(c.released_at.slice(0, 4)) : null,
}])).values()]
console.log(`  ${uniqueSetNames.length} unique sets`)

// Fetch existing sets for this franchise
const { data: existingSets } = await supabase
  .from('collectible_sets').select('collectible_set_id, name').eq('franchise_id', franchiseId)
const setMap = Object.fromEntries((existingSets || []).map(s => [s.name, s.collectible_set_id]))

const newSets = uniqueSetNames.filter(s => !setMap[s.name])
if (newSets.length) {
  for (let i = 0; i < newSets.length; i += BATCH_SIZE) {
    const { data, error } = await supabase
      .from('collectible_sets')
      .insert(newSets.slice(i, i + BATCH_SIZE).map(({ set: _set, ...rest }) => rest))
      .select('collectible_set_id, name')
    if (error) console.error('  set insert error:', error.message)
    ;(data || []).forEach(s => { setMap[s.name] = s.collectible_set_id })
  }
}
console.log(`  Set map: ${Object.keys(setMap).length} entries`)

// ── subjects ───────────────────────────────────────────────────────────────
console.log('\n[2/4] Upserting subjects …')
const uniqueSubjectDefs = [...new Map(cards.map(c => [c.name, {
  subject_name: c.name,
  subject_type: subjectType(c.type_line),
}])).values()]
console.log(`  ${uniqueSubjectDefs.length} unique card names`)

// Fetch existing subjects in chunks
const subjectMap = {}
for (let i = 0; i < uniqueSubjectDefs.length; i += 500) {
  const names = uniqueSubjectDefs.slice(i, i + 500).map(s => s.subject_name)
  const { data } = await supabase.from('subjects').select('subject_id, subject_name').in('subject_name', names)
  ;(data || []).forEach(s => { subjectMap[s.subject_name] = s.subject_id })
}

const newSubjects = uniqueSubjectDefs.filter(s => !subjectMap[s.subject_name])
console.log(`  ${newSubjects.length} new subjects to insert`)
for (let i = 0; i < newSubjects.length; i += BATCH_SIZE) {
  const { data, error } = await supabase
    .from('subjects').insert(newSubjects.slice(i, i + BATCH_SIZE)).select('subject_id, subject_name')
  if (error) console.error('  subject insert error:', error.message)
  ;(data || []).forEach(s => { subjectMap[s.subject_name] = s.subject_id })
}
console.log(`  Subject map: ${Object.keys(subjectMap).length} entries`)

// ── existing items ─────────────────────────────────────────────────────────
console.log('\n[3/4] Checking existing items …')
const existingCodes = new Set()
const { data: existingItems } = await supabase
  .from('items').select('catalog_code').eq('category_id', CATEGORY_ID).not('catalog_code', 'is', null)
;(existingItems || []).forEach(r => { if (r.catalog_code) existingCodes.add(r.catalog_code) })
console.log(`  ${existingCodes.size} already imported`)

const newCards = cards.filter(c => !existingCodes.has(c.id))
console.log(`  ${newCards.length} new cards to insert`)

// ── insert items ───────────────────────────────────────────────────────────
console.log('\n[4/4] Inserting items …')
let inserted = 0
const imageRows   = []
const flagRows    = []
const subjectRows = []

for (let i = 0; i < newCards.length; i += BATCH_SIZE) {
  const batch = newCards.slice(i, i + BATCH_SIZE)
  const itemRows = batch.map(c => ({
    category_id:        CATEGORY_ID,
    subcategory_id:     SUBCATEGORY_ID,
    franchise_id:       franchiseId,
    brand_id:           BRAND_ID,
    collectible_set_id: setMap[c.set_name] || null,
    card_number:        c.collector_number || null,
    release_year:       c.released_at ? parseInt(c.released_at.slice(0, 4)) : null,
    catalog_code:       c.id,
    description:        c.oracle_text    || null,
  }))

  const { data: created, error } = await supabase
    .from('items').insert(itemRows).select('item_id, catalog_code')

  if (error) {
    console.error(`  batch ${i} error:`, error.message)
    continue
  }

  inserted += created.length
  const codeToId = Object.fromEntries(created.map(r => [r.catalog_code, r.item_id]))

  for (const c of batch) {
    const itemId = codeToId[c.id]
    if (!itemId) continue
    const imgUrl = c.image_uris?.normal
    if (imgUrl) imageRows.push({ item_id: itemId, image_path: imgUrl, position: 0 })
    flagRows.push({ item_id: itemId, foil: isForil(c), patch: false, rookie: false, signature: false })
    const subjectId = subjectMap[c.name]
    if (subjectId) subjectRows.push({ item_id: itemId, subject_id: subjectId })
  }

  process.stdout.write(`  ${inserted.toLocaleString()} / ${newCards.length.toLocaleString()} inserted\r`)
}
console.log(`\n  Done: ${inserted} items`)

// ── images + flags + subjects ──────────────────────────────────────────────
console.log(`\n[6/5] Inserting linked rows …`)
const imgCount     = await insertBatches('item_images',          imageRows)
const flagCount    = await insertBatches('item_card_type_flags', flagRows)
const subjectCount = await insertBatches('item_subjects',        subjectRows)

console.log(`\n✓ Complete`)
console.log(`  Items:    ${inserted}`)
console.log(`  Images:   ${imgCount}`)
console.log(`  Flags:    ${flagCount}`)
console.log(`  Subjects: ${subjectCount}`)
