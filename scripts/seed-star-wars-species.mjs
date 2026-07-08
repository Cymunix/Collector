#!/usr/bin/env node
// scripts/seed-star-wars-species.mjs
// Seeds the Star Wars species list into the species table.
// Safe to re-run — uses upsert on (name, franchise_id).
// Run: node scripts/seed-star-wars-species.mjs [--dry-run]

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env    = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const SPECIES = [
  { name: 'Human',                       notes: 'The majority of named characters' },
  { name: 'Droid',                       notes: 'All droids — astromech, protocol, battle, assassin, etc.' },
  { name: 'Wookiee',                     notes: 'e.g. Chewbacca' },
  { name: "Twi'lek",                     notes: 'e.g. Aayla Secura, Hera Syndulla' },
  { name: 'Zabrak',                      notes: 'e.g. Darth Maul, Eeth Koth' },
  { name: 'Togruta',                     notes: 'e.g. Ahsoka Tano, Shaak Ti' },
  { name: 'Rodian',                      notes: 'e.g. Greedo' },
  { name: 'Gungan',                      notes: 'e.g. Jar Jar Binks' },
  { name: 'Ewok',                        notes: 'e.g. Wicket' },
  { name: 'Jawa',                        notes: null },
  { name: 'Tusken Raider',               notes: 'Sand People' },
  { name: 'Mon Calamari',                notes: 'e.g. Admiral Ackbar' },
  { name: 'Trandoshan',                  notes: 'e.g. Bossk' },
  { name: 'Chiss',                       notes: 'e.g. Grand Admiral Thrawn' },
  { name: "Yoda's Species",              notes: 'e.g. Yoda, Grogu' },
  { name: 'Kel Dor',                     notes: 'e.g. Plo Koon' },
  { name: 'Nautolan',                    notes: 'e.g. Kit Fisto' },
  { name: 'Geonosian',                   notes: null },
  { name: 'Hutt',                        notes: 'e.g. Jabba' },
  { name: 'Kaminoan',                    notes: null },
  { name: 'Nikto',                       notes: null },
  { name: 'Weequay',                     notes: null },
  { name: 'Gamorrean',                   notes: null },
  { name: 'Mandalorian (species/culture)', notes: 'Often a culture not a species; use if species is unclear' },
]

// ── Find Star Wars franchise ───────────────────────────────────────────────
const { data: franchise, error: frErr } = await supabase
  .from('franchises').select('franchise_id, name').ilike('name', 'Star Wars').limit(1).maybeSingle()

if (frErr || !franchise) {
  console.error('Could not find Star Wars franchise:', frErr?.message || 'no match')
  process.exit(1)
}
console.log(`Found franchise: "${franchise.name}" (${franchise.franchise_id})`)

if (DRY_RUN) {
  console.log(`\n[dry-run] Would upsert ${SPECIES.length} species:`)
  SPECIES.forEach(s => console.log(`  + ${s.name}`))
  process.exit(0)
}

// ── Upsert all species ─────────────────────────────────────────────────────
const payload = SPECIES.map(s => ({ ...s, franchise_id: franchise.franchise_id }))
const { data: upserted, error: upsertErr } = await supabase
  .from('species')
  .upsert(payload, { onConflict: 'name,franchise_id', ignoreDuplicates: false })
  .select('species_id, name')

if (upsertErr) {
  console.error('Upsert failed:', upsertErr.message)
  process.exit(1)
}

console.log(`\n✓ Upserted ${upserted?.length ?? SPECIES.length} species:`)
;(upserted || SPECIES).forEach(s => console.log(`  + ${s.name}`))
