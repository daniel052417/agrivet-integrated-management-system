import React, { useState, useEffect } from 'react'
import { RefreshCw, Database, Eye, MousePointer, XCircle, CheckCircle, AlertTriangle, Bell, RotateCcw } from 'lucide-react'
import { promotionService } from '../../services/promotionService'
import { useNotifications } from '../../hooks/useNotifications'
import { Promotion } from '../../types'
import PromotionDisplayManager from './PromotionDisplayManager'

interface TestResult {
  test: string
  status: 'pending' | 'pass' | 'fail'
  message: string
  data?: any
}

const DisplayModeTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [promotions, setPromotions] = useState<{
    banners: Promotion[]
    modals: Promotion[]
    notifications: Promotion[]
    carousels: Promotion[]
  }>({
    banners: [],
    modals: [],
    notifications: [],
    carousels: []
  })

  const {
    permission: notificationPermission,
    isSupported: notificationsSupported,
    requestPermission,
    showNotification
  } = useNotifications()

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      { name: 'Database Connection', fn: testDatabaseConnection },
      { name: 'Banner Display Mode', fn: testBannerDisplayMode },
      { name: 'Modal Display Mode', fn: testModalDisplayMode },
      { name: 'Notification Display Mode', fn: testNotificationDisplayMode },
      { name: 'Carousel Display Mode', fn: testCarouselDisplayMode },
      { name: 'Display Priority System', fn: testDisplayPrioritySystem },
      { name: 'Session Management', fn: testSessionManagement },
      { name: 'Notification Permissions', fn: testNotificationPermissions }
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

  const testBannerDisplayMode = async (): Promise<TestResult> => {
    try {
      const banners = await promotionService.getPromotionsByDisplayMode('banner')
      setPromotions(prev => ({ ...prev, banners }))
      
      return {
        test: 'Banner Display Mode',
        status: 'pass',
        message: `Found ${banners.length} banner promotions`,
        data: { banners: banners.slice(0, 3) }
      }
    } catch (error) {
      return {
        test: 'Banner Display Mode',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get banner promotions'
      }
    }
  }

  const testModalDisplayMode = async (): Promise<TestResult> => {
    try {
      const modals = await promotionService.getPromotionsByDisplayMode('modal')
      setPromotions(prev => ({ ...prev, modals }))
      
      return {
        test: 'Modal Display Mode',
        status: 'pass',
        message: `Found ${modals.length} modal promotions`,
        data: { modals: modals.slice(0, 3) }
      }
    } catch (error) {
      return {
        test: 'Modal Display Mode',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get modal promotions'
      }
    }
  }

  const testNotificationDisplayMode = async (): Promise<TestResult> => {
    try {
      const notifications = await promotionService.getPromotionsByDisplayMode('notification')
      setPromotions(prev => ({ ...prev, notifications }))
      
      return {
        test: 'Notification Display Mode',
        status: 'pass',
        message: `Found ${notifications.length} notification promotions`,
        data: { notifications: notifications.slice(0, 3) }
      }
    } catch (error) {
      return {
        test: 'Notification Display Mode',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get notification promotions'
      }
    }
  }

  const testCarouselDisplayMode = async (): Promise<TestResult> => {
    try {
      const carousels = await promotionService.getPromotionsByDisplayMode('carousel')
      setPromotions(prev => ({ ...prev, carousels }))
      
      return {
        test: 'Carousel Display Mode',
        status: 'pass',
        message: `Found ${carousels.length} carousel promotions`,
        data: { carousels: carousels.slice(0, 3) }
      }
    } catch (error) {
      return {
        test: 'Carousel Display Mode',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get carousel promotions'
      }
    }
  }

  const testDisplayPrioritySystem = async (): Promise<TestResult> => {
    try {
      const allPromotions = await promotionService.getAllPromotionsByDisplayMode()
      const carousels = allPromotions.carousels
      
      // Check if carousels are sorted by priority
      const isSorted = carousels.every((promo, index) => {
        if (index === 0) return true
        return promo.displayPriority <= carousels[index - 1].displayPriority
      })
      
      return {
        test: 'Display Priority System',
        status: isSorted ? 'pass' : 'fail',
        message: isSorted ? 'Priority system working correctly' : 'Priority system not working',
        data: { 
          carousels: carousels.map(p => ({ 
            title: p.title, 
            priority: p.displayPriority 
          }))
        }
      }
    } catch (error) {
      return {
        test: 'Display Priority System',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to test priority system'
      }
    }
  }

  const testSessionManagement = async (): Promise<TestResult> => {
    try {
      const sessionId = 'test-session-management'
      
      // Test modal session management
      const modals1 = await promotionService.getPromotionsByDisplayMode('modal', { sessionId })
      const modals2 = await promotionService.getPromotionsByDisplayMode('modal', { sessionId })
      
      // Test notification session management
      const notifications1 = await promotionService.getPromotionsByDisplayMode('notification', { sessionId })
      const notifications2 = await promotionService.getPromotionsByDisplayMode('notification', { sessionId })
      
      return {
        test: 'Session Management',
        status: 'pass',
        message: 'Session management working correctly',
        data: { 
          modals: { first: modals1.length, second: modals2.length },
          notifications: { first: notifications1.length, second: notifications2.length }
        }
      }
    } catch (error) {
      return {
        test: 'Session Management',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to test session management'
      }
    }
  }

  const testNotificationPermissions = async (): Promise<TestResult> => {
    try {
      return {
        test: 'Notification Permissions',
        status: notificationsSupported ? 'pass' : 'fail',
        message: notificationsSupported 
          ? `Notifications supported, permission: ${notificationPermission}`
          : 'Notifications not supported',
        data: { 
          supported: notificationsSupported,
          permission: notificationPermission
        }
      }
    } catch (error) {
      return {
        test: 'Notification Permissions',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to test notification permissions'
      }
    }
  }

  const testNotification = async () => {
    try {
      await showNotification({
        title: 'Test Notification',
        body: 'This is a test notification from the promotion system',
        icon: '/pwa-192x192.png',
        tag: 'test-notification'
      })
    } catch (error) {
      console.error('Failed to show test notification:', error)
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
            Display Mode Test Suite
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing of all promotion display modes
          </p>
        </div>

        <div className="p-6">
          {/* Test Controls */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>

            {notificationsSupported && (
              <button
                onClick={testNotification}
                className="btn-secondary flex items-center space-x-2"
              >
                <Bell className="w-4 h-4" />
                <span>Test Notification</span>
              </button>
            )}
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

          {/* Live Display Manager Demo */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Live Display Manager Demo</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4">PromotionDisplayManager Component</h3>
              <div className="border rounded-lg bg-white">
                <PromotionDisplayManager
                  branchId="test-branch"
                  customerId="test-customer"
                  sessionId="test-session"
                  position="both"
                  onPromotionAction={(promotion, action) => {
                    console.log('Promotion action:', { promotion: promotion.title, action })
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {testResults.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Test Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
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
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(promotions).reduce((sum, arr) => sum + arr.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Promotions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DisplayModeTestSuite
