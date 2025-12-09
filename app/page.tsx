'use client'

import { useState } from 'react'
import UserDashboard from '@/components/UserDashboard'
import AdminDashboard from '@/components/AdminDashboard'
import { BarChart3, User, Shield } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                Yelp Rating Predictor
              </h1>
            </div>
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('user')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === 'user'
                    ? 'bg-white shadow-md text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">User View</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white shadow-md text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span className="font-medium">Admin View</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'user' ? <UserDashboard /> : <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Developed by <span className="font-medium">Arjun Vankani</span>
            </p>
            <div className="flex justify-center space-x-4 text-xs text-gray-500">
              <a
                href="https://github.com/Arjunvankani?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                GitHub
              </a>
              <span>•</span>
              <a
                href="https://www.linkedin.com/in/arjun-vankani/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

