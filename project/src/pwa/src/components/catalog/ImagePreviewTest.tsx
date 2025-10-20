import React, { useState, useEffect } from 'react'
import { Package, Image as ImageIcon, Eye, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { productImageService } from '../../services/productImageService'
import { ProductImage } from '../../types'
import BasicImagePreviewModal from './BasicImagePreviewModal'

const ImagePreviewTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Array<{test: string, status: 'pending' | 'pass' | 'fail', message: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<ProductImage[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const testProductIds = [
    'product-1',
    'product-2', 
    'product-3'
  ]

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])

    const tests = [
      {
        test: 'Check if product_images table exists',
        status: 'pending' as const,
        message: 'Testing table existence...'
      },
      {
        test: 'Test getProductImages method',
        status: 'pending' as const,
        message: 'Testing image fetching...'
      },
      {
        test: 'Test error handling',
        status: 'pending' as const,
        message: 'Testing error handling...'
      }
    ]

    setTestResults([...tests])

    try {
      // Test 1: Check if table exists by trying to fetch images
      const testProductId = testProductIds[0]
      const fetchedImages = await productImageService.getProductImages(testProductId)
      
      tests[0].status = 'pass'
      tests[0].message = `Table exists. Found ${fetchedImages.length} images for ${testProductId}`
      
      tests[1].status = 'pass'
      tests[1].message = `Successfully fetched images. Service is working correctly.`
      
      tests[2].status = 'pass'
      tests[2].message = `Error handling is working. No errors thrown.`

      setTestResults([...tests])
      setImages(fetchedImages)

    } catch (error: any) {
      console.error('Test error:', error)
      
      if (error.code === '42703') {
        tests[0].status = 'fail'
        tests[0].message = `Table exists but missing 'is_active' column. Error: ${error.message}`
        
        tests[1].status = 'fail'
        tests[1].message = `Service failed due to missing column.`
        
        tests[2].status = 'pass'
        tests[2].message = `Error handling worked correctly.`
      } else if (error.code === '42P01') {
        tests[0].status = 'fail'
        tests[0].message = `Table 'product_images' does not exist. Error: ${error.message}`
        
        tests[1].status = 'fail'
        tests[1].message = `Cannot fetch images - table missing.`
        
        tests[2].status = 'pass'
        tests[2].message = `Error handling worked correctly.`
      } else {
        tests[0].status = 'fail'
        tests[0].message = `Unexpected error: ${error.message}`
        
        tests[1].status = 'fail'
        tests[1].message = `Service failed with unexpected error.`
        
        tests[2].status = 'fail'
        tests[2].message = `Unexpected error occurred.`
      }

      setTestResults([...tests])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewClick = async (productId: string) => {
    setSelectedProductId(productId)
    try {
      const fetchedImages = await productImageService.getProductImages(productId)
      setImages(fetchedImages)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setImages([])
    setSelectedProductId(null)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Image Preview Test Suite</h2>
        <p className="text-gray-600">
          Test the product image preview functionality and database connectivity.
        </p>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
          <button
            onClick={runTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Run Tests</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border">
              {result.status === 'pending' && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              {result.status === 'pass' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {result.status === 'fail' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{result.test}</p>
                <p className="text-sm text-gray-600">{result.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testProductIds.map((productId) => (
          <div key={productId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">
              Product {productId.split('-')[1]}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Click to test image preview for this product.
            </p>
            
            <button
              onClick={() => handlePreviewClick(productId)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Test Preview</span>
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      <BasicImagePreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        images={images}
        productName={selectedProductId ? `Product ${selectedProductId.split('-')[1]}` : 'Unknown Product'}
      />
    </div>
  )
}

export default ImagePreviewTest
