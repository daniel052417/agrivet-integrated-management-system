import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'

interface TestResult {
  name: string
  status: 'loading' | 'success' | 'error'
  message: string
  details?: any
}

const SupabaseConnectionTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async (name: string, testFn: () => Promise<any>): Promise<TestResult> => {
    setTests(prev => [...prev, { name, status: 'loading', message: 'Running...' }])
    
    try {
      const result = await testFn()
      const testResult: TestResult = {
        name,
        status: 'success',
        message: 'Success',
        details: result
      }
      setTests(prev => prev.map(t => t.name === name ? testResult : t))
      return testResult
    } catch (error) {
      const testResult: TestResult = {
        name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
      setTests(prev => prev.map(t => t.name === name ? testResult : t))
      return testResult
    }
  }

  const testSupabaseConnection = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Environment Variables
    await runTest('Environment Variables', async () => {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error('Missing environment variables')
      }
      
      if (url === 'https://your-project-id.supabase.co' || key === 'your-anon-key-here') {
        throw new Error('Using placeholder values')
      }
      
      return { url, key: key.substring(0, 20) + '...' }
    })

    // Test 2: Supabase Client Initialization
    await runTest('Supabase Client', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
      
      if (!supabase) {
        throw new Error('Failed to create Supabase client')
      }
      
      return { client: 'Created successfully' }
    })

    // Test 3: Database Connection
    await runTest('Database Connection', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('count')
        .limit(1)
      
      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
      
      return { connection: 'Success', data }
    })

    // Test 4: Payment Methods Table
    await runTest('Payment Methods Table', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
      
      if (error) {
        throw new Error(`Table error: ${error.message}`)
      }
      
      if (!data || data.length === 0) {
        throw new Error('No payment methods found. Please run the database migration.')
      }
      
      return { count: data.length, methods: data }
    })

    // Test 5: Cash Payment Method
    await runTest('Cash Payment Method', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      )
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('type', 'cash')
        .eq('is_active', true)
        .single()
      
      if (error) {
        throw new Error(`Cash method error: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('Cash payment method not found. Please run the database migration.')
      }
      
      return data
    })

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Supabase Connection Test</h1>
          <p className="text-gray-600">
            This tool will help diagnose Supabase connection issues.
          </p>
        </div>
        
        <div className="p-6">
          <button
            onClick={testSupabaseConnection}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Run Connection Tests</span>
              </>
            )}
          </button>

          {tests.length > 0 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              {tests.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h3 className={`font-medium ${getStatusColor(test.status)}`}>
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {test.message}
                      </p>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tests.length > 0 && tests.every(t => t.status === 'success') && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">All Tests Passed!</span>
              </div>
              <p className="text-green-700 mt-1">
                Your Supabase connection is working correctly. The checkout system should work now.
              </p>
            </div>
          )}

          {tests.length > 0 && tests.some(t => t.status === 'error') && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Some Tests Failed</span>
              </div>
              <p className="text-red-700 mt-1">
                Please check the error messages above and fix the issues.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupabaseConnectionTest
