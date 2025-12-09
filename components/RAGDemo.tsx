'use client'

import { useState } from 'react'
import axios from 'axios'

export default function RAGDemo() {
  const [reviewText, setReviewText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleRAGPredict = async () => {
    if (!reviewText.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await axios.post('/api/rag-predict', {
        review_text: reviewText
      })
      setResult(response.data)
    } catch (error: any) {
      setResult({ error: error.response?.data?.error || error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">RAG Prediction Demo</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Text
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Enter a review to test RAG prediction..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleRAGPredict}
          disabled={loading || !reviewText.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing with RAG...' : 'Predict with RAG'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            {result.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <p>{result.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xl font-bold text-blue-600">
                    {result.predicted_stars} stars
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-gray-700">Explanation:</p>
                  <p className="text-gray-600">{result.explanation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Confidence:</span> {result.confidence}
                  </div>
                  <div>
                    <span className="font-semibold">RAG Used:</span> {result.rag_used ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-semibold">Similar Cases:</span> {result.similar_cases_found}
                  </div>
                  <div>
                    <span className="font-semibold">Adjustment Applied:</span> {result.adjustment_applied ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
