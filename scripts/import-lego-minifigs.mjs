#!/usr/bin/env node
// scripts/import-lego-minifigs.mjs — v3
// Identity-aware LEGO minifig importer.
//
// For each minifig row it:
//   1. Matches existing items by rebrickable_id → bricklink_id → (character + collectible_set) fallback
//   2. Mints our internal code (THEME-PROPERTY-SHORTHAND-NN) for genuinely new items
//   3. Resolves / creates the canonical Character (Subject) and links variant → character
//   4. Upserts the set ↔ minifig link (set_minifigs) with quantity
//
// All passes are idempotent — safe to re-run on the same data.
//
// CSV Format A (preferred):
//   type, bricklink_id, rebrickable_id, name, parent_set, quantity, franchise, brand, collectible_set
//   set,    75357-1,  ,              UCS Ghost,   ,       1, Star Wars, Sets,         Ahsoka
//   minifig,sw0001,   fig-001234,   Ahsoka Tano,  75357-1, 1, Star Wars, Minifigures,  Ahsoka
//
// CSV Format B (backward compat — set+minifig per row):
//   set_bricklink_id, set_name, minifig_bricklink_id, minifig_name, quantity
//
// Flags:
//   --dry-run          Preview; no writes
//   --auto-property    Do not pause on new provisional properties; mint and continue
//   <file> [file…]     One or more CSV files (processed in order)

import fs   from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { createClient } from '@supabase/supabase-js'

// ── CLI ────────────────────────────────────────────────────────────────────────
const DRY_RUN       = process.argv.includes('--dry-run')
const AUTO_PROPERTY = process.argv.includes('--auto-property')
const files = process.argv.slice(2).filter(a => !a.startsWith('--'))

if (!files.length) {
  console.error('Usage: node scripts/import-lego-minifigs.mjs [--dry-run] [--auto-property] <file.csv> [...]')
  process.exit(1)
}

// ── Env ────────────────────────────────────────────────────────────────────────
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
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_KEY not set'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

if (DRY_RUN) console.log('DRY RUN — no changes will be written.\n')

// ── CSV parsing ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const parseRow = (line) => {
    const fields = []; let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
      else cur += ch
    }
    fields.push(cur.trim())
    return fields
  }
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  const col = (...names) => { for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i } return -1 }

  const isFormatA = headers.includes('type')
  let rows = []

  if (isFormatA) {
    const iType     = col('type')
    const iBl       = col('bricklink_id', 'bricklink', 'bl_id')
    const iRb       = col('rebrickable_id', 'rebrickable_fig_id', 'rb_id', 'fig_num')
    const iName     = col('name', 'minifig_name', 'set_name')
    const iParent   = col('parent_set', 'set_number', 'parent_set_bricklink_id')
    const iQty      = col('quantity', 'qty', 'count')
    const iFranchise= col('franchise', 'franchise_name', 'theme')
    const iBrand    = col('brand', 'brand_name')
    const iColSet   = col('collectible_set', 'collectible_set_name', 'set_name_col', 'subtheme', 'wave')
    const g = (f, i) => (i >= 0 ? (f[i] || '').trim() : '')

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue
      const f = parseRow(line)
      rows.push({
        type:             g(f, iType).toLowerCase(),
        bricklink_id:     g(f, iBl),
        rebrickable_id:   g(f, iRb),
        name:             g(f, iName),
        parent_set:       g(f, iParent),
        quantity:         parseInt(g(f, iQty), 10) || 1,
        franchise:        g(f, iFranchise),
        brand:            g(f, iBrand),
        collectible_set:  g(f, iColSet),
      })
    }
  } else {
    // Format B
    const iSetBl   = col('set_bricklink_id', 'set_bl_id')
    const iSetName = col('set_name')
    const iFigBl   = col('minifig_bricklink_id', 'minifig_bl_id', 'fig_bl_id')
    const iFigName = col('minifig_name', 'fig_name', 'name')
    const iQty     = col('quantity', 'qty')
    const g = (f, i) => (i >= 0 ? (f[i] || '').trim() : '')

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue
      const f = parseRow(line)
      const setBlId  = g(f, iSetBl)
      const setName  = g(f, iSetName)
      const figBlId  = g(f, iFigBl)
      const figName  = g(f, iFigName)
      const qty      = parseInt(g(f, iQty), 10) || 1
      if (setBlId || setName) {
        rows.push({ type: 'set',     bricklink_id: setBlId, rebrickable_id: '', name: setName, parent_set: '', quantity: 1, franchise: '', brand: '', collectible_set: '' })
      }
      if (figBlId || figName) {
        rows.push({ type: 'minifig', bricklink_id: figBlId, rebrickable_id: '', name: figName, parent_set: setBlId, quantity: qty, franchise: '', brand: '', collectible_set: '' })
      }
    }
  }
  return rows
}

// ── Code scheme helpers ────────────────────────────────────────────────────────
const HONORIFICS = [
  'Grand Admiral', 'Grand Moff', 'Grand Master',
  'Fleet Admiral', 'High Admiral',
  'Admiral', 'General', 'Captain', 'Commander', 'Lieutenant Colonel', 'Lieutenant',
  'Sergeant Major', 'Sergeant', 'Major', 'Colonel', 'Corporal', 'Private',
  'Emperor', 'Empress', 'High Emperor',
  'Darth', 'Sith Lord',
  'Count', 'Countess', 'Duke', 'Duchess',
  'King', 'Queen', 'Prince', 'Princess',
  'Master', 'Jedi Master', 'Jedi Knight', 'Jedi',
  'Lord', 'Lady',
  'Doctor', 'Dr',
  'Director',
].sort((a, b) => b.length - a.length) // longest first

function deriveShorthand(name) {
  // 1. Parenthetical alias: "C1-10P (Chopper)" → use "Chopper"
  const aliasMatch = name.match(/\(([^)]+)\)/)
  let s = aliasMatch ? aliasMatch[1] : name

  // 2. Strip leading honorific
  for (const h of HONORIFICS) {
    const re = new RegExp(`^${h}\\s+`, 'i')
    if (re.test(s)) { s = s.replace(re, ''); break }
  }

  // 3. Keep letters + digits, take first 4, uppercase
  const stripped = s.replace(/[^A-Za-z0-9]/g, '')
  return stripped.slice(0, 4).toUpperCase() || 'UNKN'
}

function deriveProvisionalAbbrev(name) {
  // Same rule as shorthand — used for unknown property/theme names
  return name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'UNKN'
}

// ── In-memory caches ──────────────────────────────────────────────────────────
const categoryCache     = new Map() // name_lc → id
const subcategoryCache  = new Map() // name_lc → id
const franchiseCache    = new Map() // name_lc → franchise_id
const brandCache        = new Map() // `${fid}::name_lc` → brand_id
const colSetCache       = new Map() // `${fid}::${bid}::name_lc` → collectible_set_id
const subjectCache      = new Map() // name_lc → subject_id
const themeCache        = new Map() // franchise_id → lego_abbreviation
const propertyCache     = new Map() // `${themeAbbrev}::colset_name_lc` → abbreviation
const itemByBlCache     = new Map() // bricklink_id → item_id
const itemByRbCache     = new Map() // rebrickable_id → item_id

// ── Taxonomy resolvers ─────────────────────────────────────────────────────────
async function resolveCategory(name) {
  const key = name.toLowerCase()
  if (categoryCache.has(key)) return categoryCache.get(key)
  const { data } = await supabase.from('categories').select('category_id').ilike('name', name).limit(1).maybeSingle()
  const id = data?.category_id || null
  if (id) categoryCache.set(key, id)
  return id
}

async function resolveSubcategory(name, categoryId) {
  const key = `${categoryId}::${name.toLowerCase()}`
  if (subcategoryCache.has(key)) return subcategoryCache.get(key)
  const { data } = await supabase.from('subcategories').select('subcategory_id').ilike('name', name).eq('category_id', categoryId).limit(1).maybeSingle()
  const id = data?.subcategory_id || null
  if (id) subcategoryCache.set(key, id)
  return id
}

async function resolveOrCreateFranchise(name, subcategoryId) {
  const key = name.toLowerCase()
  if (franchiseCache.has(key)) return franchiseCache.get(key)
  const { data: found } = await supabase.from('franchises').select('franchise_id').ilike('name', name).limit(1).maybeSingle()
  let id = found?.franchise_id || null
  if (!id && !DRY_RUN) {
    const { data: created } = await supabase.from('franchises').insert({ name }).select('franchise_id').single()
    id = created?.franchise_id || null
  }
  if (id && subcategoryId && !DRY_RUN) {
    await supabase.from('franchise_subcategory').upsert(
      { franchise_id: id, subcategory_id: subcategoryId },
      { onConflict: 'franchise_id,subcategory_id', ignoreDuplicates: true }
    )
  }
  if (id) franchiseCache.set(key, id)
  return id || `dry:franchise:${key}`
}

async function resolveOrCreateBrand(name, franchiseId) {
  const key = `${franchiseId}::${name.toLowerCase()}`
  if (brandCache.has(key)) return brandCache.get(key)
  // Look for brand already linked to this franchise
  const { data: bfRows } = await supabase.from('brand_franchise').select('brand_id').eq('franchise_id', franchiseId)
  const linkedIds = (bfRows || []).map(r => r.brand_id)
  let id = null
  if (linkedIds.length) {
    const { data: found } = await supabase.from('brands').select('brand_id').ilike('name', name).in('brand_id', linkedIds).limit(1).maybeSingle()
    id = found?.brand_id || null
  }
  if (!id) {
    const { data: any } = await supabase.from('brands').select('brand_id').ilike('name', name).limit(1).maybeSingle()
    id = any?.brand_id || null
    if (!id && !DRY_RUN) {
      const { data: created } = await supabase.from('brands').insert({ name }).select('brand_id').single()
      id = created?.brand_id || null
    }
    if (id && !DRY_RUN) {
      await supabase.from('brand_franchise').upsert({ brand_id: id, franchise_id: franchiseId }, { onConflict: 'brand_id,franchise_id', ignoreDuplicates: true })
    }
  }
  if (id) brandCache.set(key, id)
  return id || `dry:brand:${key}`
}

async function resolveOrCreateCollectibleSet(name, franchiseId, brandId) {
  const key = `${franchiseId}::${brandId}::${name.toLowerCase()}`
  if (colSetCache.has(key)) return colSetCache.get(key)
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
  if (id) colSetCache.set(key, id)
  return id || `dry:colset:${key}`
}

// ── Theme abbreviation ─────────────────────────────────────────────────────────
// For LEGO, franchise = theme. The abbreviation lives on franchises.lego_abbreviation.
async function resolveThemeAbbrev(franchiseId, franchiseName) {
  const key = String(franchiseId)
  if (themeCache.has(key)) return themeCache.get(key)

  if (!String(franchiseId).startsWith('dry:')) {
    const { data } = await supabase
      .from('franchises').select('lego_abbreviation')
      .eq('franchise_id', franchiseId).maybeSingle()
    if (data?.lego_abbreviation) {
      themeCache.set(key, data.lego_abbreviation)
      return data.lego_abbreviation
    }
  }

  // No abbreviation yet — derive provisional from franchise/theme name
  const abbrev = deriveProvisionalAbbrev(franchiseName)
  if (!DRY_RUN && !String(franchiseId).startsWith('dry:')) {
    await supabase.from('franchises').update({ lego_abbreviation: abbrev }).eq('franchise_id', franchiseId)
  }
  console.log(`  ⚠ New theme abbreviation: "${franchiseName}" → ${abbrev} (provisional — confirm lego_abbreviation on franchise record)`)
  themeCache.set(key, abbrev)
  return abbrev
}

