import React, { useState, useEffect } from 'react'
import { RefreshCw, Database, Eye, MousePointer, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { promotionService } from '../../services/promotionService'
import { Promotion } from '../../types'

interface TestResult {
  test: string
  status: 'pending' | 'pass' | 'fail'
  message: string
  data?: any
}

const PromotionTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'Get Active Promotions', fn: testGetActivePromotions },
      { name: 'Get Banner Promotions', fn: testGetBannerPromotions },
      { name: 'Get Modal Promotions', fn: testGetModalPromotions },
      { name: 'Promotion Validation', fn: testPromotionValidation },
      { name: 'Targeting System', fn: testTargetingSystem },
      { name: 'Analytics Tracking', fn: testAnalyticsTracking },
      { name: 'Dismissal Tracking', fn: testDismissalTracking }
    ]

    for (const test of tests) {
      try {
        const result = await test.fn()
        setTestResults(prev => [...prev, result])
      } catch (error) {
        setTestResults(prev => [...prev, {
          test: test.name,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error'
        }])
      }
    }

    setIsRunning(false)
  }

  const testDatabaseConnection = async (): Promise<TestResult> => {
    try {
      // Test basic Supabase connection by trying to fetch promotions
      const promotions = await promotionService.getActivePromotions()
      
      return {
        test: 'Database Connection',
        status: 'pass',
        message: 'Successfully connected to Supabase',
        data: { promotionCount: promotions.length }
      }
    } catch (error) {
      return {
        test: 'Database Connection',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  const testGetActivePromotions = async (): Promise<TestResult> => {
    try {
      const promotions = await promotionService.getActivePromotions()
      setPromotions(promotions)

      return {
        test: 'Get Active Promotions',
        status: 'pass',
        message: `Retrieved ${promotions.length} active promotions`,
        data: { promotions: promotions.slice(0, 3) } // Show first 3
      }
    } catch (error) {
      return {
        test: 'Get Active Promotions',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get promotions'
      }
    }
  }

  const testGetBannerPromotions = async (): Promise<TestResult> => {
    try {
      const bannerPromotions = await promotionService.getBannerPromotions()
      
      return {
        test: 'Get Banner Promotions',
        status: 'pass',
        message: `Retrieved ${bannerPromotions.length} banner promotions`,
        data: { bannerPromotions: bannerPromotions.slice(0, 2) }
      }
    } catch (error) {
      return {
        test: 'Get Banner Promotions',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get banner promotions'
      }
    }
  }

  const testGetModalPromotions = async (): Promise<TestResult> => {
    try {
      const modalPromotions = await promotionService.getModalPromotions()
      
      return {
        test: 'Get Modal Promotions',
        status: 'pass',
        message: `Retrieved ${modalPromotions.length} modal promotions`,
        data: { modalPromotions: modalPromotions.slice(0, 2) }
      }
    } catch (error) {
      return {
        test: 'Get Modal Promotions',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get modal promotions'
      }
    }
  }

  const testPromotionValidation = async (): Promise<TestResult> => {
    try {
      // Get fresh promotions for validation test
      const testPromotions = await promotionService.getActivePromotions()
      
      if (testPromotions.length === 0) {
        return {
          test: 'Promotion Validation',
          status: 'fail',
          message: 'No promotions to validate'
        }
      }

      const testPromotion = testPromotions[0]
      const isValid = promotionService.isPromotionValid(testPromotion)

      return {
        test: 'Promotion Validation',
        status: isValid ? 'pass' : 'fail',
        message: isValid ? 'Promotion validation working correctly' : 'Promotion validation failed',
        data: {
          promotion: {
            id: testPromotion.id,
            title: testPromotion.title,
            validFrom: testPromotion.validFrom,
            validUntil: testPromotion.validUntil,
            isActive: testPromotion.isActive
          },
          isValid
        }
      }
    } catch (error) {
      return {
        test: 'Promotion Validation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Validation test failed'
      }
    }
  }

  const testTargetingSystem = async (): Promise<TestResult> => {
    try {
      const targeting = {
        sessionId: 'test-session-123',
        branchId: 'test-branch-456',
        customerId: 'test-customer-789'
      }

      const targetedPromotions = await promotionService.getActivePromotions(targeting)

      return {
        test: 'Targeting System',
        status: 'pass',
        message: `Targeting system working - ${targetedPromotions.length} promotions for test context`,
        data: { targeting, promotionCount: targetedPromotions.length }
      }
    } catch (error) {
      return {
        test: 'Targeting System',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Targeting test failed'
      }
    }
  }

  const testAnalyticsTracking = async (): Promise<TestResult> => {
    try {
      // Get fresh promotions for analytics test
      const testPromotions = await promotionService.getActivePromotions()
      
      if (testPromotions.length === 0) {
        return {
          test: 'Analytics Tracking',
          status: 'fail',
          message: 'No promotions to track'
        }
      }

      const testPromotion = testPromotions[0]
      
      // Track a test view event
      await promotionService.trackPromotionEvent({
        promotionId: testPromotion.id,
        eventType: 'view',
        sessionId: 'test-session-analytics',
        branchId: 'test-branch',
        customerId: 'test-customer',
        eventData: { test: true }
      })

      return {
        test: 'Analytics Tracking',
        status: 'pass',
        message: 'Analytics tracking working correctly',
        data: { trackedEvent: 'view', promotionId: testPromotion.id }
      }
    } catch (error) {
      return {
        test: 'Analytics Tracking',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Analytics tracking failed'
      }
    }
  }

  const testDismissalTracking = async (): Promise<TestResult> => {
    try {
      // Get fresh promotions for dismissal test
      const testPromotions = await promotionService.getActivePromotions()
      
      if (testPromotions.length === 0) {
        return {
          test: 'Dismissal Tracking',
          status: 'fail',
          message: 'No promotions to dismiss'
        }
      }

      const testPromotion = testPromotions[0]
      
      // Track a test dismissal
      await promotionService.trackPromotionDismissal(
        testPromotion.id,
        'test-customer',
        'test-branch',
        'user_action'
      )

      return {
        test: 'Dismissal Tracking',
        status: 'pass',
        message: 'Dismissal tracking working correctly',
        data: { dismissedPromotion: testPromotion.id }
      }
    } catch (error) {
      return {
        test: 'Dismissal Tracking',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Dismissal tracking failed'
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'pending':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="w-6 h-6 mr-3 text-blue-600" />
            Promotion System Test Suite
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing of the promotion system with Supabase integration
          </p>
        </div>

        <div className="p-6">
          {/* Test Controls */}
          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{result.test}</h3>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer hover:underline">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promotion Data Display */}
          {promotions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Promotions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {promotions.slice(0, 6).map((promotion) => (
                  <div key={promotion.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{promotion.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Type: {promotion.discountType}</div>
                      <div>Value: {promotion.discountValue}</div>
                      <div>Audience: {promotion.targetAudience}</div>
                      <div>
                        Valid:{' '}
                        {new Date(promotion.validFrom).toLocaleDateString('en-PH', {
                          timeZone: 'Asia/Manila'
                        })}{' '}
                        -{' '}
                        {new Date(promotion.validUntil).toLocaleDateString('en-PH', {
                          timeZone: 'Asia/Manila'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {testResults.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'pass').length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'fail').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromotionTestSuite
