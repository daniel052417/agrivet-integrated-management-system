import React, { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { ProductImage } from '../../types'
import { productImageService } from '../../services/productImageService'
import BasicImagePreviewModal from './BasicImagePreviewModal'

interface PreviewButtonProps {
  productId: string
  productName: string
  mainImageUrl?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
}

const PreviewButton: React.FC<PreviewButtonProps> = ({
  productId,
  productName,
  mainImageUrl,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<ProductImage[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600'
  }

  const handlePreviewClick = async () => {
    if (images.length > 0) {
      // If we already have images, just open the modal
      setIsModalOpen(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const fetchedImages = await productImageService.getProductImages(productId)
      
      if (fetchedImages.length === 0 && mainImageUrl) {
        // If no images in database but we have a main image URL, create a mock image
        const mockImage: ProductImage = {
          id: `mock-${productId}`,
          product_id: productId,
          image_url: mainImageUrl,
          image_name: `${productName} - Main Image`,
          image_type: 'main',
          alt_text: `${productName} - Main Image`,
          sort_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setImages([mockImage])
      } else {
        setImages(fetchedImages)
      }
      
      setIsModalOpen(true)
    } catch (err) {
      console.error('Error fetching product images:', err)
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <button
        onClick={handlePreviewClick}
        disabled={isLoading}
        className={`
          inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Loading...' : 'Preview'}</span>
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <BasicImagePreviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        images={images}
        productName={productName}
      />
    </>
  )
}

export default PreviewButton
