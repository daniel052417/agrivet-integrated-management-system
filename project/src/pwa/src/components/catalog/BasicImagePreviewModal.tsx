import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { ProductImage } from '../../types'

interface BasicImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  images: ProductImage[]
  productName?: string
  initialImageIndex?: number
}

const BasicImagePreviewModal: React.FC<BasicImagePreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  productName = 'Product',
  initialImageIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex)

  useEffect(() => {
    setCurrentIndex(initialImageIndex)
  }, [initialImageIndex, images])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowLeft') {
      handlePrevious()
    } else if (event.key === 'ArrowRight') {
      handleNext()
    }
  }, [onClose, images.length, currentIndex])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
  }, [images.length])

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }, [images.length])

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close image preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Display */}
        <div className="relative flex-1 flex items-center justify-center bg-gray-900">
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            key={currentImage.id}
            src={currentImage.image_url}
            alt={currentImage.alt_text || currentImage.image_name}
            className="max-w-full max-h-[70vh] object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />

          {!currentImage.image_url && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <ImageIcon className="w-16 h-16 mb-2" />
              <span>No Image Available</span>
            </div>
          )}
        </div>

        {/* Image Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-700 font-medium mb-2">
            {currentImage.image_name} ({currentIndex + 1} of {images.length})
          </p>
          {currentImage.alt_text && (
            <p className="text-xs text-gray-500 mb-3">{currentImage.alt_text}</p>
          )}

          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.image_name}
                  className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${
                    index === currentIndex ? 'border-blue-500' : 'border-transparent'
                  } hover:border-blue-500/50 transition-colors`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BasicImagePreviewModal
