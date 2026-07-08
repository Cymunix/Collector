#!/usr/bin/env node
// scripts/set-lego-retail-prices.mjs
// Backfills items.retail_price for LEGO sets from a CSV of `set_number,retail_price`.
// Matches on items.lego_set_number (applies to every variant sharing that number).
// Requires the retail_price column (migration 20260706_add_retail_price.sql).
//
// Run:   node scripts/set-lego-retail-prices.mjs --file path/to/prices.csv [--dry-run]

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const argv = process.argv.slice(2)
const DRY_RUN = argv.includes('--dry-run')
const fileArg = (() => { const i = argv.indexOf('--file'); return i >= 0 ? argv[i + 1] : undefined })()
if (!fileArg) { console.error('Usage: node scripts/set-lego-retail-prices.mjs --file prices.csv [--dry-run]'); process.exit(1) }

const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
}))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
if (DRY_RUN) console.log('DRY RUN — no writes.\n')

// Fail fast if the column isn't there yet.
const probe = await sb.from('items').select('retail_price').limit(1)
if (probe.error) { console.error(`retail_price column missing — apply migration 20260706_add_retail_price.sql first. (${probe.error.message})`); process.exit(1) }

const lines = fs.readFileSync(path.resolve(fileArg), 'utf8').replace(/\r/g, '').trim().split('\n')
const header = lines[0].toLowerCase().split(',').map(s => s.trim())
const iNum = header.findIndex(h => ['set_number', 'number', 'lego_set_number'].includes(h))
const iPrice = header.findIndex(h => ['retail_price', 'price', 'msrp', 'rrp', 'retail'].includes(h))
if (iNum < 0 || iPrice < 0) { console.error('CSV needs set_number and retail_price columns.'); process.exit(1) }

let updated = 0, matchedNumbers = 0, unmatched = []
for (const line of lines.slice(1)) {
  if (!line.trim()) continue
  const f = line.split(',')
  const num = (f[iNum] || '').trim()
  const price = Number((f[iPrice] || '').trim())
  if (!num || !Number.isFinite(price)) continue
  if (DRY_RUN) { matchedNumbers++; continue }
  const { data, error } = await sb.from('items')
    .update({ retail_price: price }).eq('lego_set_number', num).select('item_id')
  if (error) { unmatched.push(`${num}: ${error.message}`); continue }
  if (data?.length) { matchedNumbers++; updated += data.length }
  else unmatched.push(`${num}: no catalog item with that set number`)
}

console.log(`\nSet numbers priced: ${matchedNumbers}`)
console.log(`Item rows updated:  ${updated}${DRY_RUN ? ' (dry-run: not written)' : ''}`)
if (unmatched.length) {
  console.log(`\nUnmatched (${unmatched.length}):`)
  for (const u of unmatched.slice(0, 30)) console.log(`  ${u}`)
  if (unmatched.length > 30) console.log(`  …and ${unmatched.length - 30} more`)
}