// Returns { abbreviation, isNew, isProvisional }
async function resolveProperty(colSetName, themeAbbrev, reviewQueue) {
  const key = `${themeAbbrev}::${colSetName.toLowerCase()}`
  if (propertyCache.has(key)) return propertyCache.get(key)

  // Exact full_name lookup
  let { data: found } = await supabase
    .from('lego_property_registry')
    .select('abbreviation, status')
    .eq('theme_abbreviation', themeAbbrev)
    .ilike('full_name', colSetName)
    .limit(1).maybeSingle()

  if (found) {
    propertyCache.set(key, found.abbreviation)
    return found.abbreviation
  }

  // Also try substring match for abbreviated names (e.g. "Ahsoka" matches "Ahsoka" full_name)
  const { data: partMatch } = await supabase
    .from('lego_property_registry')
    .select('abbreviation, full_name, status')
    .eq('theme_abbreviation', themeAbbrev)
  const match = (partMatch || []).find(r =>
    r.full_name.toLowerCase().includes(colSetName.toLowerCase()) ||
    colSetName.toLowerCase().includes(r.full_name.toLowerCase())
  )
  if (match) {
    propertyCache.set(key, match.abbreviation)
    return match.abbreviation
  }

  // Unknown property — mint provisional abbreviation
  let provAbbrev = deriveProvisionalAbbrev(colSetName)
  // Ensure uniqueness: if abbrev already taken by a different full_name, append digit
  const { data: existing } = await supabase
    .from('lego_property_registry')
    .select('abbreviation, full_name')
    .eq('abbreviation', provAbbrev).maybeSingle()
  if (existing && existing.full_name.toLowerCase() !== colSetName.toLowerCase()) {
    provAbbrev = provAbbrev.slice(0, 3) + '2'
  }

  if (!DRY_RUN) {
    await supabase.from('lego_property_registry').upsert(
      { abbreviation: provAbbrev, theme_abbreviation: themeAbbrev, full_name: colSetName, status: 'provisional' },
      { onConflict: 'abbreviation', ignoreDuplicates: true }
    )
  }
  reviewQueue.newProperties.push({ abbreviation: provAbbrev, fullName: colSetName, theme: themeAbbrev })
  console.log(`  ⚠ New property: "${colSetName}" → ${provAbbrev} (provisional — confirm or rename in lego_property_registry)`)
  propertyCache.set(key, provAbbrev)
  return provAbbrev
}

// ── Next NN for a code prefix ──────────────────────────────────────────────────
async function nextNN(prefix) {
  // prefix = "SW-AHSK-AHSO" — find max NN across existing codes
  const { data } = await supabase
    .from('items')
    .select('minifig_code')
    .like('minifig_code', `${prefix}-%`)
    .not('minifig_code', 'is', null)
  const max = (data || []).reduce((m, r) => {
    const nn = parseInt(r.minifig_code.split('-').pop(), 10)
    return isNaN(nn) ? m : Math.max(m, nn)
  }, 0)
  return String(max + 1).padStart(2, '0')
}

// ── Character (Subject) resolver ──────────────────────────────────────────────
async function resolveOrCreateCharacter(name, franchiseId) {
  const key = name.toLowerCase()
  if (subjectCache.has(key)) return subjectCache.get(key)
  const { data: found } = await supabase
    .from('subjects')
    .select('subject_id')
    .ilike('subject_name', name)
    .eq('subject_type', 'character')
    .limit(1).maybeSingle()
  let id = found?.subject_id || null
  if (!id && !DRY_RUN) {
    const { data: created } = await supabase
      .from('subjects')
      .insert({ subject_name: name, subject_type: 'character' })
      .select('subject_id').single()
    id = created?.subject_id || null
  }
  if (id && franchiseId && !String(franchiseId).startsWith('dry:') && !DRY_RUN) {
    await supabase.from('subject_franchise').upsert(
      { subject_id: id, franchise_id: franchiseId },
      { onConflict: 'subject_id,franchise_id', ignoreDuplicates: true }
    )
  }
  if (id) subjectCache.set(key, id)
  return id || `dry:subject:${key}`
}

