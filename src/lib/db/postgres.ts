import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './server-schema'

// Lazy-load the database connection to avoid build-time errors
let _sql: NeonQueryFunction<boolean, boolean> | null = null
let _db: NeonHttpDatabase<typeof schema> | null = null

function getConnection(): NeonQueryFunction<boolean, boolean> {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    _sql = neon(url)
  }
  return _sql
}

export function getServerDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getConnection(), { schema })
  }
  return _db
}

// Export a proxy that lazily initializes the database
export const serverDb = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const db = getServerDb()
    return (db as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Re-export schema for convenience
export { schema }
