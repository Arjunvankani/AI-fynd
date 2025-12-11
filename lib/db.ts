import 'dotenv/config'
import { Pool } from 'pg'

// Shared Postgres pool for Next.js route handlers
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
})

pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err)
})

export const query = (text: string, params?: any[]) => pool.query(text, params)

export default pool
