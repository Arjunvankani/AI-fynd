import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Check if Vercel KV is available (for production data persistence)
const USE_KV = process.env.KV_URL && process.env.KV_REST_API_URL

async function readFeedback(): Promise<any[]> {
  if (USE_KV) {
    try {
      console.log('[KV] Analytics reading feedback from Vercel KV')
      const feedback = await kv.get('feedback_data') || []
      console.log(`[KV] Analytics retrieved ${Array.isArray(feedback) ? feedback.length : 0} feedback entries`)
      return Array.isArray(feedback) ? feedback : []
    } catch (error) {
      console.error('[KV] Analytics error reading from KV:', error)
      return []
    }
  }

  // Fallback to file storage for local development
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('timePeriod') || 'hour'

    const feedback = await readFeedback()

    if (feedback.length === 0) {
      return NextResponse.json({
        analytics: {
          total_feedback: 0,
          accuracy_rate: 0,
          corrections_count: 0,
          average_error: 0,
          rating_distribution: [],
          sentiment_distribution: [],
          time_based_responses: []
        }
      })
    }

    // Calculate metrics (no longer weighted)
    const total_feedback = feedback.length
    const correct_predictions = feedback.filter(f => !f.corrected).length
    const accuracy_rate = total_feedback > 0 ? correct_predictions / total_feedback : 0
    const corrections_count = feedback.filter(f => f.corrected).length

    // Average error calculation
    const total_error = feedback.reduce((sum, f) => {
      return sum + Math.abs(f.predicted_rating - f.user_rating)
    }, 0)
    const average_error = total_feedback > 0 ? total_error / total_feedback : 0

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

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate analytics' },
      { status: 500 }
    )
  }
}

