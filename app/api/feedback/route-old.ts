import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

// Storage config: prefer Vercel KV when available, otherwise local file
const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)
const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

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

// Fallback in-memory storage (only for development/testing)
let memoryStorage: any[] = []

// For demo purposes, pre-populate with some sample data if no KV
if (!USE_KV && memoryStorage.length === 0) {
  console.log('[STORAGE] Pre-populating with sample feedback data for demo')
  memoryStorage = [
    {
      id: 'sample-1',
      review_text: 'Amazing experience! The food was incredible, service was top-notch, and the atmosphere was perfect. Highly recommend!',
      predicted_rating: 5,
      user_rating: 5,
      corrected: false,
      feedback_type: 'user_correction',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ai_summary: 'Customer had an exceptional dining experience with excellent food, service, and atmosphere.',
      recommended_actions: ['Highlight this review on social media', 'Use as testimonial']
    },
    {
      id: 'sample-2',
      review_text: 'Good food but slow service. Waited 30 minutes for our order. Food was tasty though.',
      predicted_rating: 4,
      user_rating: 3,
      corrected: true,
      feedback_type: 'user_correction',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ai_summary: 'Customer enjoyed the food quality but experienced significant delays in service.',
      recommended_actions: ['Review service staffing during peak hours', 'Implement order tracking system']
    },
    {
      id: 'sample-3',
      review_text: 'Decent place. Nothing special but the food was okay and prices were reasonable.',
      predicted_rating: 3,
      user_rating: 3,
      corrected: false,
      feedback_type: 'user_correction',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      ai_summary: 'Customer found the establishment adequate but unremarkable in all aspects.',
      recommended_actions: ['Consider menu updates to increase appeal', 'Gather feedback on specific improvements']
    }
  ]
}

