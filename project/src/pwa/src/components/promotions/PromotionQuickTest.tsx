import React, { useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, Database } from 'lucide-react'
import { promotionService } from '../../services/promotionService'

const PromotionQuickTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<{
    connection: boolean
    promotions: number
    error?: string
  } | null>(null)

  const runQuickTest = async () => {
    setIsRunning(true)
    setResults(null)

    try {
      // Test 1: Database connection
      const promotions = await promotionService.getActivePromotions()
      
      setResults({
        connection: true,
        promotions: promotions.length,
        error: undefined
      })
    } catch (error) {
      setResults({
        connection: false,
        promotions: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Promotion Quick Test
          </h1>
          <p className="text-gray-600 mt-1">
            Quick test to verify promotion system is working
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={runQuickTest}
            disabled={isRunning}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Testing...' : 'Run Quick Test'}</span>
          </button>

          {results && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-3">
                {results.connection ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={results.connection ? 'text-green-600' : 'text-red-600'}>
                  Database Connection: {results.connection ? 'Success' : 'Failed'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600">
                  Active Promotions: {results.promotions} found
                </span>
              </div>

              {results.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {results.error}
                  </p>
                </div>
              )}

              {results.connection && results.promotions > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">
                    ✅ Promotion system is working correctly! Found {results.promotions} active promotions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromotionQuickTest
