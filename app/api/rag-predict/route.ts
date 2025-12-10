import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Simple text similarity function (could be enhanced with embeddings)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/)
  const words2 = text2.toLowerCase().split(/\s+/)

  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]

  return intersection.length / union.length
}

async function findSimilarFeedback(reviewText: string, limit: number = 5) {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    const feedback = JSON.parse(data)

    // Find similar feedback entries
    const similarFeedback = feedback
      .filter((f: any) => f.corrected) // Only use corrected entries
      .map((f: any) => ({
        ...f,
        similarity: calculateSimilarity(reviewText, f.review_text)
      }))
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, limit)

    return similarFeedback
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { review_text } = await request.json()

    if (!review_text || review_text.length < 10) {
      return NextResponse.json(
        { error: 'Review text must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Find similar past feedback
    const similarFeedback = await findSimilarFeedback(review_text)

    type CorrectionPattern = {
      original_prediction: number
      corrected_to: number
      error_type: 'over_rated' | 'under_rated' | 'accurate'
      error_magnitude: number
      similarity: number
    }

    // Analyze patterns from similar feedback
    const correctionPatterns: CorrectionPattern[] = similarFeedback.map((f: any) => {
      const error = f.predicted_rating - f.user_rating
      return {
        original_prediction: f.predicted_rating,
        corrected_to: f.user_rating,
        error_type: error > 0 ? 'over_rated' : error < 0 ? 'under_rated' : 'accurate',
        error_magnitude: Math.abs(error),
        similarity: f.similarity
      }
    })

    // Calculate adjustment based on patterns
    const overRatedCount = correctionPatterns.filter(p => p.error_type === 'over_rated').length
    const underRatedCount = correctionPatterns.filter(p => p.error_type === 'under_rated').length

    let adjustment = 0
    if (overRatedCount > underRatedCount) {
      adjustment = -0.5 // Tend to predict lower
    } else if (underRatedCount > overRatedCount) {
      adjustment = 0.5 // Tend to predict higher
    }

    // Enhanced prompt with RAG context
    const ragContext = correctionPatterns.length > 0
      ? `\n\nHistorical Correction Patterns from Similar Reviews:
${correctionPatterns.slice(0, 3).map(p =>
  `- Review similar to this one was ${p.error_type.replace('_', ' ')} by ${p.error_magnitude} stars`
).join('\n')}

Based on these patterns, adjust your prediction ${adjustment > 0 ? 'upward' : adjustment < 0 ? 'downward' : 'conservatively'}.`
      : ''

    const enhancedPrompt = `You are an expert Yelp review rating classifier. Analyze reviews systematically.

Rating Guidelines:
- 1 star: Terrible experience, multiple severe complaints, would not recommend
- 2 stars: Disappointing, below expectations, significant issues
- 3 stars: Average, acceptable but nothing special, neutral experience
- 4 stars: Good experience, positive overall, would recommend
- 5 stars: Excellent, exceptional experience, highest praise

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
  "adjustment_applied": "${adjustment !== 0 ? 'yes' : 'no'}"
}`

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

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: enhancedPrompt }],
        temperature: 0.0,
        max_tokens: 500,
        top_p: 1,
        stream: false
      })
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text()
      throw new Error(`Groq API error: ${errorData}`)
    }

    const data = await groqResponse.json()
    const content = data.choices[0].message.content

    let result
    try {
      result = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse JSON from response')
      }
    }

    if (!result.predicted_stars || result.predicted_stars < 1 || result.predicted_stars > 5) {
      throw new Error('Invalid rating in response')
    }

    const prediction_id = `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      predicted_stars: result.predicted_stars,
      explanation: result.explanation || 'No explanation provided',
      confidence: result.confidence || 'medium',
      prediction_id,
      rag_used: correctionPatterns.length > 0,
      similar_cases_found: correctionPatterns.length,
      adjustment_applied: result.adjustment_applied === 'yes'
    })
  } catch (error: any) {
    console.error('RAG Prediction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate RAG prediction' },
      { status: 500 }
    )
  }
}
