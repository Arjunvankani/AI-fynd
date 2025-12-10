import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const FEEDBACK_FILE = path.join(process.cwd(), 'data', 'feedback.json')

// Check if we're in a serverless environment (Vercel, Netlify, etc.)
const IS_SERVERLESS = process.env.VERCEL || process.env.NETLIFY || !process.cwd().includes('Desktop')

// In-memory storage for serverless environments
let regenerateMemoryStorage: any[] = []

async function ensureDataDir() {
  if (IS_SERVERLESS) return // Skip in serverless environments

  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

async function readFeedback(): Promise<any[]> {
  if (IS_SERVERLESS) {
    console.log('[SERVERLESS] Using in-memory storage for feedback (regenerate-summaries)')
    return regenerateMemoryStorage
  }

  try {
    await ensureDataDir()
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeFeedback(feedback: any[]) {
  if (IS_SERVERLESS) {
    regenerateMemoryStorage = feedback
    console.log(`[SERVERLESS] Stored ${feedback.length} feedback entries in memory (regenerate-summaries)`)
    return
  }

  try {
    await ensureDataDir()
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedback, null, 2))
    console.log(`Successfully wrote ${feedback.length} feedback entries to file`)
  } catch (error) {
    console.error('Error writing feedback file:', error)
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

