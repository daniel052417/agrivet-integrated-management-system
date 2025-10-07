import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { Promotion } from '../../types'

interface PromoCarouselProps {
  promotions: Promotion[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onAction: (promotion: Promotion) => void
  autoplayInterval?: number
  showControls?: boolean
  showDots?: boolean
  showPlayPause?: boolean
}

const PromoCarousel: React.FC<PromoCarouselProps> = ({
  promotions,
  currentIndex,
  onIndexChange,
  onAction,
  autoplayInterval = 5000,
  showControls = true,
  showDots = true,
  showPlayPause = true
}) => {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isHovered && promotions.length > 1) {
      intervalRef.current = setInterval(() => {
        onIndexChange((currentIndex + 1) % promotions.length)
      }, autoplayInterval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, isHovered, currentIndex, promotions.length, onIndexChange, autoplayInterval])

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? promotions.length - 1 : currentIndex - 1
    onIndexChange(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % promotions.length
    onIndexChange(newIndex)
  }

  const handleDotClick = (index: number) => {
    onIndexChange(index)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const getDiscountIcon = (promotion: Promotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return '📊'
      case 'fixed':
        return '🏷️'
      case 'bogo':
        return '🎁'
      case 'free_shipping':
        return '🚚'
      default:
        return '✨'
    }
  }

  const getDiscountText = (promotion: Promotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% OFF`
      case 'fixed':
        return `₱${promotion.discountValue} OFF`
      case 'bogo':
        return 'BUY 1 GET 1'
      case 'free_shipping':
        return 'FREE SHIPPING'
      default:
        return 'SPECIAL OFFER'
    }
  }

  const getDiscountColor = (promotion: Promotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return 'from-red-500 to-red-600'
      case 'fixed':
        return 'from-blue-500 to-blue-600'
      case 'bogo':
        return 'from-purple-500 to-purple-600'
      case 'free_shipping':
        return 'from-green-500 to-green-600'
      default:
        return 'from-orange-500 to-orange-600'
    }
  }

  const getValidUntilText = (promotion: Promotion) => {
    const validUntil = new Date(promotion.validUntil)
    const now = new Date()
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 0) return 'Expired'
    if (daysLeft === 1) return 'Expires today'
    if (daysLeft <= 7) return `Expires in ${daysLeft} days`
    return `Valid until ${validUntil.toLocaleDateString()}`
  }

  if (promotions.length === 0) return null

  const currentPromotion = promotions[currentIndex]

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Content */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 min-h-[400px]">
        {/* Slide Content */}
        <div className="relative h-full">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%` }}
          >
            {promotions.map((promotion, index) => (
              <div
                key={promotion.id}
                className="w-full flex-shrink-0 flex items-center justify-center p-8"
              >
                <div className="text-center max-w-md">
                  {/* Discount Icon */}
                  <div className="text-6xl mb-4">
                    {getDiscountIcon(promotion)}
                  </div>
                  
                  {/* Discount Badge */}
                  <div className={`inline-block bg-gradient-to-r ${getDiscountColor(promotion)} text-white px-6 py-3 rounded-full text-2xl font-bold mb-4 shadow-lg`}>
                    {getDiscountText(promotion)}
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {promotion.title}
                  </h2>
                  
                  {/* Description */}
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {promotion.description}
                  </p>
                  
                  {/* Validity */}
                  <div className="text-sm text-gray-500 mb-6">
                    {getValidUntilText(promotion)}
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => onAction(promotion)}
                    className="bg-agrivet-green text-white px-8 py-3 rounded-xl font-semibold hover:bg-agrivet-green/90 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        {showControls && promotions.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Play/Pause Button */}
        {showPlayPause && promotions.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-2 shadow-lg transition-all duration-200"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Dots Indicator */}
      {showDots && promotions.length > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-agrivet-green scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && promotions.length > 1 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-agrivet-green h-1 rounded-full transition-all duration-100 ease-linear"
              style={{
                width: '100%',
                animation: `progress ${autoplayInterval}ms linear infinite`
              }}
            />
          </div>
        </div>
      )}

      {/* Slide Counter */}
      {promotions.length > 1 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          {currentIndex + 1} of {promotions.length}
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default PromoCarousel













