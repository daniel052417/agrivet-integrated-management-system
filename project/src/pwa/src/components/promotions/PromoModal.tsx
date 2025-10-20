import React, { useEffect, useState } from 'react'
import { X, Clock, CheckCircle } from 'lucide-react'
import { PromoModalProps } from '../../types'
import PromoCarousel from './PromoCarousel'

const PromoModal: React.FC<PromoModalProps> = ({ 
  promotions, 
  isOpen, 
  onClose, 
  onAction,
  currentIndex = 0,
  onIndexChange
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex)

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

  const handleIndexChange = (index: number) => {
    setActiveIndex(index)
    if (onIndexChange) {
      onIndexChange(index)
    }
  }

  const handleAction = (promotion: any) => {
    if (onAction) {
      onAction(promotion)
    }
  }

  if (!isOpen || promotions.length === 0) return null

  const currentPromotion = promotions[activeIndex]

  const getConditions = (promotion: any) => {
    const conditions = []
    if (promotion.conditions?.minOrderAmount) {
      conditions.push(`Min order: ₱${promotion.conditions.minOrderAmount}`)
    }
    if (promotion.conditions?.maxUses) {
      conditions.push(`Limited to ${promotion.conditions.maxUses} uses`)
    }
    return conditions
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white/90"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Modal Header */}
          <div className="p-6 pb-0">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Special Offers
              </h2>
              <p className="text-gray-600">
                Don't miss out on these limited-time deals!
              </p>
            </div>
          </div>

          {/* Carousel */}
          <div className="p-6">
            <PromoCarousel
              promotions={promotions}
              currentIndex={activeIndex}
              onIndexChange={handleIndexChange}
              onAction={handleAction}
              autoplayInterval={4000}
              showControls={true}
              showDots={true}
              showPlayPause={true}
            />
          </div>

          {/* Terms and Conditions */}
          {currentPromotion && getConditions(currentPromotion).length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 text-center">Terms & Conditions</h4>
                <ul className="space-y-2">
                  {getConditions(currentPromotion).map((condition, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 pb-6">
            <div className="text-center">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">
                Offers are valid for a limited time only. Terms and conditions apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoModal
