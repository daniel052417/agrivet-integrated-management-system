import React, { useState, useEffect } from 'react'
import { Package, Image as ImageIcon, Eye } from 'lucide-react'
import { productImageService } from '../../services/productImageService'
import { ProductImage } from '../../types'
import BasicImagePreviewModal from './BasicImagePreviewModal'

const ImagePreviewDemo: React.FC = () => {
  const [images, setImages] = useState<ProductImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  // Mock product IDs for testing
  const testProductIds = [
    'product-1',
    'product-2',
    'product-3'
  ]

  const handlePreviewClick = async (productId: string) => {
    setIsLoading(true)
    setError(null)
    setSelectedProductId(productId)

    try {
      const fetchedImages = await productImageService.getProductImages(productId)
      setImages(fetchedImages)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Error fetching images:', err)
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setImages([])
    setSelectedProductId(null)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Image Preview Demo</h2>
        <p className="text-gray-600">
          Test the product image preview functionality. Click on any product to see its images.
        </p>
      </div>

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
              Click to preview all available images for this product.
            </p>
            
            <button
              onClick={() => handlePreviewClick(productId)}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {isLoading && selectedProductId === productId ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Preview Images</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <BasicImagePreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        images={images}
        productName={selectedProductId ? `Product ${selectedProductId.split('-')[1]}` : 'Unknown Product'}
      />
    </div>
  )
}

export default ImagePreviewDemo
