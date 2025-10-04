import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { ProductImage } from '../../types'

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  images: ProductImage[]
  initialIndex?: number
  productName?: string
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  productName = 'Product'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [rotation, setRotation] = useState(0)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsZoomed(false)
      setRotation(0)
    }
  }, [isOpen, initialIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'z':
        case 'Z':
          e.preventDefault()
          toggleZoom()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          rotateImage()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, images.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  const toggleZoom = useCallback(() => {
    setIsZoomed(prev => !prev)
  }, [])

  const rotateImage = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </motion.button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.button>
          </>
        )}

        {/* Control Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2"
        >
          <button
            onClick={toggleZoom}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Toggle Zoom (Z)"
          >
            {isZoomed ? <ZoomOut className="w-5 h-5 text-white" /> : <ZoomIn className="w-5 h-5 text-white" />}
          </button>
          
          <button
            onClick={rotateImage}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Rotate (R)"
          >
            <RotateCw className="w-5 h-5 text-white" />
          </button>
        </motion.div>

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: isZoomed ? 1.5 : 1,
              rotate: rotation
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative max-w-full max-h-full"
          >
            <img
              src={currentImage.image_url}
              alt={currentImage.alt_text || `${productName} - Image ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={toggleZoom}
              draggable={false}
            />
          </motion.div>
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm"
          >
            <span className="text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </motion.div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex space-x-2 max-w-full overflow-x-auto px-4"
          >
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-white scale-110' 
                    : 'border-white/30 hover:border-white/60'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {index === currentIndex && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/20"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Keyboard Shortcuts Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 hidden md:block"
        >
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="text-white text-xs">
              Press <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">←</kbd> <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">→</kbd> to navigate, <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">Z</kbd> to zoom, <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">R</kbd> to rotate, <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">ESC</kbd> to close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ImagePreviewModal
