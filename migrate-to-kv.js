#!/usr/bin/env node

/**
 * Migration script to move data from file storage to Vercel KV
 * Run this after setting up Vercel KV environment variables
 */

const fs = require('fs').promises
const path = require('path')
const { kv } = require('@vercel/kv')

async function migrateData() {
  console.log('🚀 Starting data migration to Vercel KV...')

  try {
    // Check if KV is configured
    const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

    if (!USE_KV) {
      console.error('❌ Vercel KV not configured. Please set KV_URL, KV_REST_API_URL, and KV_REST_API_TOKEN')
      process.exit(1)
    }

    console.log('✅ Vercel KV is configured')

    // Read existing data from files
    const feedbackFile = path.join(process.cwd(), 'data', 'feedback.json')
    const trainingFile = path.join(process.cwd(), 'data', 'training_data.json')

    // Migrate feedback data
    try {
      const feedbackData = await fs.readFile(feedbackFile, 'utf-8')
      const feedback = JSON.parse(feedbackData)

      console.log(`📄 Found ${feedback.length} feedback entries`)

      // Store in KV
      await kv.set('feedback_data', feedback)
      console.log('✅ Feedback data migrated to KV')
    } catch (error) {
      console.log('⚠️ No feedback data to migrate or file not found')
    }

    // Migrate training data
    try {
      const trainingData = await fs.readFile(trainingFile, 'utf-8')
      const training = JSON.parse(trainingData)

      console.log(`📚 Found ${training.length} training entries`)

      // Store in KV
      await kv.set('training_data', training)
      console.log('✅ Training data migrated to KV')
    } catch (error) {
      console.log('⚠️ No training data to migrate or file not found')
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const migratedFeedback = await kv.get('feedback_data')
    const migratedTraining = await kv.get('training_data')

    console.log(`✅ KV now contains ${migratedFeedback?.length || 0} feedback entries`)
    console.log(`✅ KV now contains ${migratedTraining?.length || 0} training entries`)

    console.log('\n🎉 Migration complete! You can now deploy to Vercel.')
    console.log('📝 Don\'t forget to remove the data/ directory from your repo after deployment.')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrateData()