// ── Item lookup helpers ────────────────────────────────────────────────────────
async function findItemByBricklink(blId) {
  if (!blId) return null
  if (itemByBlCache.has(blId)) return itemByBlCache.get(blId)
  const { data } = await supabase.from('items').select('item_id, minifig_code, subject_id').eq('bricklink_id', blId).maybeSingle()
  if (data?.item_id) itemByBlCache.set(blId, data)
  return data || null
}

async function findItemByRebrickable(rbId) {
  if (!rbId) return null
  if (itemByRbCache.has(rbId)) return itemByRbCache.get(rbId)
  const { data } = await supabase.from('items').select('item_id, minifig_code, subject_id').eq('rebrickable_fig_id', rbId).maybeSingle()
  if (data?.item_id) itemByRbCache.set(rbId, data)
  return data || null
}

// ── Shorthand collision check ──────────────────────────────────────────────────
// Returns the subject_id already associated with this prefix, or null if clear
async function checkShorthandCollision(prefix, characterName, characterId) {
  const { data: existing } = await supabase
    .from('items')
    .select('item_id, subject_id')
    .like('minifig_code', `${prefix}-%`)
    .not('minifig_code', 'is', null)
    .limit(1)
  if (!existing?.length) return false
  const existingSubjectId = existing[0].subject_id
  if (!existingSubjectId || existingSubjectId === characterId) return false
  // Different subject — genuine collision
  const { data: existingSubject } = await supabase
    .from('subjects')
    .select('subject_name')
    .eq('subject_id', existingSubjectId)
    .maybeSingle()
  return existingSubject?.subject_name || '(unknown)'
}

// ── Interactive prompt for auto-property gate ──────────────────────────────────
async function confirm(question) {
  if (AUTO_PROPERTY) return true
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(`${question} [Y/n] `, ans => { rl.close(); resolve(ans.trim().toLowerCase() !== 'n') }))
}

// ── Main ───────────────────────────────────────────────────────────────────────
const stats = {
  setsNew: 0, setsMatched: 0,
  figsNew: 0, figsMatched: 0,
  codesMinted: 0,
  charactersNew: 0, charactersMatched: 0,
  linksUpserted: 0,
}
const reviewQueue = {
  newProperties: [],      // { abbreviation, fullName, theme }
  collisions:    [],      // { shorthand, characterName, existingCharacter, prefix }
  unresolved:    [],      // { row, reason }
}

// Resolve taxonomy IDs we need for every item
const bbCategoryId   = await resolveCategory('Building Blocks')
const legoSubcatId   = bbCategoryId ? await resolveSubcategory('LEGO', bbCategoryId) : null
if (!bbCategoryId)  console.warn('  ⚠ "Building Blocks" category not found in DB')
if (!legoSubcatId)  console.warn('  ⚠ "LEGO" subcategory not found in DB')

// Collect all rows from all files
let allRows = []
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const rows = parseCSV(text)
  console.log(`Loaded ${rows.length} rows from ${path.basename(file)}`)
  allRows.push(...rows)
}

const setRows    = allRows.filter(r => r.type === 'set')
const minifigRows = allRows.filter(r => r.type === 'minifig')
console.log(`\nPass 1: ${setRows.length} set row(s), Pass 2: ${minifigRows.length} minifig row(s)\n`)

// ── Pass 1: Sets ───────────────────────────────────────────────────────────────
// Maps set bricklink_id → item_id for pass 3
const setItemIdByBl = new Map()

