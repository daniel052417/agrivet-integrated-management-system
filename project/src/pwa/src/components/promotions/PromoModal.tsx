import React, { useEffect } from 'react'
import { X, ArrowRight, Percent, Tag, Gift, Truck, Clock, CheckCircle } from 'lucide-react'
import { PromoModalProps } from '../../types'

const PromoModal: React.FC<PromoModalProps> = ({ 
  promotion, 
  isOpen, 
  onClose, 
  onAction 
}) => {
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

  if (!isOpen) return null

  const getDiscountIcon = () => {
    switch (promotion.discountType) {
      case 'percentage':
        return <Percent className="w-8 h-8" />
      case 'fixed':
        return <Tag className="w-8 h-8" />
      case 'bogo':
        return <Gift className="w-8 h-8" />
      case 'free_shipping':
        return <Truck className="w-8 h-8" />
      default:
        return <Tag className="w-8 h-8" />
    }
  }

  const getDiscountText = () => {
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

  const getDiscountColor = () => {
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

  const getValidUntilText = () => {
    const validUntil = new Date(promotion.validUntil)
    const now = new Date()
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft <= 0) return 'Expired'
    if (daysLeft === 1) return 'Expires today'
    if (daysLeft <= 7) return `Expires in ${daysLeft} days`
    return `Valid until ${validUntil.toLocaleDateString()}`
  }

  const getConditions = () => {
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
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header with gradient */}
          <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-r ${getDiscountColor()} text-white p-6`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
            </div>
            
            <div className="relative text-center">
              {/* Discount icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {getDiscountIcon()}
              </div>
              
              {/* Discount text */}
              <h2 className="text-3xl font-bold mb-2">
                {getDiscountText()}
              </h2>
              
              {/* Title */}
              <h3 className="text-xl font-semibold mb-2">
                {promotion.title}
              </h3>
              
              {/* Description */}
              <p className="text-white/90 text-sm">
                {promotion.description}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Validity period */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
              <Clock className="w-4 h-4" />
              <span>{getValidUntilText()}</span>
            </div>

            {/* Conditions */}
            {getConditions().length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions:</h4>
                <ul className="space-y-1">
                  {getConditions().map((condition, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {onAction && (
                <button
                  onClick={onAction}
                  className="w-full bg-agrivet-green text-white py-3 px-6 rounded-xl font-semibold hover:bg-agrivet-green/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full text-gray-600 py-2 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Additional info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                This offer is valid for a limited time only. 
                Terms and conditions apply.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromoModal
