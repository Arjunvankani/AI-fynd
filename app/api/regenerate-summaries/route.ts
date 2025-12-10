import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { kv } from '@vercel/kv'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Check if Vercel KV is available (for production data persistence)
const USE_KV = !!(process.env.KV_URL || process.env.KV_REST_API_URL || process.env.KV_REST_API_TOKEN)

console.log('[STORAGE] Regenerate USE_KV:', USE_KV)

// Fallback in-memory storage (only for development/testing)
let regenerateMemoryStorage: any[] = []

async function ensureDataDir() {
  if (USE_KV) return // Skip when using KV storage

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
      console.log('[KV] Regenerate reading feedback from Vercel KV')
      const feedback = await kv.get('feedback_data') || []
      console.log(`[KV] Regenerate retrieved ${Array.isArray(feedback) ? feedback.length : 0} feedback entries`)
      return Array.isArray(feedback) ? feedback : []
    } catch (error) {
      console.error('[KV] Regenerate error reading feedback from KV:', error)
      return []
    }
  }

  // Check if we're in a serverless environment without KV
  const isServerlessWithoutKV = (process.env.VERCEL || process.env.NETLIFY) && !USE_KV

  if (isServerlessWithoutKV) {
    // In serverless without KV, return empty array (no data available)
    console.log('[STORAGE] Regenerate: No persistent storage in serverless environment without KV')
    return []
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
      console.log(`[KV] Regenerate writing ${feedback.length} feedback entries to Vercel KV`)
      await kv.set('feedback_data', feedback)
      console.log('[KV] Regenerate successfully stored feedback in Vercel KV')
      return
    } catch (error) {
      console.error('[KV] Regenerate error writing to KV:', error)
      throw error
    }
  }

  // Fallback to file storage for local development
  try {
    await ensureDataDir()
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedback, null, 2))
    console.log(`[FILE] Successfully wrote ${feedback.length} feedback entries to file`)
  } catch (error) {
    console.error('[FILE] Error writing feedback file:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const feedback = await readFeedback()
    
    // Import summarize function
    const { generateSummary } = await import('../../../lib/summarize')
    
    let updated = 0
    let errors = 0
    
    // Regenerate summaries for entries missing them
    for (let i = 0; i < feedback.length; i++) {
      const entry = feedback[i]
      
      // Check if summary or actions are missing
      if (!entry.ai_summary || !entry.recommended_actions || entry.recommended_actions.length === 0) {
        try {
          const summaryData = await generateSummary({
            review_text: entry.review_text,
            user_rating: entry.user_rating,
            predicted_rating: entry.predicted_rating,
            corrected: entry.corrected
          })
          
          feedback[i] = {
            ...entry,
            ai_summary: summaryData.summary,
            recommended_actions: summaryData.recommended_actions
          }
          
          updated++
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (err) {
          console.error(`Failed to generate summary for entry ${entry.id}:`, err)
          errors++
        }
      }
    }
    
    // Save updated feedback
    await writeFeedback(feedback)
    
    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: feedback.length
    })
  } catch (error: any) {
    console.error('Regenerate summaries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate summaries' },
      { status: 500 }
    )
  }
}

