import React, { useEffect, useState } from 'react'
import { X, ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { PromoModalProps } from '../../types'

const PromoModal: React.FC<PromoModalProps> = ({ 
  promotions, 
  isOpen, 
  onClose, 
  onAction,
  currentIndex = 0,
  onIndexChange
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Determine if we should show carousel (multiple promotions)
  const shouldShowCarousel = promotions.length > 1
  const autoplayInterval = 5000 // 5 seconds per slide

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Update active index when currentIndex prop changes
  useEffect(() => {
    setActiveIndex(currentIndex)
  }, [currentIndex])

  // Autoplay functionality for multiple promotions
  useEffect(() => {
    if (!isOpen || !shouldShowCarousel || !isPlaying || isHovered) {
      return
    }

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % promotions.length
        if (onIndexChange) {
          onIndexChange(nextIndex)
        }
        return nextIndex
      })
    }, autoplayInterval)

    return () => clearInterval(interval)
  }, [isOpen, shouldShowCarousel, isPlaying, isHovered, promotions.length, onIndexChange, autoplayInterval])

  const handleIndexChange = (index: number) => {
    setActiveIndex(index)
    if (onIndexChange) {
      onIndexChange(index)
    }
  }

  const handlePrevious = () => {
    const newIndex = activeIndex === 0 ? promotions.length - 1 : activeIndex - 1
    handleIndexChange(newIndex)
  }

  const handleNext = () => {
    const newIndex = (activeIndex + 1) % promotions.length
    handleIndexChange(newIndex)
  }

  const handleDotClick = (index: number) => {
    handleIndexChange(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleAction = (promotion: any) => {
    if (onAction) {
      onAction(promotion)
    }
  }

  if (!isOpen || promotions.length === 0) return null

  const currentPromotion = promotions[activeIndex]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto transform transition-all overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white/90 shadow-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Play/Pause button (only show if multiple promotions) */}
          {shouldShowCarousel && (
            <button
              onClick={togglePlayPause}
              className="absolute top-4 left-4 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white/90 shadow-lg"
              title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause className="w-5 h-5 text-gray-700" /> : <Play className="w-5 h-5 text-gray-700" />}
            </button>
          )}

          {/* Carousel indicator (only show if multiple promotions) */}
          {shouldShowCarousel && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 px-3 py-1 rounded-full shadow-lg">
              <span className="text-sm font-medium text-gray-700">
                {activeIndex + 1} / {promotions.length}
              </span>
            </div>
          )}

          {/* Main content wrapper with transition */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {promotions.map((promotion, index) => (
                <div key={promotion.id} className="w-full flex-shrink-0">
                  {/* Split layout: Left image(s), Right text */}
                  <div className="flex flex-col md:flex-row">
                    {/* Left: image */}
                    <div className="md:w-1/2 w-full bg-gradient-to-br from-emerald-50 to-teal-50">
                      {promotion.imageUrl || promotion.imageUrls?.[0] ? (
                        <img 
                          src={promotion.imageUrl || promotion.imageUrls?.[0]} 
                          alt={promotion.title} 
                          className="w-full h-full object-cover max-h-[400px] md:max-h-[500px]" 
                        />
                      ) : (
                        <div className="w-full h-[400px] md:h-[500px] flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <div className="text-6xl mb-4">🎉</div>
                            <p className="text-lg font-medium">Special Promotion</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: text & CTA */}
                    <div className="md:w-1/2 w-full p-8 flex flex-col justify-center">
                      {/* Promotion badge */}
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 self-start">
                        <span>✨</span>
                        <span>Special Offer</span>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                        {promotion.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {promotion.description}
                      </p>

                      {/* Validity period */}
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Valid until {new Date(promotion.validUntil).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleAction(promotion)}
                        className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-base font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <span>{promotion.buttonText || 'Start Shopping'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows (only show if multiple promotions) */}
          {shouldShowCarousel && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10"
                aria-label="Previous promotion"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 z-10"
                aria-label="Next promotion"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Footer with dots indicator */}
          <div className="px-6 pb-6">
            {/* Dots indicator (only show if multiple promotions) */}
            {shouldShowCarousel && (
              <div className="flex justify-center space-x-2 mb-4">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`transition-all duration-200 rounded-full ${
                      index === activeIndex
                        ? 'w-8 h-3 bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to promotion ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Progress bar (only show if playing and multiple promotions) */}
            {shouldShowCarousel && isPlaying && !isHovered && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1 rounded-full"
                    style={{
                      animation: `progress ${autoplayInterval}ms linear infinite`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Maybe Later button */}
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default PromoModal