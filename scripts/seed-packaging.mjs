#!/usr/bin/env node
// scripts/seed-packaging.mjs
// Seeds the packaging types (Box / Polybag / Blister pack) into collectible_sets,
// which is repurposed to mean PACKAGING in the faceted-classification model.
// Requires migration 20260711_faceted_classification.sql (makes brand_id nullable).
// Safe to re-run.
//
// Run:  node scripts/seed-packaging.mjs

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
}))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const PACKAGING = ['Box', 'Polybag', 'Blister pack']

for (const name of PACKAGING) {
  const { data: existing } = await sb.from('collectible_sets').select('collectible_set_id').ilike('name', name).maybeSingle()
  if (existing) { console.log(`= exists   ${name}`); continue }
  const { error } = await sb.from('collectible_sets').insert({ name, brand_id: null, franchise_id: null })
  if (error) {
    console.error(`✗ ${name}: ${error.message}`)
    if (/brand_id/.test(error.message)) console.error('  → collectible_sets.brand_id is still NOT NULL — the migration ALTER did not apply. Re-run the migration.')
    process.exit(1)
  }
  console.log(`+ inserted ${name}`)
}
console.log('\nPackaging seeded.')
