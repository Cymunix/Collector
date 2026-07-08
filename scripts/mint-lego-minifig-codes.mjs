#!/usr/bin/env node
// scripts/mint-lego-minifig-codes.mjs
// Backfills items.minifig_code for LEGO minifigs that don't have one.
// Code format: THEME-PROPERTY-SHORTHAND-NN  (e.g. SW-EPIV-LUKE-01)
//   THEME    = franchise.lego_abbreviation  (set here for known franchises)
//   PROPERTY = lego_property_registry match on the collectible_set (subtheme),
//              else an auto-derived provisional abbreviation (flagged for review)
//   SHORTHAND= first 4 alnum of the character name (honorifics stripped)
//   NN       = per-prefix sequence
//
// Idempotent: only mints for minifigs whose minifig_code IS NULL, and NN
// continues past any existing codes for the same prefix.
//
// Run:   node scripts/mint-lego-minifig-codes.mjs [--dry-run]

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
}))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
if (DRY_RUN) console.log('DRY RUN — no writes.\n')

// Franchise → theme abbreviation. Extend as new LEGO themes are added.
const FRANCHISE_ABBREV = {
  'star wars': 'SW',
  'collectable minifigures': 'CMF',
  'collectible minifigures': 'CMF',
}

const HONORIFICS = [
  'Grand Admiral','Grand Moff','Grand Master','Fleet Admiral','High Admiral',
  'Admiral','General','Captain','Commander','Lieutenant Colonel','Lieutenant',
  'Sergeant Major','Sergeant','Major','Colonel','Corporal','Private',
  'Emperor','Empress','High Emperor','Darth','Sith Lord','Count','Countess',
  'Duke','Duchess','King','Queen','Prince','Princess','Master','Jedi Master',
  'Jedi Knight','Jedi','Lord','Lady','Doctor','Dr','Director',
].sort((a, b) => b.length - a.length)

function deriveShorthand(name) {
  const aliasMatch = (name || '').match(/\(([^)]+)\)/)
  let s = aliasMatch ? aliasMatch[1] : (name || '')
  for (const h of HONORIFICS) {
    const re = new RegExp(`^${h}\\s+`, 'i')
    if (re.test(s)) { s = s.replace(re, ''); break }
  }
  return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'UNKN'
}
const deriveProvisionalAbbrev = (name) =>
  (name || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'UNKN'

async function loadAll(table, cols, filter) {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(cols).range(from, from + 999)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) { console.error(`load ${table}:`, error.message); break }
    if (!data?.length) break
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

// ── 1. Ensure franchise abbreviations ────────────────────────────────────────
const { data: bb } = await sb.from('categories').select('category_id').ilike('name', 'Building Blocks').maybeSingle()
const { data: franchises } = await sb.from('franchises').select('franchise_id, name, lego_abbreviation')
const franchiseAbbr = {}
for (const f of franchises) {
  const want = FRANCHISE_ABBREV[(f.name || '').toLowerCase()]
  let abbr = f.lego_abbreviation
  if (!abbr && want) {
    if (!DRY_RUN) await sb.from('franchises').update({ lego_abbreviation: want }).eq('franchise_id', f.franchise_id)
    abbr = want
    console.log(`Set ${f.name} lego_abbreviation = ${want}`)
  }
  franchiseAbbr[f.franchise_id] = abbr || (f.name ? deriveProvisionalAbbrev(f.name) : null)
}

// ── 2. Lookups ───────────────────────────────────────────────────────────────
const subjectsList = await loadAll('subjects', 'subject_id, subject_name')
const subjectName = Object.fromEntries(subjectsList.map(s => [s.subject_id, s.subject_name]))
const colSets = await loadAll('collectible_sets', 'collectible_set_id, name')
const colSetName = Object.fromEntries(colSets.map(c => [c.collectible_set_id, c.name]))
const { data: registry } = await sb.from('lego_property_registry').select('abbreviation, theme_abbreviation, full_name')

// Star Wars "Episode X" subthemes → the confirmed registry movie properties.
const EPISODE_MAP = {
  'episode i': 'TPM', 'episode ii': 'AOTC', 'episode iii': 'ROTS',
  'episode iv': 'EPIV', 'episode v': 'EPV', 'episode vi': 'EPVI',
  'episode vii': 'EPVII', 'episode viii': 'EPVIII', 'episode ix': 'EPIX',
}

// Resolve a subtheme name → property abbreviation.
const propCache = new Map()   // `${theme}::${subthemeLc}` → abbrev
const usedAbbr = new Set((registry || []).map(r => r.abbreviation))
const newProvisional = []     // { abbreviation, theme, full_name }
function uniqueAbbr(base, subthemeLc) {
  // reuse if the same base already maps to this exact full_name; else bump.
  let a = base, n = 1
  while (usedAbbr.has(a) && !(registry || []).some(r => r.abbreviation === a && r.full_name.toLowerCase() === subthemeLc)) {
    n += 1; a = base.slice(0, Math.max(1, 5 - String(n).length)) + n
  }
  return a
}
function resolveProperty(theme, subtheme) {
  const key = `${theme}::${(subtheme || '').toLowerCase()}`
  if (propCache.has(key)) return propCache.get(key)
  const lc = (subtheme || '').toLowerCase()

  // 1. Star Wars Episode → confirmed movie property.
  if (theme === 'SW' && EPISODE_MAP[lc]) { propCache.set(key, EPISODE_MAP[lc]); return EPISODE_MAP[lc] }
  // 2. "Series N" → S{N} (keeps CMF series distinct and readable).
  const seriesM = lc.match(/^series\s+(\d+)$/)
  if (seriesM) {
    const abbr = `S${seriesM[1]}`
    if (!usedAbbr.has(abbr)) { usedAbbr.add(abbr); newProvisional.push({ abbreviation: abbr, theme, full_name: subtheme }); registry.push({ abbreviation: abbr, theme_abbreviation: theme, full_name: subtheme }) }
    propCache.set(key, abbr); return abbr
  }
  // 3. Registry match by name.
  const hit = (registry || []).find(r => r.theme_abbreviation === theme &&
    (r.full_name.toLowerCase() === lc || r.full_name.toLowerCase().includes(lc) || lc.includes(r.full_name.toLowerCase())))
  if (hit) { propCache.set(key, hit.abbreviation); return hit.abbreviation }
  // 4. Provisional — derive and guarantee uniqueness.
  const abbr = uniqueAbbr(deriveProvisionalAbbrev(subtheme), lc)
  usedAbbr.add(abbr)
  newProvisional.push({ abbreviation: abbr, theme, full_name: subtheme })
  registry.push({ abbreviation: abbr, theme_abbreviation: theme, full_name: subtheme })
  propCache.set(key, abbr)
  return abbr
}

// ── 3. Minifigs needing a code ───────────────────────────────────────────────
const minifigs = await loadAll('items',
  'item_id, subject_id, collectible_set_id, franchise_id, minifig_code, rebrickable_fig_id',
  (q) => q.eq('category_id', bb.category_id).not('rebrickable_fig_id', 'is', null).is('minifig_code', null))
minifigs.sort((a, b) => a.item_id < b.item_id ? -1 : 1)   // deterministic NN order
console.log(`\nMinifigs to mint: ${minifigs.length}`)

// Seed NN counters from any codes that already exist.
const nnByPrefix = {}
const { data: existingCodes } = await sb.from('items').select('minifig_code').not('minifig_code', 'is', null)
for (const r of existingCodes || []) {
  const m = r.minifig_code.match(/^(.*)-(\d+)$/)
  if (m) nnByPrefix[m[1]] = Math.max(nnByPrefix[m[1]] || 0, parseInt(m[2], 10))
}

// ── 4. Mint ──────────────────────────────────────────────────────────────────
let minted = 0, skipped = 0
const updates = []
for (const fig of minifigs) {
  const theme = franchiseAbbr[fig.franchise_id]
  const charName = subjectName[fig.subject_id]
  const subtheme = colSetName[fig.collectible_set_id]
  if (!theme || !charName || !subtheme) { skipped++; continue }
  const property = resolveProperty(theme, subtheme)
  const shorthand = deriveShorthand(charName)
  const prefix = `${theme}-${property}-${shorthand}`
  const nn = (nnByPrefix[prefix] || 0) + 1
  nnByPrefix[prefix] = nn
  const code = `${prefix}-${String(nn).padStart(2, '0')}`
  updates.push({ item_id: fig.item_id, code })
  minted++
}

console.log(`Will mint: ${minted} | skipped (missing theme/subject/subtheme): ${skipped}`)
console.log(`New provisional properties: ${newProvisional.length}`)
if (updates.length) console.log('Sample codes:', updates.slice(0, 8).map(u => u.code).join(', '))

if (!DRY_RUN) {
  let done = 0
  for (const u of updates) {
    const { error } = await sb.from('items').update({ minifig_code: u.code }).eq('item_id', u.item_id)
    if (error) console.error(`  ✗ ${u.item_id.slice(0, 8)}: ${error.message}`)
    else if (++done % 200 === 0) console.log(`  …${done}/${updates.length}`)
  }
  // Persist provisional property entries for review.
  if (newProvisional.length) {
    await sb.from('lego_property_registry').upsert(
      newProvisional.map(p => ({ abbreviation: p.abbreviation, theme_abbreviation: p.theme, full_name: p.full_name, status: 'provisional' })),
      { onConflict: 'abbreviation', ignoreDuplicates: true })
  }
  console.log(`\n✓ Minted ${done} codes.`)
}

if (newProvisional.length) {
  console.log(`\n⚠ Provisional properties (review in lego_property_registry):`)
  for (const p of newProvisional.slice(0, 40)) console.log(`  ${p.theme}-${p.abbreviation}  "${p.full_name}"`)
  if (newProvisional.length > 40) console.log(`  …and ${newProvisional.length - 40} more`)
}
process.exit(0)
