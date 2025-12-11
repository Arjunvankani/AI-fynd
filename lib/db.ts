import 'dotenv/config'
import { Pool } from 'pg'

// Single Postgres pool used across API routes
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Allow SSL in prod (Neon/Supabase, etc.) but keep local simple
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
