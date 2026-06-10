import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const equalsIndex = line.indexOf('=')
    if (equalsIndex <= 0) {
      continue
    }

    const key = line.slice(0, equalsIndex).trim()
    const value = line.slice(equalsIndex + 1).trim()
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function countRows(client, table, filter) {
  const { count, error } = await client.from(table).select('id', { count: 'exact', head: true }).filter(...filter)
  if (error) {
    throw new Error(`${table} count failed: ${error.message}`)
  }
  return Number(count) || 0
}

async function deleteRows(client, table, filter) {
  const { error } = await client.from(table).delete().filter(...filter)
  if (error) {
    throw new Error(`${table} delete failed: ${error.message}`)
  }
}

async function run() {
  const projectRoot = process.cwd()
  const envPath = path.join(projectRoot, '.env.local')
  loadEnvFile(envPath)

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env.local (SUPABASE_URL/VITE_SUPABASE_URL and a key).')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const targets = [
    { table: 'catalog_items', column: 'name' },
    { table: 'magic_cards', column: 'name' },
  ]

  for (const target of targets) {
    const totalBefore = await countRows(supabase, target.table, [target.column, 'neq', ''])
    const keepBefore = await countRows(supabase, target.table, [target.column, 'ilike', '%Black Lotus%'])
    const deleteBefore = await countRows(supabase, target.table, [target.column, 'not.ilike', '%Black Lotus%'])

    console.log(`Table: ${target.table}`)
    console.log(`  Total before: ${totalBefore}`)
    console.log(`  Keep (Black Lotus): ${keepBefore}`)
    console.log(`  Delete target: ${deleteBefore}`)

    if (deleteBefore > 0) {
      await deleteRows(supabase, target.table, [target.column, 'not.ilike', '%Black Lotus%'])
    }

    const totalAfter = await countRows(supabase, target.table, [target.column, 'neq', ''])
    const keepAfter = await countRows(supabase, target.table, [target.column, 'ilike', '%Black Lotus%'])

    console.log(`  Total after: ${totalAfter}`)
    console.log(`  Keep after: ${keepAfter}`)
  }
}

run().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