// Ensure data directory exists (only for local development)
async function ensureDataDir() {
  // Never try to create directories in serverless environments
  if (USE_KV || process.env.VERCEL || process.env.NETLIFY) {
    console.log('[STORAGE] Skipping directory creation in serverless environment')
    return
  }

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
      console.log('[KV] Reading feedback from Vercel KV')
      const feedback = await kv.get('feedback_data') || []
      console.log(`[KV] Retrieved ${Array.isArray(feedback) ? feedback.length : 0} feedback entries`)
      return Array.isArray(feedback) ? feedback : []
    } catch (error) {
      console.error('[KV] Error reading from KV:', error)
      return []
    }
  }

  // Check if we're in a serverless environment without KV
  const isServerlessWithoutKV = (process.env.VERCEL || process.env.NETLIFY) && !USE_KV

  if (isServerlessWithoutKV) {
    // In serverless without KV, return memory storage
    console.log(`[MEMORY] Returning ${memoryStorage.length} feedback entries from memory (serverless without KV)`)
    return memoryStorage
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

async function writeFeedback(feedback: any[]) {
  if (USE_KV) {
    try {
      console.log(`[KV] Writing ${feedback.length} feedback entries to Vercel KV`)
      await kv.set('feedback_data', feedback)
      console.log('[KV] Successfully stored feedback in Vercel KV')

      // Verify the data was saved
      const savedData = await kv.get('feedback_data')
      const savedCount = Array.isArray(savedData) ? savedData.length : 0
      console.log(`[KV] Verification: ${savedCount} entries now in KV`)

      return
    } catch (error) {
      console.error('[KV] Error writing to KV:', error)
      console.error('[KV] Error details:', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  // Check if we're in a serverless environment without KV
  const isServerlessWithoutKV = (process.env.VERCEL || process.env.NETLIFY) && !USE_KV

  if (isServerlessWithoutKV) {
    // In serverless without KV, just store in memory and don't try file operations
    memoryStorage = feedback
    console.log(`[MEMORY] Stored ${feedback.length} feedback entries in memory (serverless without KV)`)
    return
  }

  // Fallback to file storage for local development
  try {
    await ensureDataDir()
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedback, null, 2), 'utf-8')
    console.log(`[FILE] Successfully wrote ${feedback.length} feedback entries to file`)
  } catch (error) {
    console.error('[FILE] Error writing feedback file:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json()
    const {
      prediction_id,
      review_text,
      predicted_rating,
      user_rating,
      corrected,
      feedback_type,
      ai_summary,
      recommended_actions,
      feedback_weight
    } = body

    // Validate input - prediction_id and predicted_rating optional for admin feedback
    const isAdminFeedback = feedback_type === 'admin_feedback'
    
    if (!review_text || !user_rating) {
      return NextResponse.json(
        { error: 'Missing required fields: review_text and user_rating are required' },
        { status: 400 }
      )
    }

    // For admin feedback, generate prediction if not provided
    let finalPredictedRating = predicted_rating
    if (isAdminFeedback && !predicted_rating) {
      // Generate prediction for admin-submitted review using internal API
      try {
        console.log('🤖 Generating prediction for admin review...')
        const apiKey = process.env.GROQ_API_KEY
        let modelName = process.env.MODEL_NAME || 'openai/gpt-oss-120b'

        // Validate model name - Groq models
        const validModels = [
          'openai/gpt-oss-120b',
          'meta-llama/llama-3.1-405b-instruct',
          'meta-llama/llama-3.1-70b-instruct',
          'meta-llama/llama-3.1-8b-instruct',
          'mixtral-8x7b-32768'
        ]

        if (!validModels.includes(modelName)) {
          console.warn(`Invalid model name: ${modelName}. Using openai/gpt-oss-120b instead.`)
          modelName = 'openai/gpt-oss-120b'
        }
        
        if (apiKey) {
          const predictPrompt = `You are an expert Yelp review rating classifier. Analyze reviews systematically.

Rating Guidelines:
- 1 star: Terrible experience, multiple severe complaints, would not recommend
- 2 stars: Disappointing, below expectations, significant issues
- 3 stars: Average, acceptable but nothing special, neutral experience
- 4 stars: Good experience, positive overall, would recommend
- 5 stars: Excellent, exceptional experience, highest praise

Now analyze this review step-by-step:

Review: "${review_text}"

Step 1: Overall sentiment?
Step 2: Key positive/negative points?
Step 3: Intensity of feelings?
Step 4: Recommendation likelihood?
Step 5: Final rating (1-5)?

Return ONLY a JSON object:
{
  "predicted_stars": <integer 1-5>,
  "explanation": "<brief explanation>"
}`

          const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: 'user', content: predictPrompt }],
              temperature: 0.0,
              max_tokens: 500,
              top_p: 1,
              stream: false
            })
          })

          if (groqResponse.ok) {
            const predictData = await groqResponse.json()
            const content = predictData.choices[0].message.content
            
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                finalPredictedRating = parsed.predicted_stars
                console.log(`✅ Generated prediction: ${finalPredictedRating} stars`)
              }
            } catch {
              finalPredictedRating = user_rating
            }
          }
        }
      } catch (err) {
        console.error('Failed to generate prediction for admin review:', err)
        finalPredictedRating = user_rating // Default to user rating
      }
    }

    // Set feedback weight: Admin = 60% (0.6), User = 40% (0.4)
    const feedbackWeight = feedback_weight || (isAdminFeedback ? 0.6 : 0.4)

    // ALWAYS generate AI summary and actions at submission time
    // This ensures summaries are created immediately when feedback is submitted
    let summary = ai_summary || ''
    let actions = recommended_actions || []
    
    // Generate summary and actions immediately (only skip if both are explicitly provided)
    if (!ai_summary || !recommended_actions || recommended_actions.length === 0) {
      try {
        console.log(`🔄 Generating AI summary and recommendations at submission time for ${isAdminFeedback ? 'ADMIN' : 'USER'} feedback...`)
        
        // Call internal summarize function - this runs immediately on feedback submission
        const { generateSummary } = await import('../../../lib/summarize')
        const summarizeData = await generateSummary({
          review_text,
          user_rating,
          predicted_rating: finalPredictedRating || user_rating,
          corrected: corrected || false
        })
        
        // Use generated data
        summary = summarizeData.summary || ''
        actions = summarizeData.recommended_actions || []
        
        console.log('✅ AI summary and actions generated successfully:', {
          summaryLength: summary.length,
          actionsCount: actions.length,
          feedbackType: feedback_type,
          weight: feedbackWeight
        })
      } catch (err) {
        console.error('❌ Failed to generate summary:', err)
        // Fallback values if generation fails
        if (!summary) {
          summary = `Review rated ${user_rating} stars. ${review_text.substring(0, 150)}...`
        }
        if (!actions.length) {
          actions = [
            'Review customer feedback',
            'Address any concerns mentioned',
            'Monitor customer satisfaction trends'
          ]
        }
      }
    }

    const feedback = await readFeedback()

    // Ensure we always have summary and actions before saving
    const finalSummary = summary || `Review rated ${user_rating} stars. ${review_text.substring(0, 150)}...`
    const finalActions = actions.length > 0 ? actions : [
      'Review customer feedback',
      'Address any concerns mentioned',
      'Monitor customer satisfaction trends'
    ]

    const newFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prediction_id: prediction_id || `admin_${Date.now()}`,
      review_text,
      predicted_rating: finalPredictedRating || user_rating,
      user_rating,
      corrected: corrected || (finalPredictedRating ? finalPredictedRating !== user_rating : false),
      feedback_type,
      feedback_weight: feedbackWeight,  // 0.6 for admin, 0.4 for user
      ai_summary: finalSummary,
      recommended_actions: finalActions,
      timestamp: new Date().toISOString()
    }

    console.log('💾 Saving feedback with AI-generated content:', {
      hasSummary: !!newFeedback.ai_summary,
      hasActions: newFeedback.recommended_actions.length > 0,
      actionsCount: newFeedback.recommended_actions.length
    })

    feedback.push(newFeedback)
    await writeFeedback(feedback)

    return NextResponse.json({
      success: true,
      feedback_id: newFeedback.id,
      ai_summary: newFeedback.ai_summary,
      recommended_actions: newFeedback.recommended_actions
    })
  } catch (error: any) {
    console.error('Feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save feedback' },
      { status: 500 }
    )
  }
}

