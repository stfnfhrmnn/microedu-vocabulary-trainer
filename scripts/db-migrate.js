#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to .env.local or your environment.')
  process.exit(1)
}

const isVercel = process.env.VERCEL === '1'
const vercelEnv = process.env.VERCEL_ENV
const runOnVercel = !isVercel || vercelEnv === 'production'

if (!runOnVercel) {
  console.log('Skipping migrations (non-production Vercel environment).')
  process.exit(0)
}

const migrationsDir = path.join(process.cwd(), 'drizzle')
if (!fs.existsSync(migrationsDir)) {
  console.error(`Migrations directory not found: ${migrationsDir}`)
  process.exit(1)
}

const sql = neon(databaseUrl)
const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log('No migrations found.')
  process.exit(0)
}

async function run() {
  await sql(
    'CREATE TABLE IF NOT EXISTS schema_migrations (filename text primary key, applied_at timestamptz not null default now())'
  )

  for (const file of files) {
    const sanitizedFile = file.replace(/'/g, "''")
    const existing = await sql(
      `SELECT filename FROM schema_migrations WHERE filename = '${sanitizedFile}' LIMIT 1`
    )
    if (existing.length > 0) {
      continue
    }

    const fullPath = path.join(migrationsDir, file)
    const content = fs.readFileSync(fullPath, 'utf8')
    const statements = content
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean)

    if (statements.length === 0) continue

    console.log(`Running ${file} (${statements.length} statements)...`)
    for (const statement of statements) {
      await sql(statement)
    }

    await sql(
      `INSERT INTO schema_migrations (filename) VALUES ('${sanitizedFile}')`
    )
  }

  console.log('Migrations complete.')
}

run().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
