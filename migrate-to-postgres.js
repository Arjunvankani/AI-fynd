#!/usr/bin/env node

/**
 * Migration script to move data from file storage to PostgreSQL
 * Run this after setting up Neon PostgreSQL database
 */

const fs = require('fs').promises
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateData() {
  console.log('🚀 Starting data migration to PostgreSQL...')

  try {
    // Read existing data from files
    const feedbackFile = path.join(process.cwd(), 'data', 'feedback.json')
    const trainingFile = path.join(process.cwd(), 'data', 'training_data.json')

    // Test database connection
    console.log('🔍 Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Migrate feedback data
    try {
      const feedbackData = await fs.readFile(feedbackFile, 'utf-8')
      const feedback = JSON.parse(feedbackData)

      console.log(`📄 Found ${feedback.length} feedback entries to migrate`)

      // Clear existing data
      await prisma.feedback.deleteMany()
      console.log('🧹 Cleared existing feedback data')

      // Insert new data
      for (const item of feedback) {
        await prisma.feedback.create({
          data: {
            id: item.id,
            prediction_id: item.prediction_id,
            review_text: item.review_text,
            predicted_rating: item.predicted_rating,
            user_rating: item.user_rating,
            corrected: item.corrected,
            feedback_type: item.feedback_type,
            ai_summary: item.ai_summary,
            recommended_actions: item.recommended_actions || [],
            feedback_weight: item.feedback_weight,
            timestamp: new Date(item.timestamp),
            updated_at: item.updated_at ? new Date(item.updated_at) : new Date(item.timestamp)
          }
        })
      }

      console.log('✅ Feedback data migrated to PostgreSQL')
    } catch (error) {
      console.log('⚠️ No feedback data to migrate or file not found:', error.message)
    }

    // Migrate training data
    try {
      const trainingData = await fs.readFile(trainingFile, 'utf-8')
      const training = JSON.parse(trainingData)

      console.log(`📚 Found ${training.length} training entries to migrate`)

      // Clear existing data
      await prisma.trainingData.deleteMany()
      console.log('🧹 Cleared existing training data')

      // Insert new data
      for (const item of training) {
        await prisma.trainingData.create({
          data: {
            id: item.id,
            review_text: item.review_text,
            predicted_rating: item.predicted_rating,
            user_rating: item.user_rating,
            feedback_type: item.feedback_type,
            feedback_weight: item.feedback_weight || 0.4
          }
        })
      }

      console.log('✅ Training data migrated to PostgreSQL')
    } catch (error) {
      console.log('⚠️ No training data to migrate or file not found:', error.message)
    }

    // Verify migration
    console.log('\n🔍 Verifying migration...')
    const migratedFeedback = await prisma.feedback.count()
    const migratedTraining = await prisma.trainingData.count()

    console.log(`✅ PostgreSQL now contains ${migratedFeedback} feedback entries`)
    console.log(`✅ PostgreSQL now contains ${migratedTraining} training entries`)

    console.log('\n🎉 Migration complete! You can now deploy to Vercel.')
    console.log('💡 Your data is now stored in a production-ready PostgreSQL database!')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateData()
