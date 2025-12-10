import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')
const TRAINING_FILE = path.join(process.cwd(), 'data', 'training_data.json')

// Check if Vercel KV is available (for production data persistence)
const USE_KV = process.env.KV_URL && process.env.KV_REST_API_URL

// Fallback in-memory storage (only for development/testing)
let trainingMemoryStorage: any[] = []

interface TrainRequest {
  feedback_ids: string[]
}

async function ensureDataDir() {
  if (USE_KV) return // Skip when using KV storage

  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readFeedback(): Promise<any[]> {
  if (USE_KV) {
    try {
      console.log('[KV] Train reading feedback from Vercel KV')
      const feedback = await kv.get('feedback_data') || []
      console.log(`[KV] Train retrieved ${Array.isArray(feedback) ? feedback.length : 0} feedback entries`)
      return Array.isArray(feedback) ? feedback : []
    } catch (error) {
      console.error('[KV] Train error reading feedback from KV:', error)
      return []
    }
  }

  // Fallback to file storage for local development
  try {
    await ensureDataDir()
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function readTrainingData(): Promise<any[]> {
  if (USE_KV) {
    try {
      console.log('[KV] Reading training data from Vercel KV')
      const trainingData = await kv.get('training_data') || []
      console.log(`[KV] Retrieved ${Array.isArray(trainingData) ? trainingData.length : 0} training entries`)
      return Array.isArray(trainingData) ? trainingData : []
    } catch (error) {
      console.error('[KV] Error reading training data from KV:', error)
      return []
    }
  }

  // Fallback to file storage for local development
  try {
    await ensureDataDir()
    const data = await fs.readFile(TRAINING_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeTrainingData(data: any[]) {
  if (USE_KV) {
    try {
      console.log(`[KV] Writing ${data.length} training entries to Vercel KV`)
      await kv.set('training_data', data)
      console.log('[KV] Successfully stored training data in Vercel KV')
      return
    } catch (error) {
      console.error('[KV] Error writing training data to KV:', error)
      throw error
    }
  }

  // Fallback to file storage for local development
  try {
    await ensureDataDir()
    await fs.writeFile(TRAINING_FILE, JSON.stringify(data, null, 2))
    console.log(`[FILE] Successfully wrote ${data.length} training entries to file`)
  } catch (error) {
    console.error('[FILE] Error writing training data file:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TrainRequest = await request.json()
    const { feedback_ids } = body

    const feedback = await readFeedback()
    const trainingData = await readTrainingData()

    // Filter feedback that needs to be added to training
    // Admin feedback (60% weight) and user feedback (40% weight) both included
    const newTrainingData = feedback
      .filter(f => feedback_ids.includes(f.id) && f.corrected)
      .map(f => ({
        review_text: f.review_text,
        correct_rating: f.user_rating,
        predicted_rating: f.predicted_rating,
        feedback_id: f.id,
        feedback_type: f.feedback_type || 'user_correction',
        feedback_weight: f.feedback_weight || (f.feedback_type === 'admin_feedback' ? 0.6 : 0.4),
        timestamp: f.timestamp
      }))

    // Add to training data
    const updatedTrainingData = [...trainingData, ...newTrainingData]

    // Save training data
    await writeTrainingData(updatedTrainingData)

    // In a production system, you would:
    // 1. Send this data to a fine-tuning service
    // 2. Update model weights based on corrections
    // 3. Retrain the model periodically
    // 4. Deploy updated model

    // For now, we'll just mark these as processed
    console.log(`RLHF Training: Added ${newTrainingData.length} correction examples to training dataset`)
    console.log(`Total training examples: ${updatedTrainingData.length}`)

    return NextResponse.json({
      success: true,
      training_examples_added: newTrainingData.length,
      total_training_examples: updatedTrainingData.length,
      message: 'Training data prepared. In production, this would trigger model fine-tuning.'
    })
  } catch (error: any) {
    console.error('Training error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to prepare training data' },
      { status: 500 }
    )
  }
}

