import { NextRequest, NextResponse } from 'next/server'
import { generateSummary } from '../../../lib/summarize'

interface SummarizeRequest {
  review_text: string
  user_rating: number
  predicted_rating: number
  corrected: boolean
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

