import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Check if Vercel KV is available (for production data persistence)
const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

console.log('[STORAGE] Analytics USE_KV:', USE_KV, 'KV_URL:', !!process.env.KV_URL, 'KV_REST_API_URL:', !!process.env.KV_REST_API_URL)

async function readFeedback(): Promise<any[]> {
  console.log('[ANALYTICS] Reading feedback data...')
  console.log('[ANALYTICS] USE_KV:', USE_KV)

  if (USE_KV) {
    try {
      console.log('[KV] Analytics reading feedback from Vercel KV')
      const feedback = await kv.get('feedback_data') || []
      const feedbackArray = Array.isArray(feedback) ? feedback : []
      console.log(`[KV] Analytics retrieved ${feedbackArray.length} feedback entries`)

      // Log some sample data for debugging
      if (feedbackArray.length > 0) {
        console.log('[KV] Sample feedback entry:', JSON.stringify(feedbackArray[0], null, 2))
      }

      return feedbackArray
    } catch (error) {
      console.error('[KV] Analytics error reading from KV:', error)
      console.error('[KV] Error details:', error instanceof Error ? error.message : 'Unknown error')
      return []
    }
  }

  // Fallback to file storage for local development
  console.log('[ANALYTICS] Using file storage fallback')
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    const feedback = JSON.parse(data)
    console.log(`[FILE] Analytics read ${feedback.length} entries from file`)
    return feedback
  } catch (error) {
    console.log('[FILE] Error reading feedback file:', error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

export async function GET(request: Request) {
  try {
    console.log('[ANALYTICS] ===== ANALYTICS REQUEST START =====')

    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('timePeriod') || 'hour'
    console.log('[ANALYTICS] Time period:', timePeriod)

    const feedback = await readFeedback()
    console.log('[ANALYTICS] Total feedback entries found:', feedback.length)

    if (feedback.length === 0) {
      console.log('[ANALYTICS] No feedback data available, returning zeros')
      return NextResponse.json({
        analytics: {
          total_feedback: 0,
          accuracy_rate: 0,
          corrections_count: 0,
          average_error: 0,
          positive_count: 0,
          negative_count: 0,
          neutral_count: 0,
          rating_distribution: [],
          sentiment_distribution: [],
          time_based_responses: []
        }
      })
    }

    console.log('[ANALYTICS] Processing feedback data...')

    // Calculate metrics (no longer weighted)
    const total_feedback = feedback.length
    const correct_predictions = feedback.filter(f => !f.corrected).length
    const accuracy_rate = total_feedback > 0 ? correct_predictions / total_feedback : 0
    const corrections_count = feedback.filter(f => f.corrected).length

    console.log('[ANALYTICS] Basic metrics:')
    console.log(`  - Total feedback: ${total_feedback}`)
    console.log(`  - Correct predictions: ${correct_predictions}`)
    console.log(`  - Accuracy rate: ${accuracy_rate}`)
    console.log(`  - Corrections count: ${corrections_count}`)

    // Average error calculation
    const total_error = feedback.reduce((sum, f) => {
      return sum + Math.abs(f.predicted_rating - f.user_rating)
    }, 0)
    const average_error = total_feedback > 0 ? total_error / total_feedback : 0

    console.log(`  - Average error: ${average_error}`)

    // Pattern analysis for RAG system
    const error_patterns: { [key: string]: number } = {}
    feedback.forEach(f => {
      if (f.corrected) {
        const error_type = f.predicted_rating > f.user_rating ? 'over_rated' : 'under_rated'
        const error_magnitude = Math.abs(f.predicted_rating - f.user_rating)
        const key = `${error_type}_${error_magnitude}`
        error_patterns[key] = (error_patterns[key] || 0) + 1
      }
    })

    // Rating distribution
    const ratingDist: { [key: number]: number } = {}
    feedback.forEach(f => {
      ratingDist[f.user_rating] = (ratingDist[f.user_rating] || 0) + 1
    })
    const rating_distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingDist[rating] || 0
    }))

    // Positive/Negative Response Analysis
    // Positive: 4-5 stars, Negative: 1-2 stars, Neutral: 3 stars
    const positiveCount = feedback.filter(f => f.user_rating >= 4).length
    const negativeCount = feedback.filter(f => f.user_rating <= 2).length
    const neutralCount = feedback.filter(f => f.user_rating === 3).length

    console.log('[ANALYTICS] Sentiment analysis:')
    console.log(`  - Positive (4-5⭐): ${positiveCount}`)
    console.log(`  - Neutral (3⭐): ${neutralCount}`)
    console.log(`  - Negative (1-2⭐): ${negativeCount}`)

    const sentiment_distribution = [
      { sentiment: 'Positive (4-5⭐)', count: positiveCount, color: '#10b981' },
      { sentiment: 'Neutral (3⭐)', count: neutralCount, color: '#6366f1' },
      { sentiment: 'Negative (1-2⭐)', count: negativeCount, color: '#ef4444' }
    ]

    // Time-based Response Analysis (dynamic grouping based on timePeriod)
    const timeBasedMap: { [key: string]: { totalRating: number; count: number } } = {}

    feedback.forEach(f => {
      const date = new Date(f.timestamp)
      let timeKey: string

      switch (timePeriod) {
        case 'minute':
          // Group by minute: YYYY-MM-DD HH:MM
          timeKey = `${date.toISOString().split('T')[0]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
          break
        case 'hour':
          // Group by hour: YYYY-MM-DD HH:00
          timeKey = `${date.toISOString().split('T')[0]} ${String(date.getHours()).padStart(2, '0')}:00`
          break
        case 'day':
          // Group by day: YYYY-MM-DD
          timeKey = date.toISOString().split('T')[0]
          break
        case 'week':
          // Group by week: Get Monday of the week
          const weekStart = new Date(date)
          const day = date.getDay()
          const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
          weekStart.setDate(diff)
          timeKey = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          // Group by month: YYYY-MM
          timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          timeKey = `${date.toISOString().split('T')[0]} ${String(date.getHours()).padStart(2, '0')}:00`
      }

      if (!timeBasedMap[timeKey]) {
        timeBasedMap[timeKey] = { totalRating: 0, count: 0 }
      }

      timeBasedMap[timeKey].totalRating += f.user_rating
      timeBasedMap[timeKey].count++
    })

    const time_based_responses = Object.entries(timeBasedMap)
      .map(([time, data]) => ({
        time,
        averageRating: data.count > 0 ? parseFloat((data.totalRating / data.count).toFixed(2)) : 0,
        count: data.count
      }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(timePeriod === 'minute' ? -60 : timePeriod === 'hour' ? -24 : timePeriod === 'day' ? -30 : timePeriod === 'week' ? -12 : -12) // Last N periods

    const analyticsResponse = {
      analytics: {
        total_feedback,
        accuracy_rate,
        corrections_count,
        average_error,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        rating_distribution,
        sentiment_distribution,
        time_based_responses,
        error_patterns
      }
    }

    console.log('[ANALYTICS] Response summary:')
    console.log(`  - Total feedback: ${analyticsResponse.analytics.total_feedback}`)
    console.log(`  - Rating distribution length: ${analyticsResponse.analytics.rating_distribution.length}`)
    console.log(`  - Sentiment distribution:`, analyticsResponse.analytics.sentiment_distribution.map(s => `${s.sentiment}: ${s.count}`))
    console.log(`  - Time-based responses: ${analyticsResponse.analytics.time_based_responses.length} periods`)

    console.log('[ANALYTICS] ===== ANALYTICS REQUEST COMPLETE =====')

    return NextResponse.json(analyticsResponse)
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'Unknown error') || 'Failed to calculate analytics' },
      { status: 500 }
    )
  }
}