// Update feedback
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    const feedback = await readFeedback()
    const index = feedback.findIndex((f: any) => f.id === id)

    if (index === -1) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    // If regenerating summary/actions, call API
    if (updates.regenerate_summary) {
      try {
        const { generateSummary } = await import('../../../lib/summarize')
        const summarizeData = await generateSummary({
          review_text: feedback[index].review_text,
          user_rating: updates.user_rating || feedback[index].user_rating,
          predicted_rating: updates.predicted_rating || feedback[index].predicted_rating,
          corrected: updates.corrected !== undefined ? updates.corrected : feedback[index].corrected
        })
        updates.ai_summary = summarizeData.summary
        updates.recommended_actions = summarizeData.recommended_actions
      } catch (err) {
        console.error('Failed to regenerate summary:', err)
      }
      delete updates.regenerate_summary
    }

    // Update feedback
    feedback[index] = {
      ...feedback[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    await writeFeedback(feedback)

    return NextResponse.json({
      success: true,
      feedback: feedback[index]
    })
  } catch (error: any) {
    console.error('Update feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update feedback' },
      { status: 500 }
    )
  }
}

// Delete feedback
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      )
    }

    const feedback = await readFeedback()
    const filtered = feedback.filter((f: any) => f.id !== id)

    if (filtered.length === feedback.length) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    await writeFeedback(filtered)

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete feedback' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const startTime = Date.now()
    const feedback = await readFeedback()
    const fetchTime = Date.now() - startTime
    
    return NextResponse.json({ 
      feedback,
      meta: {
        count: feedback.length,
        fetch_time_ms: fetchTime
      }
    })
  } catch (error: any) {
    console.error('Get feedback error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
