import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

interface SummarizeRequest {
  review_text: string
  user_rating: number
  predicted_rating: number
  corrected: boolean
}

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.MODEL_NAME || 'gemini-pro'

  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const geminiUrl = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`
  
  const response = await fetch(geminiUrl, {
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
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Gemini API error: ${errorData}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

// Export function for internal use
export async function generateSummary(data: {
  review_text: string
  user_rating: number
  predicted_rating: number
  corrected: boolean
}) {
  const { review_text, user_rating, predicted_rating, corrected } = data

  // Generate AI Summary
  const summaryPrompt = `You are a business intelligence analyst. Provide a concise, professional summary of the following Yelp review.

Review: "${review_text}"
User Rating: ${user_rating} stars
AI Predicted Rating: ${predicted_rating} stars
${corrected ? 'Note: User corrected the AI prediction' : 'Note: User agreed with AI prediction'}

Provide a brief summary (2-3 sentences) highlighting:
1. Main sentiment and key points
2. Specific issues or praises mentioned
3. Overall customer satisfaction level

Return ONLY the summary text, no additional formatting.`

  // Generate Recommended Actions
  const actionsPrompt = `You are a business consultant. Based on this Yelp review, suggest 2-3 specific, actionable recommendations for the business owner.

Review: "${review_text}"
User Rating: ${user_rating} stars

Focus on:
- Immediate actions to address specific issues (if negative)
- Ways to leverage positive feedback (if positive)
- Overall improvements for customer satisfaction

Provide 2-3 concise, actionable recommendations. Format as a JSON array:
{
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}`

  try {
    console.log('🤖 Calling Gemini API to generate summary and actions...')
    
    // Generate both summary and recommendations in parallel
    const [summary, actionsResponse] = await Promise.all([
      callGeminiAPI(summaryPrompt),
      callGeminiAPI(actionsPrompt)
    ])

    console.log('✅ Received responses from Gemini API')

    // Parse recommendations
    let recommendations: string[] = []
    try {
      // Try to find JSON in the response
      const actionsMatch = actionsResponse.match(/\{[\s\S]*\}/)
      if (actionsMatch) {
        const parsed = JSON.parse(actionsMatch[0])
        recommendations = parsed.recommendations || []
      } else {
        // Fallback: extract bullet points or numbered list
        const lines = actionsResponse
          .split('\n')
          .filter(line => line.trim().match(/^[-•\d.]/) || (line.trim().length > 20 && !line.trim().startsWith('{')))
          .slice(0, 3)
        recommendations = lines.map(line => line.replace(/^[-•\d.\s]+/, '').trim()).filter(r => r.length > 0)
      }
      
      // Ensure we have at least 2 recommendations
      if (recommendations.length === 0) {
        throw new Error('No recommendations parsed')
      }
    } catch (parseErr) {
      console.warn('Failed to parse recommendations, using fallback:', parseErr)
      // Fallback recommendations
      recommendations = [
        'Monitor similar feedback patterns',
        'Review and respond to customer concerns',
        'Consider implementing suggested improvements'
      ]
    }

    const result = {
      summary: summary.trim(),
      recommended_actions: recommendations.filter(r => r.length > 0 && r.length < 200) // Filter out invalid recommendations
    }

    console.log('✅ Successfully generated:', {
      summaryLength: result.summary.length,
      actionsCount: result.recommended_actions.length
    })

    return result
  } catch (error: any) {
    console.error('❌ Error generating summary:', error)
    // Fallback if AI generation fails
    return {
      summary: `Review rated ${user_rating} stars. ${review_text.substring(0, 150)}${review_text.length > 150 ? '...' : ''}`,
      recommended_actions: [
        'Review customer feedback',
        'Address any concerns mentioned',
        'Monitor customer satisfaction trends'
      ]
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json()
    const { review_text, user_rating, predicted_rating, corrected } = body

    if (!review_text) {
      return NextResponse.json(
        { error: 'Review text is required' },
        { status: 400 }
      )
    }

    const result = await generateSummary({
      review_text,
      user_rating,
      predicted_rating,
      corrected
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Summarize error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

