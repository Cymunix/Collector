#!/usr/bin/env node
// scripts/seed-star-wars-factions.mjs
// Seeds Star Wars faction teams for the Star Wars franchise.
// Safe to re-run — uses upsert on name+franchise_id to skip existing rows.
// Run: node scripts/seed-star-wars-factions.mjs [--dry-run]

import fs   from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

const envRaw = fs.readFileSync(path.resolve('.env.local'), 'utf8')
const env    = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const FACTIONS = [
  // Government / Military
  'Galactic Republic',
  'Confederacy of Independent Systems (Separatists)',
  'Separatist Droid Army',
  'Trade Federation',
  'Techno Union',
  'Banking Clan',
  'Galactic Empire',
  'Imperial Remnant / Warlords',
  'Rebel Alliance',
  'New Republic',
  'First Order',
  'Resistance',
  'Sith Eternal / Final Order',
  // Force Orders
  'Jedi Order',
  'Jedi Order (High Republic)',
  'Sith Order',
  'The Inquisitorius',
  'Knights of Ren',
  'Nightsisters of Dathomir',
  'Guardians of the Whills',
  'Church of the Force',
  'The Path of the Open Hand',
  // Mandalorian
  'Mandalorians (Clans)',
  'Death Watch',
  'Nite Owls',
  'Children of the Watch',
  'Imperial Super Commandos',
  // Criminal / Underworld
  'Hutt Cartel',
  'Crimson Dawn',
  'Pyke Syndicate',
  'Black Sun',
  "Bounty Hunters' Guild",
  // Species / Tribal
  'Gungans',
  'Naboo Royal Security',
  'Ewoks',
  'Wookiees',
  'Tusken Raiders',
  'Jawas',
  // Special Units
  'Clone Force 99 (The Bad Batch)',
  // Rebel Cells
  "Partisans (Saw Gerrera's)",
  'The Path',
  // High Republic
  'The Nihil',
  'Great Mothers / Nightsisters of Peridea',
  // Clone Legions
  '501st Legion',
  '212th Attack Battalion',
  '327th Star Corps',
  '41st Elite Corps',
  '104th Battalion (Wolfpack)',
  'Coruscant Guard (Shock Troopers)',
  'Galactic Marines (21st Nova Corps)',
  '187th Legion',
  '91st Reconnaissance Corps',
  '442nd Siege Battalion',
  // Clone Special Forces
  'ARC Troopers',
  'Republic Commandos',
  'ARF Troopers',
]

// ── Find Star Wars franchise ───────────────────────────────────────────────
const { data: franchise, error: frErr } = await supabase
  .from('franchises')
  .select('franchise_id, name')
  .ilike('name', 'Star Wars')
  .limit(1)
  .maybeSingle()

if (frErr || !franchise) {
  console.error('Could not find Star Wars franchise:', frErr?.message || 'no match')
  process.exit(1)
}
console.log(`Found franchise: "${franchise.name}" (${franchise.franchise_id})`)

// ── Load existing teams to skip duplicates ─────────────────────────────────
const { data: existing } = await supabase
  .from('teams')
  .select('name')
  .eq('franchise_id', franchise.franchise_id)

const existingNames = new Set((existing || []).map(t => t.name.toLowerCase()))

const toInsert = FACTIONS.filter(name => !existingNames.has(name.toLowerCase()))
const skipped  = FACTIONS.length - toInsert.length

console.log(`${FACTIONS.length} factions total — ${skipped} already exist, ${toInsert.length} to insert`)

if (toInsert.length === 0) {
  console.log('Nothing to do.')
  process.exit(0)
}

if (DRY_RUN) {
  console.log('\n[dry-run] Would insert:')
  toInsert.forEach(name => console.log(`  + ${name}`))
  process.exit(0)
}

// ── Insert in one batch ────────────────────────────────────────────────────
const payload = toInsert.map(name => ({ name, franchise_id: franchise.franchise_id }))
const { error: insertErr } = await supabase.from('teams').insert(payload)

if (insertErr) {
  console.error('Insert failed:', insertErr.message)
  process.exit(1)
}

console.log(`\n✓ Inserted ${toInsert.length} faction(s):`)
toInsert.forEach(name => console.log(`  + ${name}`))
