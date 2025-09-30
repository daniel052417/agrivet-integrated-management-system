import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { promotionService } from '../../services/promotionService'
import { Promotion } from '../../types'
import PromoCarousel from './PromoCarousel'

const CarouselDemo: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPromotions()
  }, [])

  const loadPromotions = async () => {
    try {
      setIsLoading(true)
      const modalPromotions = await promotionService.getModalPromotions()
      setPromotions(modalPromotions)
    } catch (error) {
      console.error('Error loading promotions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (promotion: Promotion) => {
    console.log('Action clicked for promotion:', promotion.title)
    alert(`Clicked on: ${promotion.title}`)
  }

  const resetDemo = () => {
    setCurrentIndex(0)
    loadPromotions()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <p className="text-gray-600">Loading carousel demo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Promotional Carousel Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Interactive carousel with autoplay, navigation controls, and multiple promotions
          </p>
          <button
            onClick={resetDemo}
            className="btn-outline flex items-center space-x-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* Carousel Container */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <PromoCarousel
            promotions={promotions}
            currentIndex={currentIndex}
            onIndexChange={setCurrentIndex}
            onAction={handleAction}
            autoplayInterval={3000}
            showControls={true}
            showDots={true}
            showPlayPause={true}
          />
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Carousel Controls
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Current Promotion Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Promotion</h4>
              {promotions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Title:</strong> {promotions[currentIndex]?.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Type:</strong> {promotions[currentIndex]?.discountType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Value:</strong> {promotions[currentIndex]?.discountValue}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Index:</strong> {currentIndex + 1} of {promotions.length}
                  </p>
                </div>
              )}
            </div>

            {/* Manual Navigation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Manual Navigation</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentIndex(Math.min(promotions.length - 1, currentIndex + 1))}
                  disabled={currentIndex === promotions.length - 1}
                  className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* All Promotions List */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">All Available Promotions</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {promotions.map((promotion, index) => (
                <button
                  key={promotion.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    index === currentIndex
                      ? 'border-agrivet-green bg-green-50 text-agrivet-green'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{promotion.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {promotion.description}
                      </p>
                    </div>
                    <div className="ml-2 text-xs text-gray-400">
                      {index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Carousel Features
          </h3>
          <div className="grid gap-2 md:grid-cols-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Autoplay with 3-second intervals</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Manual navigation with arrow buttons</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Dot indicators for direct navigation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Play/Pause controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Pause on hover</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Progress bar animation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Responsive design</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span>Smooth transitions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarouselDemo


