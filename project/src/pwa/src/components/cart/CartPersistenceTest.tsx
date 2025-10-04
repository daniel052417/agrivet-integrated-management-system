import React, { useState } from 'react'
import { RefreshCw, Database, Smartphone, CheckCircle, XCircle, HardDrive } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useCartSync } from '../../hooks/useCartSync'

const CartPersistenceTest: React.FC = () => {
  const { cart, addItem, clearCart, isLoading, lastSaveTime, getStorageInfo } = useCart()
  const { saveNow, handleAuthChange, getStorageInfo: getSyncStorageInfo } = useCartSync({
    onSaveStart: () => console.log('Save started'),
    onSaveComplete: (result) => console.log('Save completed:', result),
    onSaveError: (error) => console.error('Save error:', error)
  })

  const [testResults, setTestResults] = useState<{
    indexedDB: boolean
    localStorage: boolean
    save: boolean
  }>({
    indexedDB: false,
    localStorage: false,
    save: false
  })

  const [storageInfo, setStorageInfo] = useState<{
    hasIndexedDB: boolean
    hasLocalStorage: boolean
    sessionId: string
  } | null>(null)

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageInfo()
      setStorageInfo(info)
    } catch (error) {
      console.error('Failed to load storage info:', error)
    }
  }

  const testIndexedDB = () => {
    try {
      const hasIndexedDB = 'indexedDB' in window
      setTestResults(prev => ({
        ...prev,
        indexedDB: hasIndexedDB
      }))
      return hasIndexedDB
    } catch (error) {
      console.error('IndexedDB test failed:', error)
      setTestResults(prev => ({
        ...prev,
        indexedDB: false
      }))
      return false
    }
  }

  const testLocalStorage = () => {
    try {
      const hasLocalStorage = 'localStorage' in window
      setTestResults(prev => ({
        ...prev,
        localStorage: hasLocalStorage
      }))
      return hasLocalStorage
    } catch (error) {
      console.error('LocalStorage test failed:', error)
      setTestResults(prev => ({
        ...prev,
        localStorage: false
      }))
      return false
    }
  }

  const testSave = async () => {
    try {
      const result = await saveNow()
      setTestResults(prev => ({
        ...prev,
        save: result?.success || false
      }))
      return result?.success || false
    } catch (error) {
      console.error('Save test failed:', error)
      setTestResults(prev => ({
        ...prev,
        save: false
      }))
      return false
    }
  }

  const runAllTests = async () => {
    console.log('🧪 Running cart persistence tests...')
    
    // Load storage info
    await loadStorageInfo()
    
    // Test IndexedDB
    testIndexedDB()
    
    // Test localStorage
    testLocalStorage()
    
    // Test save
    await testSave()
    
    console.log('✅ Tests completed')
  }

  React.useEffect(() => {
    loadStorageInfo()
  }, [])

  const addTestItem = () => {
    addItem({
      product: {
        id: 'test-product',
        product_id: 'test-product',
        sku: 'TEST-001',
        name: 'Test Product',
        variant_type: 'size',
        variant_value: 'Large',
        price: 100,
        cost: 50,
        is_active: true,
        created_at: new Date().toISOString(),
        stock_quantity: 10,
        minimum_stock: 5,
        maximum_stock: 100,
        pos_pricing_type: 'fixed',
        weight_per_unit: 1,
        bulk_discount_threshold: 10,
        bulk_discount_percentage: 5,
        requires_expiry_date: false,
        requires_batch_tracking: false,
        is_quick_sale: true,
        barcode: '123456789',
        expiry_date: null,
        batch_number: null,
        image_url: null
      },
      quantity: 1,
      unitPrice: 100
    })
  }

  const simulateAuthChange = () => {
    const isGuest = Math.random() > 0.5
    const userId = isGuest ? undefined : `user-${Date.now()}`
    handleAuthChange(userId, isGuest)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <Database className="w-6 h-6 mr-2 text-blue-600" />
        Cart Persistence Test
      </h2>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Run All Tests</span>
        </button>

        <button
          onClick={addTestItem}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Add Test Item</span>
        </button>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            IndexedDB
          </h3>
          <div className="flex items-center space-x-2">
            {testResults.indexedDB ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={testResults.indexedDB ? 'text-green-600' : 'text-red-600'}>
              {testResults.indexedDB ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Smartphone className="w-4 h-4 mr-2" />
            LocalStorage
          </h3>
          <div className="flex items-center space-x-2">
            {testResults.localStorage ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={testResults.localStorage ? 'text-green-600' : 'text-red-600'}>
              {testResults.localStorage ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
            <HardDrive className="w-4 h-4 mr-2" />
            Save
          </h3>
          <div className="flex items-center space-x-2">
            {testResults.save ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={testResults.save ? 'text-green-600' : 'text-red-600'}>
              {testResults.save ? 'Working' : 'Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* Cart Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Cart Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{cart.itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">₱{cart.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Loading:</span>
              <span className={`font-medium ${isLoading ? 'text-blue-600' : 'text-gray-600'}`}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Save:</span>
              <span className="font-medium">
                {lastSaveTime ? lastSaveTime.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            {storageInfo && (
              <div className="flex justify-between">
                <span className="text-gray-600">Storage:</span>
                <span className="font-medium">
                  {storageInfo.hasIndexedDB ? 'IndexedDB' : storageInfo.hasLocalStorage ? 'LocalStorage' : 'None'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Actions</h3>
          <div className="space-y-2">
            <button
              onClick={testIndexedDB}
              className="w-full btn-secondary text-sm"
            >
              Test IndexedDB
            </button>
            <button
              onClick={testLocalStorage}
              className="w-full btn-secondary text-sm"
            >
              Test LocalStorage
            </button>
            <button
              onClick={testSave}
              className="w-full btn-secondary text-sm"
            >
              Test Save
            </button>
            <button
              onClick={simulateAuthChange}
              className="w-full btn-secondary text-sm"
            >
              Simulate Auth Change
            </button>
            <button
              onClick={clearCart}
              className="w-full btn-danger text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      {cart.items.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Cart Items</h3>
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {item.product.variant_value}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">₱{item.lineTotal.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPersistenceTest
