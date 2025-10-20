import React, { useState, useEffect } from 'react'
import { Package, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { productService } from '../../services/productService'
import { ProductWithUnits } from '../../types'
import ProductCard from './ProductCard'

const MultiUnitDemo: React.FC = () => {
  const [products, setProducts] = useState<ProductWithUnits[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useRealData, setUseRealData] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [useRealData])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (useRealData) {
        // Try to load real data (you'll need to replace with actual branch ID)
        const realProducts = await productService.getProductsForCatalog('your-branch-id-here')
        setProducts(realProducts)
      } else {
        // Use mock data for demonstration
        const mockProducts = productService.getMockProductsForTesting()
        setProducts(mockProducts)
      }
    } catch (err) {
      console.error('Error loading products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
      
      // Fallback to mock data on error
      const mockProducts = productService.getMockProductsForTesting()
      setProducts(mockProducts)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-3 text-blue-600" />
            Multi-Unit System Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Demonstration of the multi-unit product system with unit selection and conversion
          </p>
        </div>

        <div className="p-6">
          {/* Data Source Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Data Source</h3>
                <p className="text-sm text-gray-600">
                  {useRealData 
                    ? 'Using real database data (requires valid branch ID)' 
                    : 'Using mock data for demonstration'
                  }
                </p>
              </div>
              <button
                onClick={() => setUseRealData(!useRealData)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  useRealData
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {useRealData ? 'Switch to Mock Data' : 'Try Real Data'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800">Error Loading Real Data</h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  <p className="text-xs text-red-500 mt-2">
                    Falling back to mock data for demonstration
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && products.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Products with Multi-Unit Support
                </h2>
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  {products.length} products loaded
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(product, unit, quantity) => {
                      console.log('Added to cart:', {
                        product: product.name,
                        unit: unit.unit_label,
                        quantity: quantity,
                        total: unit.price_per_unit * quantity
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Products */}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
              <p className="text-gray-600">
                {useRealData 
                  ? 'No products found for the selected branch. Try switching to mock data.'
                  : 'No mock products available.'
                }
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">How to Use</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Unit Selection:</strong> Choose from available units (bottles, cases, kg, grams, etc.)</p>
              <p>• <strong>Quantity Input:</strong> Enter quantity in the selected unit</p>
              <p>• <strong>Price Display:</strong> See price per unit and total cost</p>
              <p>• <strong>Add to Cart:</strong> Items are added with unit information and converted to base units for inventory</p>
              <p>• <strong>Real Data:</strong> To use real data, replace 'your-branch-id-here' with an actual branch UUID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiUnitDemo
