'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Download,
  RefreshCw,
  Brain,
  Users,
  FileText,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
  X,
  CheckSquare,
  Square
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'

interface FeedbackData {
  id: string
  review_text: string
  predicted_rating: number
  user_rating: number
  corrected: boolean
  timestamp: string
  feedback_type?: string
  feedback_weight?: number
  ai_summary?: string
  recommended_actions?: string[]
}

interface Analytics {
  total_feedback: number
  accuracy_rate: number
  corrections_count: number
  average_error: number
  positive_count: number
  negative_count: number
  neutral_count: number
  rating_distribution: { rating: number; count: number }[]
  sentiment_distribution: { sentiment: string; count: number; color: string }[]
  time_based_responses: { hour: string; averageRating: number; count: number }[]
  error_patterns?: { [key: string]: number }
}

export default function AdminDashboard() {
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [trainingModel, setTrainingModel] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FeedbackData>>({})
  const [isFetching, setIsFetching] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'minute' | 'hour' | 'day' | 'week' | 'month'>('hour')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async (showProgress = true) => {
    // Prevent duplicate requests
    if (isFetching) {
      console.log('⏸️ Fetch already in progress, skipping...')
      return
    }
    
    setIsFetching(true)
    if (showProgress) setLoading(true)
    const startTime = Date.now()
    
    try {
      console.log('🔍 [DASHBOARD] Starting data fetch...')

      const [feedbackRes, analyticsRes] = await Promise.all([
        axios.get('/api/feedback'),
        axios.get(`/api/analytics?timePeriod=${timePeriod}`)
      ])

      const fetchTime = Date.now() - startTime
      console.log(`📊 [DASHBOARD] Fetched ${feedbackRes.data.feedback?.length || 0} feedback entries in ${fetchTime}ms`)
      console.log(`📊 [DASHBOARD] Analytics response:`, analyticsRes.data)

      setFeedbackData(feedbackRes.data.feedback || [])
      setAnalytics(analyticsRes.data.analytics || null)

      console.log(`📊 [DASHBOARD] Set analytics:`, analyticsRes.data.analytics)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      if (showProgress) setLoading(false)
      setIsFetching(false)
    }
  }

  useEffect(() => {
    // Initial data fetch
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 [DASHBOARD] Auto-refreshing analytics...')
      fetchData(false) // Don't show loading state for auto-refresh
    }, 30000) // 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [])


  const handleEdit = (feedback: FeedbackData) => {
    setEditingId(feedback.id)
    setEditForm({
      review_text: feedback.review_text,
      user_rating: feedback.user_rating,
      predicted_rating: feedback.predicted_rating,
      corrected: feedback.corrected
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await axios.put('/api/feedback', {
        id,
        ...editForm,
        regenerate_summary: true // Regenerate summary with new data
      })
      
      setEditingId(null)
      setEditForm({})
      await fetchData()
      alert('Feedback updated successfully!')
    } catch (err: any) {
      alert(`Failed to update: ${err.response?.data?.error || err.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      await axios.delete(`/api/feedback?id=${id}`)
      await fetchData()
      alert('Feedback deleted successfully!')
    } catch (err: any) {
      alert(`Failed to delete: ${err.response?.data?.error || err.message}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) {
      alert('Please select entries to delete')
      return
    }

    if (!confirm(`Delete ${selectedRows.size} selected entries?`)) return

    try {
      await Promise.all(
        Array.from(selectedRows).map(id => 
          axios.delete(`/api/feedback?id=${id}`)
        )
      )
      setSelectedRows(new Set())
      await fetchData()
      alert(`Successfully deleted ${selectedRows.size} entries!`)
    } catch (err) {
      alert('Failed to delete some entries')
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === feedbackData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(feedbackData.map(f => f.id)))
    }
  }

  const handleRegenerateSummaries = async () => {
    setTrainingModel(true)
    try {
      const response = await axios.post('/api/regenerate-summaries')
      alert(`Successfully regenerated ${response.data.updated} summaries!`)
      await fetchData()
    } catch (err) {
      alert('Failed to regenerate summaries. Please try again.')
    } finally {
      setTrainingModel(false)
    }
  }

  const handleTrainModel = async () => {
    setTrainingModel(true)
    try {
      await axios.post('/api/train', {
        feedback_ids: feedbackData.filter(f => f.corrected).map(f => f.id)
      })
      alert('Training data prepared! Corrections have been saved to training_data.json for future model improvement.')
      await fetchData()
    } catch (err) {
      alert('Failed to train model. Please try again.')
    } finally {
      setTrainingModel(false)
    }
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleExportData = () => {
    const csv = [
      ['Review Text', 'User Rating', 'Predicted Rating', 'Feedback Type', 'Weight', 'AI Summary', 'Recommended Actions', 'Corrected', 'Timestamp'],
      ...feedbackData.map(f => [
        f.review_text,
        f.user_rating,
        f.predicted_rating,
        f.feedback_type || 'user_correction',
        f.feedback_weight || (f.feedback_type === 'admin_feedback' ? 0.6 : 0.4),
        f.ai_summary || '',
        (f.recommended_actions || []).join('; '),
        f.corrected ? 'Yes' : 'No',
        f.timestamp
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback_data_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading && feedbackData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-600">Loading feedback data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-lg text-gray-600">
            Monitor feedback, analyze patterns, and prepare training data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isFetching}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all"
          >
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
          {selectedRows.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete Selected ({selectedRows.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.total_feedback}</p>
              </div>
              <Users className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Accuracy Rate</p>
                <p className="text-3xl font-bold text-green-600">{(analytics.accuracy_rate * 100).toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Corrections</p>
                <p className="text-3xl font-bold text-orange-600">{analytics.corrections_count}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Positive Reviews</p>
                <p className="text-3xl font-bold text-green-600">{analytics.positive_count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.total_feedback > 0 ? ((analytics.positive_count / analytics.total_feedback) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Neutral Reviews</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.neutral_count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.total_feedback > 0 ? ((analytics.neutral_count / analytics.total_feedback) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Negative Reviews</p>
                <p className="text-3xl font-bold text-red-600">{analytics.negative_count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.total_feedback > 0 ? ((analytics.negative_count / analytics.total_feedback) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.rating_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="Feedback Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Positive vs Negative Responses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.sentiment_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sentiment" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Count">
                  {analytics.sentiment_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Time-Based Response Analysis</h3>
              <div className="flex items-center space-x-2">
                <label htmlFor="timePeriod" className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  id="timePeriod"
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value as typeof timePeriod)
                    fetchData(true) // Refresh data with new time period
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analytics.time_based_responses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tickFormatter={(value) => {
                    try {
                      const date = new Date(value)
                      switch (timePeriod) {
                        case 'minute':
                          return date.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })
                        case 'hour':
                          return date.toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            hour12: true
                          })
                        case 'day':
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        case 'week':
                          const weekStart = new Date(date)
                          weekStart.setDate(date.getDate() - date.getDay())
                          return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        case 'month':
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })
                        default:
                          return value
                      }
                    } catch {
                      return value
                    }
                  }}
                />
                <YAxis
                  domain={[1, 5]}
                  tickCount={5}
                  label={{ value: 'Rating (Stars)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} ⭐`, 'Average Rating']}
                  labelFormatter={(label) => {
                    try {
                      const date = new Date(label)
                      const formatted = date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                      return `Time: ${formatted}`
                    } catch {
                      return `Time: ${label}`
                    }
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageRating"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  name="Average Rating (⭐)"
                  dot={{ fill: '#0ea5e9', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* All Submissions Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            All Submissions ({feedbackData.length} total)
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleRegenerateSummaries}
              disabled={trainingModel}
              className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <Brain className="h-4 w-4" />
              <span>Regenerate Summaries</span>
            </button>
            <button
              onClick={handleTrainModel}
              disabled={trainingModel || !feedbackData.some(f => f.corrected)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
            >
              <Brain className="h-4 w-4" />
              <span>Prepare Training Data</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {selectedRows.size === feedbackData.length && feedbackData.length > 0 ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-12"></th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Review</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">User Rating</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Predicted</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData.map((feedback) => {
                const isExpanded = expandedRows.has(feedback.id)
                const isSelected = selectedRows.has(feedback.id)
                const isEditing = editingId === feedback.id

                return (
                  <>
                    <tr 
                      key={feedback.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(feedback.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRow(feedback.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 max-w-md">
                        <div className="truncate">
                          {isEditing ? (
                            <textarea
                              value={editForm.review_text || ''}
                              onChange={(e) => setEditForm({...editForm, review_text: e.target.value})}
                              className="w-full p-2 border rounded text-sm"
                              rows={2}
                            />
                          ) : (
                            <>
                              {feedback.review_text.substring(0, 80)}
                              {feedback.review_text.length > 80 && '...'}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <select
                            value={editForm.user_rating || 3}
                            onChange={(e) => setEditForm({...editForm, user_rating: parseInt(e.target.value)})}
                            className="border rounded px-2 py-1"
                          >
                            {[1, 2, 3, 4, 5].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {feedback.user_rating} ⭐
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {feedback.predicted_rating} ⭐
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {feedback.corrected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Corrected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Correct
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2 justify-center">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(feedback.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditForm({})
                                }}
                                className="text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(feedback)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(feedback.id)
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${feedback.id}-expanded`} className="bg-gray-50">
                        <td colSpan={8} className="py-4 px-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Full Review */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">Full Review</h4>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {feedback.review_text}
                              </p>
                            </div>

                            {/* AI Summary */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="h-5 w-5 text-purple-600" />
                                <h4 className="font-semibold text-gray-900">AI-Generated Summary</h4>
                              </div>
                              <p className="text-sm text-gray-700">
                                {feedback.ai_summary || (
                                  <span className="text-gray-500 italic">
                                    Summary will be generated automatically.
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Recommended Actions */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
                              <div className="flex items-center space-x-2 mb-3">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                <h4 className="font-semibold text-gray-900">AI-Suggested Recommended Actions</h4>
                              </div>
                              <ul className="space-y-2">
                                {(feedback.recommended_actions && feedback.recommended_actions.length > 0) ? (
                                  feedback.recommended_actions.map((action, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span className="text-yellow-600 mt-1">•</span>
                                      <span className="text-sm text-gray-700">{action}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-sm text-gray-500 italic">
                                    Recommendations will be generated automatically.
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          {feedbackData.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback data yet. Wait for user submissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
