'use client'

import { useState } from 'react'
import axios from 'axios'
import { Sparkles, Clock, TrendingUp, CheckCircle2, AlertCircle, Brain, RefreshCw } from 'lucide-react'
import StarRating from './StarRating'
import FeedbackPanel from './FeedbackPanel'

interface PredictionResult {
  predicted_stars: number
  explanation: string
  confidence: 'high' | 'medium' | 'low'
  prediction_id?: string
  rag_used?: boolean
  similar_cases_found?: number
  adjustment_applied?: boolean
  suggestions?: Array<{
    original_rating: number
    corrected_rating: number
    pattern_type: string
    confidence: string
  }>
}

export default function UserDashboard() {
  const [reviewText, setReviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const exampleReviews = [
    "Amazing experience! The food was incredible, service was top-notch, and the atmosphere was perfect. Will definitely be back!",
    "Terrible service and cold food. Not worth the money. Very disappointed.",
    "It was okay. Nothing special but not bad either. Average experience overall.",
    "Good food but the wait time was too long. Service could be better."
  ]

  const handlePredict = async () => {
    if (!reviewText.trim() || reviewText.length < 10) {
      setError('Please enter a valid review (at least 10 characters)')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setFeedbackSubmitted(false)

    try {
      console.log('🔮 Starting prediction request...')
      const response = await axios.post('/api/predict', {
        review_text: reviewText
      })

      console.log('✅ Prediction successful:', response.data)
      setResult(response.data)
    } catch (err: any) {
      console.error('🚨 Prediction error:', err)

      const errorData = err.response?.data
      const isServerError = err.response?.status >= 500

      if (isServerError) {
        // For server errors, show a user-friendly message and auto-retry once
        console.log('🔄 Server error detected, attempting auto-retry...')
        setRetrying(true)
        setError('🤖 Our AI is thinking hard... Retrying automatically...')

        try {
          // Wait 2 seconds then retry once
          await new Promise(resolve => setTimeout(resolve, 2000))

          const retryResponse = await axios.post('/api/predict', {
            review_text: reviewText
          })

          console.log('✅ Retry successful!')
          setResult(retryResponse.data)
          setRetrying(false)
          return
        } catch (retryErr) {
          console.error('🚨 Retry also failed:', retryErr)
          setRetrying(false)
        }
      }

      // If retry failed or it's not a server error, show error message
      let errorMessage = 'Unable to analyze your review right now. Our AI is taking a coffee break! ☕'

      if (errorData?.error && !isServerError) {
        // Show specific error only for client errors (4xx)
        errorMessage = errorData.error
      }

      // Add helpful suggestion
      errorMessage += '\n\n💡 Try: Refresh the page or try a different review'

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async (userRating: number, corrected: boolean) => {
    if (!result?.prediction_id) return

    try {
      // Submit feedback - AI summary and actions will be generated automatically at this time
      const response = await axios.post('/api/feedback', {
        prediction_id: result.prediction_id,
        review_text: reviewText,
        predicted_rating: result.predicted_stars,
        user_rating: userRating,
        corrected: corrected,
        feedback_type: 'user_correction'
        // Note: ai_summary and recommended_actions are NOT provided here
        // They will be generated automatically by the API at submission time
      })
      
      setFeedbackSubmitted(true)
      
      // Feedback saved with AI summary and actions automatically generated at submission time
      console.log('✅ Feedback saved with AI-generated content:', {
        hasSummary: !!response.data.ai_summary,
        hasActions: response.data.recommended_actions?.length > 0
      })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          Predict Review Rating
        </h2>
        <p className="text-lg text-gray-600">
          Enter a Yelp review and get an instant AI-powered star rating prediction
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <h3 className="text-xl font-semibold text-gray-900">Enter Review</h3>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Type or paste your Yelp review here..."
            className="w-full h-48 p-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none transition-all"
            disabled={loading}
          />

          <button
            onClick={handlePredict}
            disabled={loading || retrying || !reviewText.trim()}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {retrying ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Retrying...
              </span>
            ) : loading ? (
              <span className="flex items-center justify-center">
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </span>
            ) : (
              '🔮 Predict Rating'
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Example Reviews */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Try these examples:</p>
            <div className="space-y-2">
              {exampleReviews.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setReviewText(example)}
                  className="w-full text-left text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 p-2 rounded transition-all"
                  disabled={loading}
                >
                  {example.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Prediction Results</h3>
          </div>

          {result ? (
            <>
              {/* Predicted Rating */}
              <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Predicted Rating</p>
                <div className="flex justify-center mb-2">
                  <StarRating rating={result.predicted_stars} interactive={false} size="large" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {result.predicted_stars} / 5 stars
                </p>
              </div>

              {/* Explanation */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Explanation:</p>
                <p className="text-gray-600">{result.explanation}</p>
              </div>

              {/* Confidence & RAG Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Confidence:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    result.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    result.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.confidence.toUpperCase()}
                  </span>
                </div>

                {/* RAG Information - Only show when meaningful patterns found */}
                {result.rag_used && result.suggestions && result.suggestions.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Smart Learning Applied</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">RAG Used:</span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Similar Cases:</span>
                        <span className="font-medium text-purple-700">{result.similar_cases_found || 0}</span>
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-gray-600">Adjustment Applied:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.adjustment_applied ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {result.adjustment_applied ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-purple-600 mb-2">
                        This exact review has been corrected {result.similar_cases_found || 0} time{(result.similar_cases_found || 0) > 1 ? 's' : ''} before
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-purple-700">Previous Corrections:</p>
                        {result.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-purple-100 p-2 rounded">
                            <div className="flex items-center space-x-2">
                              <span>AI: {suggestion.original_rating}⭐</span>
                              <span className="text-purple-600">→</span>
                              <span>User: {suggestion.corrected_rating}⭐</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                suggestion.pattern_type === 'over_rated' ? 'bg-red-100 text-red-700' :
                                suggestion.pattern_type === 'under_rated' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {suggestion.pattern_type.replace('_', ' ')}
                              </span>
                              <span className="text-purple-600">Exact Match</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Panel */}
              {feedbackSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">Thank you! Your feedback helps improve the model.</span>
                </div>
              ) : (
                <FeedbackPanel
                  predictedRating={result.predicted_stars}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  suggestions={result.suggestions}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a review above to see predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-1">1. Sentiment Analysis</p>
            <p>Analyzes the overall positive or negative tone</p>
          </div>
          <div>
            <p className="font-medium mb-1">2. Key Phrases</p>
            <p>Identifies specific compliments or complaints</p>
          </div>
          <div>
            <p className="font-medium mb-1">3. Rating Prediction</p>
            <p>Combines factors to predict star rating (1-5)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

