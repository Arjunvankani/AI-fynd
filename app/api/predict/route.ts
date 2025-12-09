import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Exact match function - only return identical reviews
function isExactMatch(text1: string, text2: string): boolean {
  // Normalize text for comparison (lowercase, remove extra spaces)
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()
  return normalize(text1) === normalize(text2)
}

async function findExactMatchingFeedback(reviewText: string) {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    const feedback = JSON.parse(data)

    // Find exact matching feedback entries
    const exactMatches = feedback
      .filter((f: any) => f.corrected && isExactMatch(reviewText, f.review_text))

    return exactMatches
  } catch {
    return []
  }
}

interface PredictionRequest {
  review_text: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PredictionRequest = await request.json()
    const { review_text } = body

    if (!review_text || review_text.length < 10) {
      return NextResponse.json(
        { error: 'Review text must be at least 10 characters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    const modelName = process.env.MODEL_NAME || 'gemini-pro'

    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      return NextResponse.json(
        {
          error: 'Gemini API key not configured.',
          details: 'Please set the GEMINI_API_KEY environment variable in your .env.local file.',
          setup_guide: 'Check GEMINI_SETUP.md for instructions.'
        },
        { status: 500 }
      )
    }

    console.log(`Using Gemini model: ${modelName}`)
    console.log(`API Key present: ${!!apiKey}`)

    // RAG: Find exact matching past feedback for context
    const exactMatches = await findExactMatchingFeedback(review_text)

    type CorrectionPattern = {
      original_prediction: number
      corrected_to: number
      error_type: 'over_rated' | 'under_rated' | 'accurate'
      error_magnitude: number
      similarity: number
    }

    // Analyze patterns from exact matching feedback
    const correctionPatterns: CorrectionPattern[] = exactMatches.map((f: any) => {
      const error = f.predicted_rating - f.user_rating
      return {
        original_prediction: f.predicted_rating,
        corrected_to: f.user_rating,
        error_type: error > 0 ? 'over_rated' : error < 0 ? 'under_rated' : 'accurate',
        error_magnitude: Math.abs(error),
        similarity: 1.0 // Exact match = 100% similarity
      }
    })

    // Only apply adjustment if we have exact matches
    let adjustment = 0
    if (correctionPatterns.length >= 1) { // Need at least 1 exact match
      const overRatedCount = correctionPatterns.filter(p => p.error_type === 'over_rated').length
      const underRatedCount = correctionPatterns.filter(p => p.error_type === 'under_rated').length

      if (overRatedCount > underRatedCount) {
        adjustment = -0.5 // Tend to predict lower
      } else if (underRatedCount > overRatedCount) {
        adjustment = 0.5 // Tend to predict higher
      }
    }

    // Enhanced prompt with RAG context (only for exact matches)
    const ragContext = correctionPatterns.length >= 1
      ? `\n\nExact Same Review History:
This exact review has been submitted before and was ${correctionPatterns[0].error_type.replace('_', ' ')} by the AI.
${correctionPatterns.length > 1 ? `Multiple users (${correctionPatterns.length} times) have corrected this same review.` : ''}

Based on previous corrections, adjust your prediction ${adjustment > 0 ? 'upward' : adjustment < 0 ? 'downward' : 'appropriately'}.`
      : ''

    // Best performing prompt (Hybrid approach) with RAG enhancement
    const prompt = `You are an expert Yelp review rating classifier. Analyze reviews systematically.

Rating Guidelines:
- 1 star: Terrible experience, multiple severe complaints, would not recommend
- 2 stars: Disappointing, below expectations, significant issues
- 3 stars: Average, acceptable but nothing special, neutral experience
- 4 stars: Good experience, positive overall, would recommend
- 5 stars: Excellent, exceptional experience, highest praise

Example Analysis:
Review: "The food was decent but service was terrible. Waited 45 minutes for appetizers. Won't be back."
Reasoning: Negative sentiment overall, specific complaint about service wait time, indicates dissatisfaction → 2 stars

${ragContext}

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
  "explanation": "<one clear sentence explaining the rating>",
  "confidence": "<high/medium/low>",
  "rag_used": ${correctionPatterns.length > 0 ? 'true' : 'false'},
  "similar_cases": ${correctionPatterns.length}
}`

    const geminiUrl = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`

    console.log(`Making request to: ${geminiUrl.replace(apiKey, '[API_KEY]')}`)

    // Add timeout and better error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response
    try {
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 500,
          }
        }),
        signal: controller.signal
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds. Please check your internet connection.')
      }
      throw new Error(`Network error: ${fetchError.message}`)
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${errorData}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    // Extract JSON from response
    let result
    try {
      result = JSON.parse(content)
    } catch {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }

    // Validate result
    if (!result.predicted_stars || result.predicted_stars < 1 || result.predicted_stars > 5) {
      throw new Error('Invalid rating in response')
    }

    // Generate prediction ID for feedback tracking
    const prediction_id = randomUUID()

    // Get suggestions only from exact matches
    const suggestions = correctionPatterns.length >= 1
      ? correctionPatterns.slice(0, 3).map(pattern => ({
          original_rating: pattern.original_prediction,
          corrected_rating: pattern.corrected_to,
          pattern_type: pattern.error_type,
          confidence: '100%' // Exact match
        }))
      : []

    return NextResponse.json({
      predicted_stars: result.predicted_stars,
      explanation: result.explanation || 'No explanation provided',
      confidence: result.confidence || 'medium',
      prediction_id,
      rag_used: correctionPatterns.length >= 1,
      similar_cases_found: correctionPatterns.length,
      adjustment_applied: adjustment !== 0,
      suggestions: suggestions
    })
  } catch (error: any) {
    console.error('Prediction error:', error)

    // Provide helpful error messages based on error type
    let errorMessage = 'Failed to generate prediction'
    let statusCode = 500

    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      errorMessage = 'Request to Gemini API timed out. Please check your internet connection and try again.'
      statusCode = 504
    } else if (error.message.includes('API key')) {
      errorMessage = 'Gemini API key not configured. Please check your environment variables.'
      statusCode = 500
    } else if (error.message.includes('Network error')) {
      errorMessage = 'Network connectivity issue. Please check your internet connection.'
      statusCode = 503
    } else if (error.message.includes('Gemini API error')) {
      errorMessage = error.message
      statusCode = 502
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        troubleshooting: {
          'Check API Key': 'Ensure GEMINI_API_KEY is set in .env.local',
          'Check Internet': 'Verify your internet connection is working',
          'Check Quota': 'Verify your Gemini API quota is not exceeded',
          'Check Model': `Current model: ${process.env.MODEL_NAME || 'gemini-pro'}`
        }
      },
      { status: statusCode }
    )
  }
}