for (const row of setRows) {
  const franchiseName    = row.franchise    || 'Unknown'
  const brandName        = row.brand        || 'Sets'
  const colSetName       = row.collectible_set || row.name || ''
  const blId             = row.bricklink_id || null

  const franchiseId     = await resolveOrCreateFranchise(franchiseName, legoSubcatId)
  const brandId         = await resolveOrCreateBrand(brandName, franchiseId)
  const collectibleSetId = colSetName ? await resolveOrCreateCollectibleSet(colSetName, franchiseId, brandId) : null

  // Match existing set
  let setItem = blId ? await findItemByBricklink(blId) : null

  if (setItem) {
    console.log(`  ✓ Set matched  "${row.name || blId}" → ${setItem.item_id}`)
    stats.setsMatched++
    if (blId) setItemIdByBl.set(blId, setItem.item_id)
    continue
  }

  // Create new set item
  if (DRY_RUN) {
    console.log(`  [dry] Set create: "${row.name}" (bl:${blId || '–'})`)
    stats.setsNew++
    if (blId) setItemIdByBl.set(blId, `dry:set:${blId}`)
    continue
  }

  const payload = {
    category_id:        bbCategoryId        || null,
    subcategory_id:     legoSubcatId        || null,
    franchise_id:       !String(franchiseId).startsWith('dry:')     ? franchiseId     : null,
    brand_id:           !String(brandId).startsWith('dry:')         ? brandId         : null,
    collectible_set_id: !String(collectibleSetId || '').startsWith('dry:') ? collectibleSetId : null,
    bricklink_id:       blId,
    lego_set_number:    blId ? blId.replace(/-\d+$/, '') : null,
    description:        row.name || null,
    release_year:       null,
  }
  const { data: created, error } = await supabase.from('items').insert(payload).select('item_id').single()
  if (error) {
    console.error(`  ✗ Set create failed: ${error.message} (row: ${JSON.stringify(row)})`)
    reviewQueue.unresolved.push({ row, reason: `Set create error: ${error.message}` })
    continue
  }
  console.log(`  + Set created  "${row.name || blId}" → ${created.item_id}`)
  stats.setsNew++
  if (blId) {
    setItemIdByBl.set(blId, created.item_id)
    itemByBlCache.set(blId, { item_id: created.item_id, minifig_code: null, subject_id: null })
  }

}

// ── Pass 2: Minifigs ───────────────────────────────────────────────────────────
// Maps (blId|rbId|name+colset) → item_id for pass 3
const figItemIdByBl   = new Map()
const figItemIdByRb   = new Map()

