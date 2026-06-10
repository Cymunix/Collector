#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import zlib from 'node:zlib'
import { createClient } from '@supabase/supabase-js'
import { chain } from 'stream-chain'
import { parser } from 'stream-json'
import { streamArray } from 'stream-json/streamers/stream-array.js'

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = 'true'
      continue
    }

    args[key] = next
    i += 1
  }
  return args
}

function printHelp() {
  console.log(`Scryfall bulk importer

Usage:
  node scripts/import-scryfall-bulk.mjs --api-key <catalog_api_key> --file <path/to/all_cards.json|.json.gz> [options]

Required:
  --api-key           Catalog API key from create_catalog_api_key
  --file              Local Scryfall bulk card file (JSON array; .gz supported)

Optional:
  --category          Catalog category name (default: Trading Cards)
  --subcategory       Catalog subcategory name (default: Magic: The Gathering)
  --franchise-mode    game|set (default: set)
  --franchise         Force fixed franchise name (overrides franchise-mode)
  --brand             Brand name passed to API (default: Wizards of the Coast)
  --names             Exact card names separated by | (case-insensitive)
  --names-file        Text file with one exact card name per line (case-insensitive)
  --start             Start index in array (default: 0)
  --limit             Max cards to process (default: all from start)
  --sleep-ms          Delay between calls in ms (default: 0)
  --dry-run           Print mapped payloads only; no writes
  --help              Show this help

Environment:
  VITE_SUPABASE_URL or SUPABASE_URL
  VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
`)
}

function toInt(value, fallback) {
  if (value == null) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  return []
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function parseNamesList(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') {
    return []
  }

  return rawValue
    .split('|')
    .map((name) => name.trim())
    .filter(Boolean)
}

function readNamesFromFile(filePath) {
  if (!filePath) {
    return []
  }

  const absolute = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(absolute)) {
    throw new Error(`Names file not found: ${absolute}`)
  }

  const content = fs.readFileSync(absolute, 'utf8')
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

function mapCardToPayload(card, config) {
  const category = config.category
  const subcategory = config.subcategory
  const franchiseName = config.franchise
    || (config.franchiseMode === 'game'
      ? 'Magic: The Gathering'
      : (card.set_name || 'Unknown Set'))

  const nameBase = (card.name || '').trim() || 'Unknown Card'
  const collectorNumber = (card.collector_number || '').trim()
  const setCode = (card.set || '').toUpperCase()
  const itemName = collectorNumber
    ? `${nameBase} [${setCode || 'SET'} #${collectorNumber}]`
    : nameBase

  const year = (() => {
    const dateText = (card.released_at || '').trim()
    if (!dateText || dateText.length < 4) return null
    const parsedYear = Number(dateText.slice(0, 4))
    return Number.isFinite(parsedYear) ? parsedYear : null
  })()

  const description = [card.oracle_text, card.flavor_text].filter(Boolean).join('\n\n') || null

  const dynamicFields = {
    set: card.set_name || null,
    set_code: card.set || null,
    collector_number: card.collector_number || null,
    rarity: card.rarity || null,
    mana_cost: card.mana_cost || null,
    cmc: card.cmc ?? null,
    card_type: card.type_line || null,
    evolution: null,
    language: card.lang || null,
    color_identity: normalizeArray(card.color_identity),
    colors: normalizeArray(card.colors),
    keywords: normalizeArray(card.keywords),
    power: card.power || null,
    toughness: card.toughness || null,
    loyalty: card.loyalty || null,
    scryfall_uri: card.scryfall_uri || null,
    image_url: card.image_uris?.normal || card.image_uris?.large || null,
  }

  const metadata = {
    identifier: card.id || null,
    status: 'published',
    dynamic_fields: dynamicFields,
    source: 'scryfall_bulk',
    scryfall_oracle_id: card.oracle_id || null,
    scryfall_tcgplayer_id: card.tcgplayer_id || null,
    scryfall_cardmarket_id: card.cardmarket_id || null,
    scryfall_mtgo_id: card.mtgo_id || null,
    lang: card.lang || null,
    released_at: card.released_at || null,
    legalities: card.legalities || {},
    games: normalizeArray(card.games),
    promo: Boolean(card.promo),
    foil: Boolean(card.foil),
    nonfoil: Boolean(card.nonfoil),
    reserved: Boolean(card.reserved),
  }

  const variants = normalizeArray(card.finishes)
    .filter((finish) => typeof finish === 'string' && finish.trim())
    .map((finish) => ({
      name: finish.trim().toUpperCase(),
      sku: null,
      identifier: card.id || null,
      condition: 'NM',
    }))

  const people = card.artist
    ? [{ name: String(card.artist).trim(), roles: ['Illustrator'] }]
    : null

  return {
    p_category_name: category,
    p_subcategory_name: subcategory,
    p_franchise_name: franchiseName,
    p_item_name: itemName,
    p_release_year: year,
    p_description: description,
    p_brand_name: config.brand,
    p_metadata: metadata,
    p_people: people,
    p_minifigures: null,
    p_variants: variants.length > 0 ? variants : null,
  }
}

async function* readBulkCardsStream(filePath) {
  const absolute = path.resolve(process.cwd(), filePath)
  const source = fs.createReadStream(absolute)
  const inputStream = absolute.endsWith('.gz') ? source.pipe(zlib.createGunzip()) : source

  const pipeline = chain([inputStream, parser(), streamArray()])

  for await (const item of pipeline) {
    yield item?.value
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help === 'true') {
    printHelp()
    return
  }

  const apiKey = args['api-key']
  const filePath = args.file
  if (!apiKey || !filePath) {
    printHelp()
    process.exitCode = 1
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const config = {
    category: args.category || 'Trading Cards',
    subcategory: args.subcategory || 'Magic: The Gathering',
    franchiseMode: (args['franchise-mode'] || 'set').toLowerCase() === 'game' ? 'game' : 'set',
    franchise: args.franchise || '',
    brand: args.brand || 'Wizards of the Coast',
    names: parseNamesList(args.names || ''),
    namesFile: args['names-file'] || '',
    start: Math.max(0, toInt(args.start, 0)),
    limit: Math.max(0, toInt(args.limit, 0)),
    sleepMs: Math.max(0, toInt(args['sleep-ms'], 0)),
    dryRun: args['dry-run'] === 'true',
  }

  const fileNames = readNamesFromFile(config.namesFile)
  const allowedNameSet = new Set(
    [...config.names, ...fileNames]
      .map((name) => normalizeName(name))
      .filter(Boolean),
  )

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let successCount = 0
  let errorCount = 0
  let seenCount = 0
  let processedCount = 0
  let skippedByNameCount = 0
  const stopAfter = config.limit > 0 ? config.start + config.limit : null

  console.log(`Streaming file from index ${config.start}${config.limit > 0 ? ` for ${config.limit} rows` : ' to end of file'}`)
  if (allowedNameSet.size > 0) {
    console.log(`Name allowlist active: ${allowedNameSet.size} card names`) 
  }

  for await (const card of readBulkCardsStream(filePath)) {
    const i = seenCount
    seenCount += 1

    if (i < config.start) {
      continue
    }

    if (stopAfter !== null && i >= stopAfter) {
      break
    }

    if (allowedNameSet.size > 0) {
      const cardName = normalizeName(card?.name)
      if (!allowedNameSet.has(cardName)) {
        skippedByNameCount += 1
        continue
      }
    }

    processedCount += 1
    const payload = mapCardToPayload(card, config)

    if (config.dryRun) {
      console.log(JSON.stringify({ index: i, payload }, null, 2))
      if (stopAfter !== null && i + 1 >= stopAfter) {
        break
      }
      continue
    }

    const { error } = await supabase.rpc('create_catalog_item_via_api', {
      p_api_key: apiKey,
      ...payload,
    })

    if (error) {
      errorCount += 1
      console.error(`ERROR [${i}] ${payload.p_item_name}: ${error.message}`)
    } else {
      successCount += 1
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount} imported, ${errorCount} errors, ${skippedByNameCount} skipped by name filter`)
      }
    }

    if (config.sleepMs > 0) {
      await sleep(config.sleepMs)
    }
  }

  if (config.dryRun) {
    console.log(`Dry run complete. Previewed: ${processedCount}, skipped by name filter: ${skippedByNameCount}`)
    return
  }

  console.log(`Done. Imported: ${successCount}, errors: ${errorCount}, processed: ${processedCount}, skipped by name filter: ${skippedByNameCount}`)
}

main().catch((error) => {
  console.error(error?.message || error)
  process.exit(1)
})
