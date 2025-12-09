'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import StarRating from './StarRating'

interface FeedbackPanelProps {
  predictedRating: number
  onFeedbackSubmit: (userRating: number, corrected: boolean) => void
  suggestions?: Array<{
    original_rating: number
    corrected_rating: number
    pattern_type: string
    confidence: string
  }>
}

export default function FeedbackPanel({ predictedRating, onFeedbackSubmit, suggestions }: FeedbackPanelProps) {
  const [userRating, setUserRating] = useState(predictedRating)
  const [showRatingInput, setShowRatingInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleQuickFeedback = (corrected: boolean) => {
    if (!corrected) {
      // If prediction is correct, submit immediately
      onFeedbackSubmit(predictedRating, false)
    } else {
      // If incorrect, show rating input
      setShowRatingInput(true)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const corrected = userRating !== predictedRating
    await onFeedbackSubmit(userRating, corrected)
    setSubmitting(false)
  }

  if (showRatingInput) {
    return (
      <div className="border-2 border-primary-200 rounded-lg p-4 bg-primary-50 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            What should the correct rating be?
          </p>
          <StarRating
            rating={userRating}
            onRatingChange={setUserRating}
            interactive={true}
            size="medium"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Correction'}</span>
          </button>
          <button
            onClick={() => setShowRatingInput(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">Is this prediction correct?</p>

      {/* Suggestions from exact same reviews */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-700 mb-2">This exact review was previously corrected:</p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span>Previous: {suggestion.original_rating}⭐ → {suggestion.corrected_rating}⭐</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  suggestion.pattern_type === 'over_rated' ? 'bg-orange-100 text-orange-700' :
                  suggestion.pattern_type === 'under_rated' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {suggestion.pattern_type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => handleQuickFeedback(false)}
          className="flex-1 flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 py-2 px-4 rounded-lg transition-all border border-green-200"
        >
          <ThumbsUp className="h-5 w-5" />
          <span className="font-medium">Correct</span>
        </button>
        <button
          onClick={() => handleQuickFeedback(true)}
          className="flex-1 flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-4 rounded-lg transition-all border border-red-200"
        >
          <ThumbsDown className="h-5 w-5" />
          <span className="font-medium">Incorrect</span>
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Your feedback helps us analyze patterns and improve predictions
      </p>
    </div>
  )
}

