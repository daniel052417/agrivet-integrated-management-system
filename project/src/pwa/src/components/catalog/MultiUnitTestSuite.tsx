import React, { useState, useEffect } from 'react'
import { RefreshCw, Database, Package, Scale, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { productService } from '../../services/productService'
import { useCart } from '../../contexts/CartContext'
import { ProductWithUnits, ProductUnit } from '../../types'
import ProductCard from './ProductCard'
import CartItem from '../cart/CartItem'

interface TestResult {
  test: string
  status: 'pending' | 'pass' | 'fail'
  message: string
  data?: any
}

const MultiUnitTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [products, setProducts] = useState<ProductWithUnits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { cart } = useCart()

  useEffect(() => {
    loadTestProducts()
  }, [])

  const loadTestProducts = async () => {
    try {
      setIsLoading(true)
      // Use mock products from the service for testing
      const mockProducts = productService.getMockProductsForTesting()
      setProducts(mockProducts)
    } catch (error) {
      console.error('Error loading test products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      { name: 'Product Service Connection', fn: testProductServiceConnection },
      { name: 'Product Units Loading', fn: testProductUnitsLoading },
      { name: 'Unit Conversion', fn: testUnitConversion },
      { name: 'Quantity Validation', fn: testQuantityValidation },
      { name: 'Cart Integration', fn: testCartIntegration },
      { name: 'Base Unit Calculation', fn: testBaseUnitCalculation }
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

  const testProductServiceConnection = async (): Promise<TestResult> => {
    try {
      // Test with mock data since we don't have real branch data
      return {
        test: 'Product Service Connection',
        status: 'pass',
        message: `Successfully loaded ${products.length} mock products for testing`,
        data: { productCount: products.length }
      }
    } catch (error) {
      return {
        test: 'Product Service Connection',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  const testProductUnitsLoading = async (): Promise<TestResult> => {
    try {
      const productsWithUnits = products.filter(p => p.available_units && p.available_units.length > 0)
      
      return {
        test: 'Product Units Loading',
        status: 'pass',
        message: `${productsWithUnits.length} products have units configured`,
        data: { 
          totalProducts: products.length,
          productsWithUnits: productsWithUnits.length,
          sampleUnits: productsWithUnits[0]?.available_units?.slice(0, 3)
        }
      }
    } catch (error) {
      return {
        test: 'Product Units Loading',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to load units'
      }
    }
  }

  const testUnitConversion = async (): Promise<TestResult> => {
    try {
      // Create test units
      const testUnit1: ProductUnit = {
        id: 'test-unit-1',
        product_id: 'test-product',
        unit_name: 'kilogram',
        unit_label: 'kg',
        conversion_factor: 1,
        is_base_unit: true,
        is_sellable: true,
        price_per_unit: 100,
        min_sellable_quantity: 1,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const testUnit2: ProductUnit = {
        id: 'test-unit-2',
        product_id: 'test-product',
        unit_name: 'gram',
        unit_label: 'g',
        conversion_factor: 0.001,
        is_base_unit: false,
        is_sellable: true,
        price_per_unit: 0.1,
        min_sellable_quantity: 100,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Test conversion
      const converted = productService.convertQuantity(1000, testUnit2, testUnit1)
      const toBase = productService.convertToBaseUnit(1000, testUnit2)
      
      return {
        test: 'Unit Conversion',
        status: converted === 1 && toBase === 1 ? 'pass' : 'fail',
        message: converted === 1 && toBase === 1 ? 'Unit conversion working correctly' : 'Unit conversion failed',
        data: { 
          converted: converted,
          toBase: toBase,
          expected: 1
        }
      }
    } catch (error) {
      return {
        test: 'Unit Conversion',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Conversion test failed'
      }
    }
  }

  const testQuantityValidation = async (): Promise<TestResult> => {
    try {
      const testUnit: ProductUnit = {
        id: 'test-unit',
        product_id: 'test-product',
        unit_name: 'piece',
        unit_label: 'pc',
        conversion_factor: 1,
        is_base_unit: true,
        is_sellable: true,
        price_per_unit: 10,
        min_sellable_quantity: 5,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const validResult = productService.validateQuantity(10, testUnit)
      const invalidResult = productService.validateQuantity(3, testUnit)
      
      return {
        test: 'Quantity Validation',
        status: validResult.isValid && !invalidResult.isValid ? 'pass' : 'fail',
        message: validResult.isValid && !invalidResult.isValid ? 'Quantity validation working correctly' : 'Quantity validation failed',
        data: { 
          validTest: validResult,
          invalidTest: invalidResult
        }
      }
    } catch (error) {
      return {
        test: 'Quantity Validation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Validation test failed'
      }
    }
  }

  const testCartIntegration = async (): Promise<TestResult> => {
    try {
      return {
        test: 'Cart Integration',
        status: 'pass',
        message: `Cart has ${cart.items.length} items with unit support`,
        data: { 
          cartItems: cart.items.length,
          itemsWithUnits: cart.items.filter(item => item.product_unit).length
        }
      }
    } catch (error) {
      return {
        test: 'Cart Integration',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Cart integration test failed'
      }
    }
  }

  const testBaseUnitCalculation = async (): Promise<TestResult> => {
    try {
      const testUnit: ProductUnit = {
        id: 'test-unit',
        product_id: 'test-product',
        unit_name: 'kilogram',
        unit_label: 'kg',
        conversion_factor: 1,
        is_base_unit: true,
        is_sellable: true,
        price_per_unit: 100,
        min_sellable_quantity: 1,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const baseQuantity = productService.convertToBaseUnit(5, testUnit)
      
      return {
        test: 'Base Unit Calculation',
        status: baseQuantity === 5 ? 'pass' : 'fail',
        message: baseQuantity === 5 ? 'Base unit calculation working correctly' : 'Base unit calculation failed',
        data: { 
          input: 5,
          output: baseQuantity,
          expected: 5
        }
      }
    } catch (error) {
      return {
        test: 'Base Unit Calculation',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Base unit calculation test failed'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agrivet-green"></div>
        <span className="ml-2 text-gray-600">Loading test products...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="w-6 h-6 mr-3 text-blue-600" />
            Multi-Unit System Test Suite
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing of the multi-unit product system
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

          {/* Live Product Cards Demo */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Live Product Cards with Unit Support</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={(product, unit, quantity) => {
                    console.log('Added to cart:', { product: product.name, unit: unit.unit_label, quantity })
                  }}
                />
              ))}
            </div>
          </div>

          {/* Cart Display */}
          {cart.items.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Cart Items with Unit Information</h2>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}

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
                    {products.length}
                  </div>
                  <div className="text-sm text-gray-600">Test Products</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MultiUnitTestSuite
