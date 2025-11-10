import React, { useState } from 'react'
import { authServiceDebug } from '../services/authServiceDebug'

// ============================================================================
// AUTH DEBUG TEST PAGE
// ============================================================================

export const AuthDebugTest: React.FC = () => {
  const [email, setEmail] = useState('test-debug@example.com')
  const [password, setPassword] = useState('password123')
  const [firstName, setFirstName] = useState('Test')
  const [lastName, setLastName] = useState('Debug')
  const [phone, setPhone] = useState('+1234567890')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-PH', {
      timeZone: 'Asia/Manila'
    })
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearLogs = () => {
    setLogs([])
  }

  const handleRegister = async () => {
    setLoading(true)
    setResult(null)
    clearLogs()
    
    addLog('🚀 Starting registration test...')
    
    try {
      const response = await authServiceDebug.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone
      })
      
      addLog(`✅ Registration completed: ${response.error ? 'FAILED' : 'SUCCESS'}`)
      setResult(response)
    } catch (error) {
      addLog(`❌ Registration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setResult(null)
    clearLogs()
    
    addLog('🚀 Starting login test...')
    
    try {
      const response = await authServiceDebug.login({
        email,
        password
      })
      
      addLog(`✅ Login completed: ${response.error ? 'FAILED' : 'SUCCESS'}`)
      setResult(response)
    } catch (error) {
      addLog(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestDatabase = async () => {
    setLoading(true)
    setResult(null)
    clearLogs()
    
    addLog('🧪 Testing database access...')
    
    try {
      const response = await authServiceDebug.testDatabaseAccess()
      
      addLog(`✅ Database test completed`)
      setResult(response)
    } catch (error) {
      addLog(`❌ Database test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Authentication Debug Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Form</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Registration'}
            </button>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Login'}
            </button>
            
            <button
              onClick={handleTestDatabase}
              disabled={loading}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Database Access'}
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
        <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run a test to see detailed debugging information.</p>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{logs.join('\n')}</pre>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}


















