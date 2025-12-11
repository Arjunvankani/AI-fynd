import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import { randomUUID } from 'crypto'

interface FeedbackRequest {
  prediction_id?: string  // Optional for admin submissions
  review_text: string
  predicted_rating?: number  // Optional for admin submissions
  user_rating: number
  corrected?: boolean
  feedback_type: string  // 'user_correction' or 'admin_feedback'
  ai_summary?: string
  recommended_actions?: string[]
  feedback_weight?: number  // 0.6 for admin, 0.4 for user
}

export async function GET() {
  try {
    console.log('[FEEDBACK] Fetching feedback from PostgreSQL...')

    const result = await pool.query(`
      SELECT * FROM feedback
      ORDER BY timestamp DESC
      LIMIT 100
    `)

    console.log(`[FEEDBACK] Retrieved ${result.rows.length} feedback entries`)
    return NextResponse.json({ feedback: result.rows })
  } catch (error) {
    console.error('[FEEDBACK] Error fetching feedback:', error)
    return NextResponse.json({ feedback: [], error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json()
    console.log('[FEEDBACK] Received feedback submission:', body)

    // Generate ID if not provided
    const feedbackId = randomUUID()
    const timestamp = new Date()

    // For admin submissions, we might need to generate a prediction
    let finalPredictedRating = body.predicted_rating
    // Provide sensible defaults so admin dashboard never shows empty placeholders
    let finalAiSummary = body.ai_summary
    let finalRecommendedActions = body.recommended_actions

    // If this is an admin submission without a prediction, generate one
    if (body.feedback_type === 'admin_feedback' && !body.predicted_rating) {
      console.log('🤖 Generating prediction for admin review...')
      // TODO: Add prediction generation logic here
      finalPredictedRating = body.user_rating // Temporary fallback
    }

    // Fallback summary/actions when client doesn't send them
    if (!finalAiSummary) {
      const preview = body.review_text?.substring(0, 140) || ''
      finalAiSummary = `Review rated ${body.user_rating} stars. ${preview}${preview.length === 140 ? '...' : ''}`
    }

    if (!finalRecommendedActions || finalRecommendedActions.length === 0) {
      finalRecommendedActions = [
        'Review and respond to the customer feedback',
        'Address any concerns mentioned in the review',
        'Monitor similar feedback patterns for trends'
      ]
    }

    // Insert feedback into database
    const query = `
      INSERT INTO feedback (
        id, prediction_id, review_text, predicted_rating, user_rating,
        corrected, feedback_type, ai_summary, recommended_actions, feedback_weight
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `

    await pool.query(query, [
      feedbackId,
      body.prediction_id || null,
      body.review_text,
      finalPredictedRating,
      body.user_rating,
      body.corrected || false,
      body.feedback_type,
      finalAiSummary || null,
      finalRecommendedActions || [],
      body.feedback_weight || (body.feedback_type === 'admin_feedback' ? 0.6 : 0.4)
    ])

    console.log(`[FEEDBACK] Successfully saved feedback with ID: ${feedbackId}`)

    return NextResponse.json({
      success: true,
      feedback_id: feedbackId,
      message: 'Feedback saved successfully'
    })

  } catch (error) {
    console.error('[FEEDBACK] Error saving feedback:', error)
    return NextResponse.json(
      {
        error: 'Failed to save feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
