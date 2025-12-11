#!/usr/bin/env node

/**
 * Initialize PostgreSQL database and migrate existing data
 */

require('dotenv').config({ path: '.env.local' })
const { pool } = require('./lib/db')
const fs = require('fs').promises
const path = require('path')

async function initDatabase() {
  console.log('🚀 Initializing PostgreSQL database...')

  try {
    // Create feedback table
    console.log('📋 Creating feedback table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        prediction_id TEXT,
        review_text TEXT NOT NULL,
        predicted_rating INTEGER NOT NULL,
        user_rating INTEGER NOT NULL,
        corrected BOOLEAN DEFAULT FALSE,
        feedback_type TEXT NOT NULL,
        ai_summary TEXT,
        recommended_actions TEXT[] DEFAULT '{}',
        feedback_weight REAL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ Feedback table created')

    // Create training_data table
    console.log('📚 Creating training_data table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_data (
        id TEXT PRIMARY KEY,
        review_text TEXT NOT NULL,
        predicted_rating INTEGER NOT NULL,
        user_rating INTEGER NOT NULL,
        feedback_type TEXT NOT NULL,
        feedback_weight REAL DEFAULT 0.4,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ Training data table created')

    // Migrate existing feedback data
    console.log('📄 Migrating existing feedback data...')
    try {
      const feedbackFile = path.join(process.cwd(), 'data', 'feedback.json')
      const feedbackData = await fs.readFile(feedbackFile, 'utf-8')
      const feedback = JSON.parse(feedbackData)

      console.log(`Found ${feedback.length} feedback entries to migrate`)

      for (const item of feedback) {
        const query = `
          INSERT INTO feedback (
            id, prediction_id, review_text, predicted_rating, user_rating,
            corrected, feedback_type, ai_summary, recommended_actions, feedback_weight
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `

        await pool.query(query, [
          item.id,
          item.prediction_id || null,
          item.review_text,
          item.predicted_rating,
          item.user_rating,
          item.corrected || false,
          item.feedback_type,
          item.ai_summary || null,
          item.recommended_actions || [],
          item.feedback_weight || (item.feedback_type === 'admin_feedback' ? 0.6 : 0.4)
        ])
      }

      console.log('✅ Feedback data migrated')
    } catch (error) {
      console.log('⚠️ No feedback data to migrate or file not found')
    }

    // Verify migration
    const result = await pool.query('SELECT COUNT(*) as count FROM feedback')
    const count = result.rows[0].count

    console.log(`🎉 Database initialized! ${count} feedback entries stored.`)
    console.log('💡 Your data is now in PostgreSQL and will persist across deployments!')

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

initDatabase()