for (const row of minifigRows) {
  const charName     = row.name             || ''
  const blId         = row.bricklink_id    || null
  const rbId         = row.rebrickable_id  || null
  const franchiseName = row.franchise      || 'Unknown'
  const brandName    = row.brand           || 'Minifigures'
  const colSetName   = row.collectible_set || ''

  if (!charName) {
    reviewQueue.unresolved.push({ row, reason: 'Missing name' })
    continue
  }

  // ── Match existing item ──────────────────────────────────────────────────
  let existing = null
  if (rbId) existing = await findItemByRebrickable(rbId)
  if (!existing && blId) existing = await findItemByBricklink(blId)

  if (existing) {
    console.log(`  ✓ Fig matched  "${charName}" → ${existing.item_id} (code: ${existing.minifig_code || '—'})`)
    stats.figsMatched++
    if (blId) figItemIdByBl.set(blId, existing.item_id)
    if (rbId) figItemIdByRb.set(rbId, existing.item_id)

    // Ensure character link exists even for already-matched items
    const franchiseId = await resolveOrCreateFranchise(franchiseName, legoSubcatId)
    const characterId = await resolveOrCreateCharacter(charName, franchiseId)
    if (characterId && !String(characterId).startsWith('dry:') && !DRY_RUN) {
      await supabase.from('item_subjects').upsert(
        { item_id: existing.item_id, subject_id: characterId },
        { onConflict: 'item_id,subject_id', ignoreDuplicates: true }
      )
      if (!existing.subject_id) {
        await supabase.from('items').update({ subject_id: characterId }).eq('item_id', existing.item_id)
      }
    }
    continue
  }

  // ── New minifig — resolve hierarchy + mint code ─────────────────────────
  const franchiseId     = await resolveOrCreateFranchise(franchiseName, legoSubcatId)
  const brandId         = await resolveOrCreateBrand(brandName, franchiseId)
  const collectibleSetId = colSetName ? await resolveOrCreateCollectibleSet(colSetName, franchiseId, brandId) : null

  // Resolve character
  const characterId = await resolveOrCreateCharacter(charName, franchiseId)

  // Mint code
  let minifigCode = null
  const themeAbbrev = await resolveThemeAbbrev(franchiseId, franchiseName)
  if (themeAbbrev && colSetName) {
    const propertyAbbrev = await resolveProperty(colSetName, themeAbbrev, reviewQueue)
    if (propertyAbbrev) {
      const shorthand = deriveShorthand(charName)
      const prefix    = `${themeAbbrev}-${propertyAbbrev}-${shorthand}`

      // Shorthand collision check
      if (!String(characterId).startsWith('dry:')) {
        const collisionName = await checkShorthandCollision(prefix, charName, characterId)
        if (collisionName) {
          reviewQueue.collisions.push({ shorthand, characterName: charName, existingCharacter: collisionName, prefix })
          console.warn(`  ⚠ Shorthand collision: ${prefix} → "${charName}" vs existing "${collisionName}" — minting anyway; review required`)
        }
      }

      if (!DRY_RUN) {
        const nn = await nextNN(prefix)
        minifigCode = `${prefix}-${nn}`
      } else {
        minifigCode = `${themeAbbrev}-${propertyAbbrev}-${shorthand}-XX` // placeholder for dry-run display
      }
      console.log(`  + Code minted: ${minifigCode} for "${charName}"`)
      stats.codesMinted++
    }
  }

  if (DRY_RUN) {
    console.log(`  [dry] Fig create: "${charName}" (code: ${minifigCode || '—'}, bl:${blId || '–'}, rb:${rbId || '–'})`)
    stats.figsNew++
    if (blId) figItemIdByBl.set(blId, `dry:fig:${blId}`)
    if (rbId) figItemIdByRb.set(rbId, `dry:fig:${rbId}`)
    continue
  }

  const payload = {
    category_id:        bbCategoryId        || null,
    subcategory_id:     legoSubcatId        || null,
    franchise_id:       !String(franchiseId).startsWith('dry:')           ? franchiseId     : null,
    brand_id:           !String(brandId).startsWith('dry:')               ? brandId         : null,
    collectible_set_id: !String(collectibleSetId || '').startsWith('dry:') ? collectibleSetId : null,
    subject_id:         !String(characterId || '').startsWith('dry:')     ? characterId     : null,
    bricklink_id:       blId     || null,
    rebrickable_fig_id: rbId     || null,
    description:        charName || null,
    minifig_code:       minifigCode || null,
  }
  const { data: created, error } = await supabase.from('items').insert(payload).select('item_id').single()
  if (error) {
    console.error(`  ✗ Fig create failed: ${error.message} (${charName})`)
    reviewQueue.unresolved.push({ row, reason: `Fig create error: ${error.message}` })
    continue
  }

  console.log(`  + Fig created  "${charName}" → ${created.item_id}`)
  stats.figsNew++

  if (blId) { figItemIdByBl.set(blId, created.item_id); itemByBlCache.set(blId, { item_id: created.item_id, minifig_code: minifigCode, subject_id: characterId }) }
  if (rbId) { figItemIdByRb.set(rbId, created.item_id); itemByRbCache.set(rbId, { item_id: created.item_id, minifig_code: minifigCode, subject_id: characterId }) }

  // Link variant → character
  if (characterId && !String(characterId).startsWith('dry:')) {
    await supabase.from('item_subjects').upsert(
      { item_id: created.item_id, subject_id: characterId },
      { onConflict: 'item_id,subject_id', ignoreDuplicates: true }
    )
    const charKey = charName.toLowerCase()
    if (!subjectCache.has(charKey)) { stats.charactersNew++; subjectCache.set(charKey, characterId) }
    else stats.charactersMatched++
  }

}

