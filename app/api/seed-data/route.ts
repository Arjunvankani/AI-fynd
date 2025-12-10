import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Sample feedback data for testing
const sampleFeedback = [
  {
    id: 'sample-1',
    review_text: 'Amazing experience! The food was incredible, service was top-notch, and the atmosphere was perfect. Highly recommend!',
    predicted_rating: 5,
    user_rating: 5,
    corrected: false,
    feedback_type: 'user_correction',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
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
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    ai_summary: 'Customer enjoyed the food quality but experienced significant delays in service.',
    recommended_actions: ['Review service staffing during peak hours', 'Implement order tracking system']
  },
  {
    id: 'sample-3',
    review_text: 'Terrible experience. Cold food, rude staff, and dirty restaurant. Never coming back.',
    predicted_rating: 2,
    user_rating: 1,
    corrected: true,
    feedback_type: 'user_correction',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    ai_summary: 'Customer reported multiple serious issues including food quality, staff behavior, and cleanliness.',
    recommended_actions: ['Conduct immediate staff training', 'Deep cleaning of restaurant', 'Quality control review']
  },
  {
    id: 'sample-4',
    review_text: 'Decent place. Nothing special but the food was okay and prices were reasonable.',
    predicted_rating: 3,
    user_rating: 3,
    corrected: false,
    feedback_type: 'user_correction',
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    ai_summary: 'Customer found the establishment adequate but unremarkable in all aspects.',
    recommended_actions: ['Consider menu updates to increase appeal', 'Gather feedback on specific improvements']
  },
  {
    id: 'sample-5',
    review_text: 'Outstanding! Best restaurant in town. The chef is a genius and the wine selection is amazing.',
    predicted_rating: 5,
    user_rating: 5,
    corrected: false,
    feedback_type: 'user_correction',
    timestamp: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    ai_summary: 'Customer praised the culinary expertise and beverage selection, calling it the best in town.',
    recommended_actions: ['Feature chef in marketing materials', 'Highlight wine selection in promotions']
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('[SEED] Starting data seeding process')

    // Check if KV is available
    const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

    if (!USE_KV) {
      console.log('[SEED] KV not available, cannot seed data')
      return NextResponse.json({
        error: 'Vercel KV not configured. Please set up KV storage first.',
        setup_instructions: [
          'Go to Vercel Dashboard → Storage → Create Database → KV',
          'Add environment variables: KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN',
          'Redeploy the application'
        ]
      }, { status: 500 })
    }

    // Seed the sample data
    console.log(`[SEED] Seeding ${sampleFeedback.length} sample feedback entries`)
    await kv.set('feedback_data', sampleFeedback)

    // Verify the data was saved
    const savedData = await kv.get('feedback_data')
    const savedCount = Array.isArray(savedData) ? savedData.length : 0

    console.log(`[SEED] Successfully seeded ${savedCount} feedback entries`)

    return NextResponse.json({
      success: true,
      message: `Seeded ${savedCount} sample feedback entries`,
      data: {
        total_entries: savedCount,
        sample_ratings: sampleFeedback.map(f => ({ rating: f.user_rating, corrected: f.corrected }))
      }
    })

  } catch (error: any) {
    console.error('[SEED] Error seeding data:', error)
    return NextResponse.json({
      error: 'Failed to seed data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

    if (!USE_KV) {
      return NextResponse.json({
        kv_available: false,
        message: 'Vercel KV not configured'
      })
    }

    const data = await kv.get('feedback_data')
    const count = Array.isArray(data) ? data.length : 0

    return NextResponse.json({
      kv_available: true,
      feedback_count: count,
      message: `KV is working with ${count} feedback entries`
    })

  } catch (error: any) {
    return NextResponse.json({
      kv_available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
