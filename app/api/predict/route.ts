import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

// Groq API models - these are the available models
const GROQ_MODELS = [
  'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  'meta-llama/llama-3.1-405b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  'mixtral-8x7b-32768'
]
const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Check if Vercel KV is available (for production data persistence)
const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

console.log('[STORAGE] Predict USE_KV:', USE_KV, 'KV_URL:', !!process.env.KV_URL, 'KV_REST_API_URL:', !!process.env.KV_REST_API_URL)

// Exact match function - only return identical reviews
function isExactMatch(text1: string, text2: string): boolean {
  // Normalize text for comparison (lowercase, remove extra spaces)
  const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()
  return normalize(text1) === normalize(text2)
}

async function findExactMatchingFeedback(reviewText: string) {
  if (USE_KV) {
    try {
      console.log('[KV] Predict reading feedback from Vercel KV for RAG')
      const feedback = await kv.get('feedback_data') || []
      const feedbackArray = Array.isArray(feedback) ? feedback : []

      // Find exact matching feedback entries
      const exactMatches = feedbackArray
        .filter((f: any) => f.corrected && isExactMatch(reviewText, f.review_text))

      console.log(`[KV] Found ${exactMatches.length} exact matches for RAG`)
      return exactMatches
    } catch (error) {
      console.error('[KV] Predict error reading feedback from KV:', error)
      return []
    }
  }

  // Fallback to file storage for local development
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

// Get model name with user's preference
function getValidatedModelName(): string {
  let modelName = process.env.MODEL_NAME || 'openai/gpt-oss-120b'

  // Validate against available Groq models
  if (!GROQ_MODELS.includes(modelName)) {
    console.warn(`Model ${modelName} not available in Groq. Falling back to openai/gpt-oss-120b`)
    modelName = 'openai/gpt-oss-120b'
  }

  console.log(`Using Groq model: ${modelName}`)
  return modelName
}

// Extract prediction from model response
function extractPrediction(responseText: string): { stars: number; explanation: string } {
  // Try to extract a number from the response
  const numberMatch = responseText.match(/(\d+)/)
  const stars = numberMatch ? Math.min(5, Math.max(1, parseInt(numberMatch[1]))) : 3

  return {
    stars,
    explanation: responseText.length > 10 ? responseText : `Rating: ${stars} stars`
  }
}

export async function POST(request: NextRequest) {
  const modelName = getValidatedModelName() // Declare outside try block

  console.log(`[PREDICT] ===== STARTING PREDICTION REQUEST =====`)
  console.log(`[PREDICT] Model: ${modelName}`)

  try {
    const body: PredictionRequest = await request.json()
    const { review_text } = body

    console.log(`[PREDICT] Review text length: ${review_text?.length || 0}`)
    console.log(`[PREDICT] Review preview: "${review_text?.substring(0, 50)}..."`)

    if (!review_text || review_text.length < 10) {
      console.log('[PREDICT] ❌ Validation failed: Review text too short')
      return NextResponse.json(
        { error: 'Review text must be at least 10 characters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY

    console.log(`[PREDICT] API Key present: ${!!apiKey}`)

    if (!apiKey) {
      console.log('[PREDICT] ❌ Error: No API key configured')
      return NextResponse.json(
        {
          error: 'Groq API key not configured.',
          troubleshooting: {
            setup_guide: 'Get API key from https://console.groq.com/',
            check_env: 'Ensure GROQ_API_KEY is set in environment variables.'
          }
        },
        { status: 500 }
      )
    }

    if (!apiKey) {
      console.error('GROQ_API_KEY environment variable is not set')
      return NextResponse.json(
        {
          error: 'Groq API key not configured.',
          details: 'Please set the GROQ_API_KEY environment variable in your .env.local file.',
          setup_guide: 'Get API key from https://console.groq.com/'
        },
        { status: 500 }
      )
    }

    console.log(`Using Gemini model: ${modelName}`)
    console.log(`API Key present: ${!!apiKey}`)

    // RAG: Find exact matching past feedback for context
    console.log('[PREDICT] 🔍 Starting RAG search for exact matches')
    const exactMatches = await findExactMatchingFeedback(review_text)
    console.log(`[PREDICT] ✅ Found ${exactMatches.length} exact matches for RAG`)

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

    console.log(`[PREDICT] 🤖 Making request to Groq API with model: ${modelName}`)

    let response
    let lastError

    // Retry logic: try up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`[PREDICT] 🔄 Attempt ${attempt}/3`)

      // Add timeout and better error handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.0,
            max_tokens: 500,
            top_p: 1,
            stream: false
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // If we get a successful response (not 5xx server error), break out of retry loop
        if (response.ok || response.status < 500) {
          console.log(`[PREDICT] ✅ Attempt ${attempt} successful (status: ${response.status})`)
          break
        }

        // For server errors (5xx), store error and retry
        const errorData = await response.text()
        lastError = new Error(`Groq API error (${response.status}): ${errorData}`)
        console.log(`[PREDICT] ⚠️ Attempt ${attempt} failed with server error, will retry:`, lastError.message)

      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        lastError = fetchError

        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timed out after 30 seconds. Please check your internet connection.')
          console.log(`[PREDICT] ⏰ Attempt ${attempt} timed out`)
        } else {
          lastError = new Error(`Network error: ${fetchError.message}`)
          console.log(`[PREDICT] 🌐 Attempt ${attempt} network error:`, fetchError.message)
        }
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < 3) {
        const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s
        console.log(`[PREDICT] ⏳ Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // If we still don't have a response after all retries, throw the last error
    if (!response) {
      throw lastError || new Error('All retry attempts failed')
    }

    // Check if the final response is ok
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Groq API error (${response.status}): ${errorData}`)
    }

    console.log(`[PREDICT] 📨 Received response from Groq API (status: ${response.status})`)

    const data = await response.json()
    console.log(`[PREDICT] 📄 Response data keys:`, Object.keys(data))

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.log('[PREDICT] ❌ Invalid response structure:', data)
      throw new Error('Invalid response structure from Groq API')
    }

    const content = data.choices[0].message.content
    console.log(`[PREDICT] 📝 Raw response content: "${content.substring(0, 200)}..."`)

    // Extract JSON from response
    let result
    try {
      console.log('[PREDICT] 🔍 Attempting direct JSON parse')
      result = JSON.parse(content)
      console.log('[PREDICT] ✅ Direct JSON parse successful')
    } catch {
      console.log('[PREDICT] 🔍 Direct parse failed, trying regex extraction')
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
        console.log('[PREDICT] ✅ Regex JSON extraction successful')
      } else {
        console.log('[PREDICT] ❌ Could not find JSON in response')
        throw new Error('Could not parse JSON from response')
      }
    }

    console.log(`[PREDICT] 📊 Parsed result:`, result)

    // Validate result
    if (!result.predicted_stars || result.predicted_stars < 1 || result.predicted_stars > 5) {
      console.log(`[PREDICT] ❌ Invalid rating: ${result.predicted_stars}`)
      throw new Error('Invalid rating in response')
    }

    console.log(`[PREDICT] ✅ Validation passed - rating: ${result.predicted_stars}`)

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
    console.error('[PREDICT] ❌ Prediction error:', error)
    console.error('[PREDICT] ❌ Error stack:', error.stack)
    console.error('[PREDICT] ❌ Error message:', error.message)

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
          'Check API Key': 'Ensure GROQ_API_KEY is set in .env.local',
          'Check Internet': 'Verify your internet connection is working',
          'Check Quota': 'Verify your Groq API quota is not exceeded',
          'Check Model': `Current model: ${modelName}`
        }
      },
      { status: statusCode }
    )
  }
}

