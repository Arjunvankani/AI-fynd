import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')
const TRAINING_FILE = path.join(process.cwd(), 'data', 'training_data.json')

interface TrainRequest {
  feedback_ids: string[]
}

async function readFeedback(): Promise<any[]> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function readTrainingData(): Promise<any[]> {
  try {
    const data = await fs.readFile(TRAINING_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeTrainingData(data: any[]) {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
  await fs.writeFile(TRAINING_FILE, JSON.stringify(data, null, 2))
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

