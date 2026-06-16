#!/usr/bin/env node
// scripts/backfill-rebrickable.mjs
// Match CMF items in Supabase to Rebrickable fig_nums using the bulk minifigs.csv download.
// Download minifigs.csv from https://rebrickable.com/downloads/ and place in ~/Downloads/
// Or set MINIFIGS_CSV env var to point to it directly.

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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

const MINIFIGS_CSV = process.env.MINIFIGS_CSV || path.join(
  process.env.USERPROFILE || process.env.HOME || '.',
  'Downloads', 'minifigs.csv'
)

if (!SUPABASE_URL) { console.error('VITE_SUPABASE_URL not set'); process.exit(1) }
if (!fs.existsSync(MINIFIGS_CSV)) {
  console.error(`minifigs.csv not found at: ${MINIFIGS_CSV}`)
  console.error('Download from https://rebrickable.com/downloads/ or set MINIFIGS_CSV env var.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── CSV parser (handles quoted fields with commas) ─────────────────────────
function parseCSVLine(line) {
  const fields = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { fields.push(cur); cur = '' }
    else { cur += ch }
  }
  fields.push(cur)
  return fields
}

// ── load and index minifigs.csv ────────────────────────────────────────────
// CSV format: fig_num,name,num_parts,img_url
console.log(`Reading ${MINIFIGS_CSV} …`)
const lines = fs.readFileSync(MINIFIGS_CSV, 'utf8').trim().split('\n').slice(1)

// Primary index: normalized name → entries
const byName = new Map()
// Secondary index: name with spaces removed (to handle "Cave Man" ↔ "Caveman")
const byNameNoSpaces = new Map()
// All entries as list for substring search
const allEntries = []

for (const line of lines) {
  if (!line.trim()) continue
  const [fig_num, name, num_parts_str, img_url] = parseCSVLine(line)
  if (!fig_num || !name) continue
  const entry = { fig_num: fig_num.trim(), name: name.trim(), num_parts: Number(num_parts_str) || null, img_url: (img_url || '').trim() }

  const key = name.trim().toLowerCase()
  if (!byName.has(key)) byName.set(key, [])
  byName.get(key).push(entry)

  // Index base name (strip trailing CMF/parens) without spaces
  const base = key.replace(/\s*\(.*?\)\s*$/, '').trim()
  const nosp = base.replace(/\s+/g, '')
  if (nosp) {
    if (!byNameNoSpaces.has(nosp)) byNameNoSpaces.set(nosp, [])
    byNameNoSpaces.get(nosp).push(entry)
  }

  allEntries.push({ key, entry })
}
console.log(`Loaded ${lines.length} figs, ${byName.size} unique names.\n`)

// ── helpers ────────────────────────────────────────────────────────────────

// Multi-stage name lookup. Tries in order until a unique or best match is found.
// Returns: { candidates, matchType } or null.
function lookupByName(rawName) {
  if (!rawName) return null
  const base = rawName.trim().toLowerCase()
  const baseStripped = base.replace(/\s*\(.*?\)\s*$/, '').trim()
  const baseFb = base.replace(/\bsoccer\b/g, 'football')
  const baseNoSp = base.replace(/\s+/g, '')

  // Ordered from most to least specific
  const nameTries = [
    [base,                      'exact'],
    [base + ' (cmf)',           '+cmf'],
    [baseStripped,              'stripped'],
    [baseStripped + ' (cmf)',   'stripped+cmf'],
    [baseFb,                    'football'],
    [baseFb + ' (cmf)',         'football+cmf'],
  ]
  for (const [key, matchType] of nameTries) {
    if (!key) continue
    const hits = byName.get(key)
    if (hits) return { candidates: hits, matchType }
  }

  // No-spaces match: "Caveman" → "Cave Man (CMF)"
  if (baseNoSp) {
    const hits = byNameNoSpaces.get(baseNoSp)
    if (hits) {
      // Prefer CMF-tagged entries; if exactly one CMF, return it
      const cmf = hits.filter(h => h.name.toLowerCase().includes('(cmf)'))
      return { candidates: cmf.length ? cmf : hits, matchType: 'no-spaces' }
    }
  }

  // Substring: "Ringmaster" within "Circus Ringmaster", "Maraca Man" within "Mariachi / Maraca Man"
  // Only if base is at least 5 chars to avoid false positives
  if (base.length >= 5) {
    const subHits = allEntries
      .filter(({ key }) => key.includes(base))
      .map(({ entry }) => entry)
    if (subHits.length) {
      // Deduplicate by fig_num
      const seen = new Set()
      const uniq = subHits.filter(e => seen.has(e.fig_num) ? false : seen.add(e.fig_num))
      // Prefer CMF-tagged
      const cmf = uniq.filter(h => h.name.toLowerCase().includes('(cmf)'))
      return { candidates: cmf.length ? cmf : uniq, matchType: 'substring' }
    }
  }

  return null
}

// ── load items from Supabase ───────────────────────────────────────────────
console.log('Fetching items from Supabase …')
const { data: items, error: fetchErr } = await supabase
  .from('items')
  .select('item_id, bricklink_id, rebrickable_fig_id, piece_count, subjects(subject_name)')
  .like('bricklink_id', 'col%')
  .is('rebrickable_fig_id', null)

if (fetchErr) { console.error('Fetch failed:', fetchErr.message); process.exit(1) }
console.log(`Items to process: ${items.length}\n`)

const unmatched = []
let matched = 0

for (const item of items) {
  const { item_id, bricklink_id, piece_count } = item
  const subjectName = item.subjects?.subject_name || ''
  process.stdout.write(`${bricklink_id} "${subjectName}" … `)

  const result = lookupByName(subjectName)

  if (!result) {
    console.log('no name match')
    unmatched.push({ bricklink_id, subject: subjectName, reason: 'no_name_match' })
    continue
  }

  let { candidates, matchType } = result

  // Disambiguate: if multiple candidates, prefer CMF-tagged one
  if (candidates.length > 1) {
    const cmf = candidates.filter(c => c.name.toLowerCase().includes('(cmf)'))
    if (cmf.length === 1) { candidates = cmf; matchType += '→cmf-pick' }
  }

  if (candidates.length > 1) {
    const nums = candidates.map(c => `${c.fig_num}:"${c.name}"`).join(' | ')
    console.log(`ambiguous (${nums})`)
    unmatched.push({ bricklink_id, subject: subjectName, reason: `ambiguous: ${candidates.map(c=>c.fig_num).join('|')}` })
    continue
  }

  const fig = candidates[0]

  // ── update items.rebrickable_fig_id (and piece_count if missing) ──
  const itemUpdate = { rebrickable_fig_id: fig.fig_num }
  if (piece_count == null && fig.num_parts) itemUpdate.piece_count = fig.num_parts

  const { error: updErr } = await supabase
    .from('items')
    .update(itemUpdate)
    .eq('item_id', item_id)

  if (updErr) {
    console.log(`update failed: ${updErr.message}`)
    unmatched.push({ bricklink_id, subject: subjectName, reason: `update_failed: ${updErr.message}` })
    continue
  }

  // ── insert front image (position 0) if not already set ──
  if (fig.img_url) {
    const { data: existing } = await supabase
      .from('item_images')
      .select('item_image_id')
      .eq('item_id', item_id)
      .eq('position', 0)
      .maybeSingle()

    if (!existing) {
      const { error: imgErr } = await supabase.from('item_images').insert({
        item_id,
        image_path: fig.img_url,
        position:   0,
      })
      if (imgErr) console.warn(`  image insert failed: ${imgErr.message}`)
    }
  }

  const flag = matchType === 'stripped' ? ' [stripped]' : ''
  console.log(`✓  ${fig.fig_num}${flag}`)
  matched++
}

// ── write unmatched.csv ────────────────────────────────────────────────────
if (unmatched.length) {
  const rows = ['bricklink_id,subject,reason',
    ...unmatched.map(r => `${r.bricklink_id},"${(r.subject || '').replace(/"/g, '""')}","${r.reason}"`)
  ]
  fs.writeFileSync('unmatched.csv', rows.join('\n'), 'utf8')
}

console.log(`\nMatched: ${matched}   Unmatched: ${unmatched.length}`)
if (unmatched.length) console.log('Details → unmatched.csv')