// ── Pass 3: Set ↔ Minifig links ───────────────────────────────────────────────
console.log('\nPass 3: Creating set↔minifig links…')

for (const row of minifigRows) {
  if (!row.parent_set) continue

  // Resolve set item_id — try bricklink_id then lego_set_number
  let setItemId = setItemIdByBl.get(row.parent_set) || null
  if (!setItemId) {
    const setItem = await findItemByBricklink(row.parent_set)
    setItemId = setItem?.item_id || null
  }
  if (!setItemId) {
    // parent_set may be just the set number without variant suffix (e.g. "75357")
    const setNum = row.parent_set.replace(/-\d+$/, '')
    const { data: bySn } = await supabase.from('items').select('item_id').eq('lego_set_number', setNum).maybeSingle()
    setItemId = bySn?.item_id || null
  }
  if (!setItemId) {
    reviewQueue.unresolved.push({ row, reason: `Parent set "${row.parent_set}" not found` })
    console.warn(`  ⚠ Parent set not found: ${row.parent_set} for "${row.name}"`)
    continue
  }

  // Resolve minifig item_id
  let figItemId = null
  if (row.rebrickable_id) figItemId = figItemIdByRb.get(row.rebrickable_id) || null
  if (!figItemId && row.bricklink_id) figItemId = figItemIdByBl.get(row.bricklink_id) || null
  if (!figItemId) {
    console.warn(`  ⚠ Minifig item_id not resolved for "${row.name}" — skipping link`)
    reviewQueue.unresolved.push({ row, reason: 'Minifig item_id not resolved for link' })
    continue
  }

  if (String(setItemId).startsWith('dry:') || String(figItemId).startsWith('dry:')) {
    console.log(`  [dry] Link: ${row.parent_set} → ${row.name} (qty: ${row.quantity})`)
    stats.linksUpserted++
    continue
  }

  const { error } = await supabase.from('set_minifigs').upsert(
    { set_item_id: setItemId, minifig_item_id: figItemId, quantity: row.quantity || 1 },
    { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: false }
  )
  if (error) {
    console.error(`  ✗ Link upsert failed: ${error.message}`)
    reviewQueue.unresolved.push({ row, reason: `Link upsert error: ${error.message}` })
  } else {
    console.log(`  ↔ Linked ${row.parent_set} ← "${row.name}" (×${row.quantity || 1})`)
    stats.linksUpserted++
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60))
console.log('IMPORT COMPLETE' + (DRY_RUN ? ' (dry run)' : ''))
console.log('─'.repeat(60))
console.log(`Sets:       ${stats.setsNew} created, ${stats.setsMatched} matched`)
console.log(`Minifigs:   ${stats.figsNew} created, ${stats.figsMatched} matched`)
console.log(`Characters: ${stats.charactersNew} created, ${stats.charactersMatched} matched`)
console.log(`Codes:      ${stats.codesMinted} minted`)
console.log(`Links:      ${stats.linksUpserted} upserted`)

if (reviewQueue.newProperties.length) {
  console.log('\n⚠ NEEDS REVIEW — new provisional properties (confirm or rename in lego_property_registry):')
  for (const p of reviewQueue.newProperties) {
    console.log(`  ${p.theme}-${p.abbreviation}  "${p.fullName}"`)
  }
}
if (reviewQueue.collisions.length) {
  console.log('\n⚠ NEEDS REVIEW — shorthand collisions (two different characters, same code prefix):')
  for (const c of reviewQueue.collisions) {
    console.log(`  ${c.prefix}  "${c.characterName}" vs existing "${c.existingCharacter}"`)
  }
}
if (reviewQueue.unresolved.length) {
  console.log('\n✗ UNRESOLVED ROWS:')
  for (const u of reviewQueue.unresolved) {
    console.log(`  ${u.reason}  →  ${JSON.stringify(u.row)}`)
  }
}

const hasIssues = reviewQueue.newProperties.length + reviewQueue.collisions.length + reviewQueue.unresolved.length > 0
process.exit(hasIssues ? 2 : 0)
