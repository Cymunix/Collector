#!/usr/bin/env node
// scripts/seed-star-wars-taxonomy.mjs
//
// Seed the Star Wars IP hierarchy: Franchise → Subfranchise (subsets) → Property
// (properties, each linked to its subfranchise via subset_id). Idempotent.
//
// Run: node scripts/seed-star-wars-taxonomy.mjs [--dry-run]

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry-run')
const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env.local'), 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  }))
const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

const FRANCHISE = 'Star Wars'
const HIERARCHY = {
  'The High Republic':       ['The High Republic', 'Young Jedi Adventures', 'The Acolyte'],
  'Fall of the Jedi':        ['The Phantom Menace', 'Tales of the Jedi', 'Attack of the Clones', 'The Clone Wars', 'Revenge of the Sith'],
  'Reign of the Empire':     ['Tales of the Underworld', 'Tales of the Empire', 'The Bad Batch', 'Shadow of the Sith', 'Jedi: Fallen Order', 'Solo', 'Beyond Victory', 'Obi-Wan Kenobi', 'Jedi: Survivor', 'Andor', 'Rebels', 'Vader Immortal', 'Rogue One'],
  'Age of Rebellion':        ['A New Hope', 'The Empire Strikes Back', 'Outlaws', 'Return of the Jedi', 'Battlefront II', 'Squadrons'],
  'The New Republic':        ['The Mandalorian', 'The Book of Boba Fett', 'Ahsoka', 'Skeleton Crew'],
  'Rise of the First Order': ['Resistance', 'The Force Awakens', 'The Last Jedi', "Star Wars: Galaxy's Edge", 'The Rise of Skywalker'],
  'Legends':                 [],
}

async function main() {
  // 1. Franchise
  let { data: fr } = await sb.from('franchises').select('franchise_id').ilike('name', FRANCHISE).limit(1).maybeSingle()
  if (!fr && !DRY) {
    const { data } = await sb.from('franchises').insert({ name: FRANCHISE }).select('franchise_id').single()
    fr = data
  }
  const franchiseId = fr?.franchise_id
  console.log(`Franchise "${FRANCHISE}": ${franchiseId || '(dry)'}`)

  let subs = 0, props = 0
  for (const [subName, properties] of Object.entries(HIERARCHY)) {
    // 2. Subfranchise (subsets)
    let { data: sub } = await sb.from('subsets').select('subset_id').ilike('name', subName).eq('franchise_id', franchiseId).limit(1).maybeSingle()
    if (!sub && !DRY) {
      const { data } = await sb.from('subsets').insert({ name: subName, franchise_id: franchiseId }).select('subset_id').single()
      sub = data
    }
    const subsetId = sub?.subset_id
    subs++
    console.log(`  Subfranchise "${subName}" (${properties.length} properties)`)

    // 3. Properties (properties table, linked to the subfranchise)
    for (const propName of properties) {
      const { data: existing } = await sb.from('properties').select('property_id').ilike('name', propName).eq('franchise_id', franchiseId).limit(1).maybeSingle()
      if (existing) {
        if (!DRY) await sb.from('properties').update({ subset_id: subsetId }).eq('property_id', existing.property_id)
      } else if (!DRY) {
        await sb.from('properties').insert({ name: propName, franchise_id: franchiseId, subset_id: subsetId })
      }
      props++
    }
  }
  console.log(`\n${DRY ? '[DRY RUN] ' : ''}Subfranchises: ${subs} · Properties: ${props}`)
}
main().catch(e => { console.error('ERR', e.message); process.exit(1) })
