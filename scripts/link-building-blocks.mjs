#!/usr/bin/env node
// scripts/link-building-blocks.mjs
//
// Backfill set↔item containment links from a Building Blocks spreadsheet's
// "Included In" (child → parent codes) and "Includes" (parent → child codes)
// columns, against items ALREADY imported. Idempotent — safe to re-run.
//
//   Minifig ↔ Set        → set_minifigs(set_item_id, minifig_item_id)
//   Set/Misc ↔ Set/Misc  → set_contents(parent_item_id, child_item_id)  (value packs, magnet sets)
//
// Codes are resolved across minifig_code / lego_set_number / bricklink_id, so
// insertion order is irrelevant and multi-value cells ("7977, 7984") are handled.
//
// Run:  node scripts/link-building-blocks.mjs --file "F:/Building Blocks.xlsx" [--dry-run]
// (set_contents links require the 20260718_set_contents.sql migration to be applied.)

import fs from 'node:fs'
import path from 'node:path'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined }
const DRY_RUN = argv.includes('--dry-run')
const FILE = arg('file') || 'F:/Building Blocks.xlsx'

const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env.local'), 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  }))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const clean = (v) => (v == null ? '' : String(v)).trim()
const splitCodes = (v) => clean(v).split(/[,;]/).map(s => s.trim()).filter(Boolean)

const codeCache = new Map()
async function resolveByCode(raw) {
  const c = clean(raw); if (!c) return null
  const key = c.toLowerCase()
  if (codeCache.has(key)) return codeCache.get(key)
  let hit = null
  const { data: byFig } = await sb.from('items').select('item_id, minifig_code').eq('minifig_code', c).maybeSingle()
  if (byFig) hit = { itemId: byFig.item_id, isMinifig: true }
  if (!hit) {
    const setNum = c.replace(/-\d+$/, '')
    const { data: bySet } = await sb.from('items').select('item_id, minifig_code').eq('lego_set_number', setNum).maybeSingle()
    if (bySet) hit = { itemId: bySet.item_id, isMinifig: !!bySet.minifig_code }
  }
  if (!hit) {
    const { data: byBl } = await sb.from('items').select('item_id, minifig_code').eq('bricklink_id', c).maybeSingle()
    if (byBl) hit = { itemId: byBl.item_id, isMinifig: !!byBl.minifig_code }
  }
  codeCache.set(key, hit)
  return hit
}

const stats = { setMinifig: 0, setContents: 0, unresolved: 0, errors: 0 }
async function linkPair(parent, child) {
  if (!parent || !child || parent.itemId === child.itemId) return
  const minifigLink = child.isMinifig && !parent.isMinifig
  if (DRY_RUN) { minifigLink ? stats.setMinifig++ : stats.setContents++; return }
  if (minifigLink) {
    const { error } = await sb.from('set_minifigs').upsert(
      { set_item_id: parent.itemId, minifig_item_id: child.itemId, quantity: 1 },
      { onConflict: 'set_item_id,minifig_item_id', ignoreDuplicates: true })
    error ? stats.errors++ : stats.setMinifig++
    if (error) console.warn('set_minifigs:', error.message)
  } else {
    const { error } = await sb.from('set_contents').upsert(
      { parent_item_id: parent.itemId, child_item_id: child.itemId, quantity: 1 },
      { onConflict: 'parent_item_id,child_item_id', ignoreDuplicates: true })
    if (error) { stats.errors++; console.warn('set_contents:', error.message, '(is the migration applied?)') }
    else stats.setContents++
  }
}

const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets[XLSX.readFile(FILE).SheetNames[0]], { defval: '' })
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Linking from ${FILE} (${rows.length} rows)\n`)
for (const r of rows) {
  const idNum = clean(r['ID Number'])
  if (!idNum) continue
  const self = await resolveByCode(idNum)
  if (!self) { stats.unresolved++; continue }
  for (const code of splitCodes(r['Included In'])) { // parent contains self
    const parent = await resolveByCode(code)
    if (!parent) { stats.unresolved++; continue }
    await linkPair(parent, self)
  }
  for (const code of splitCodes(r['Includes'])) {     // self contains child
    const child = await resolveByCode(code)
    if (!child) { stats.unresolved++; continue }
    await linkPair(self, child)
  }
}
console.log(`\nset_minifigs links: ${stats.setMinifig}`)
console.log(`set_contents links: ${stats.setContents}`)
console.log(`unresolved codes:   ${stats.unresolved}`)
console.log(`errors:             ${stats.errors}`)
