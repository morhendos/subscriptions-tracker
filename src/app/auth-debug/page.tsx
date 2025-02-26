'use client'

import { useState } from 'react'
import { diagnoseAuth, diagnoseMongo } from '../auth-diagnostic'

export default function AuthDebugPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mongoLoading, setMongoLoading] = useState(false)
  const [mongoResults, setMongoResults] = useState<any>(null)

  const handleTestAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await diagnoseAuth(email, password)
      setResults(result)
    } catch (error) {
      console.error('Error running auth diagnostic:', error)
      setResults({
        success: false,
        error: {
          code: 'runtime_error',
          message: error instanceof Error ? error.message : String(error)
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestMongo = async () => {
    setMongoLoading(true)
    try {
      const result = await diagnoseMongo()
      setMongoResults(result)
    } catch (error) {
      console.error('Error running MongoDB diagnostic:', error)
      setMongoResults({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setMongoLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debugging Tool</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Important:</strong> This page is for debugging only. Check your server console for the detailed diagnostic logs.
        </p>
      </div>

      <div className="mb-8 p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">MongoDB Connection Test</h2>
        <p className="mb-4">Test the direct connection to MongoDB and gather information about the database structure.</p>
        
        <button 
          onClick={handleTestMongo}
          disabled={mongoLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {mongoLoading ? 'Testing...' : 'Test MongoDB Connection'}
        </button>
        
        {mongoResults && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Results:</h3>
            <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(mongoResults, null, 2)}
            </pre>
            <p className="mt-2 text-gray-600 text-sm">
              See server console for detailed diagnostic logs.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border border-gray-200 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
        
        <form onSubmit={handleTestAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
        </form>
        
        {results && (
          <div className="mt-6 p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Authentication Results:</h3>
            <div className={`px-3 py-2 rounded-md mb-4 ${results.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Status: {results.success ? 'Success' : 'Failed'}
              {results.error && (
                <div className="mt-1">
                  <strong>Error:</strong> {results.error.message} ({results.error.code})
                </div>
              )}
            </div>
            
            <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(results, null, 2)}
            </pre>
            
            <p className="mt-2 text-gray-600 text-sm">
              See server console for detailed diagnostic logs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
