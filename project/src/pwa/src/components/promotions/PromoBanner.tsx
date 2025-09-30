import React from 'react'
import { X, ArrowRight, Percent, Tag, Gift, Truck } from 'lucide-react'
import { PromoBannerProps } from '../../types'

const PromoBanner: React.FC<PromoBannerProps> = ({ 
  promotion, 
  onDismiss, 
  onAction 
}) => {
  const getDiscountIcon = () => {
    switch (promotion.discountType) {
      case 'percentage':
        return <Percent className="w-4 h-4" />
      case 'fixed':
        return <Tag className="w-4 h-4" />
      case 'bogo':
        return <Gift className="w-4 h-4" />
      case 'free_shipping':
        return <Truck className="w-4 h-4" />
      default:
        return <Tag className="w-4 h-4" />
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
        return 'bg-red-500'
      case 'fixed':
        return 'bg-blue-500'
      case 'bogo':
        return 'bg-purple-500'
      case 'free_shipping':
        return 'bg-green-500'
      default:
        return 'bg-orange-500'
    }
  }

  const isExpiringSoon = () => {
    const validUntil = new Date(promotion.validUntil)
    const now = new Date()
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3 && daysLeft > 0
  }

  return (
    <div className={`relative overflow-hidden ${getDiscountColor()} text-white`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Discount info */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1">
              {getDiscountIcon()}
              <span className="font-bold text-sm">
                {getDiscountText()}
              </span>
            </div>
            
            <div className="hidden sm:block">
              <h3 className="font-semibold text-sm">
                {promotion.title}
              </h3>
              <p className="text-xs opacity-90">
                {promotion.description}
              </p>
            </div>
          </div>

          {/* Right side - Action and close */}
          <div className="flex items-center space-x-3">
            {/* Mobile description */}
            <div className="sm:hidden text-xs">
              <p className="font-medium">{promotion.title}</p>
            </div>

            {/* Action button */}
            {onAction && (
              <button
                onClick={onAction}
                className="bg-white/20 hover:bg-white/30 rounded-full px-4 py-1 text-xs font-medium transition-colors flex items-center space-x-1"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {/* Close button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expiring soon indicator */}
        {isExpiringSoon() && (
          <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-bl-lg font-medium">
            Expires Soon!
          </div>
        )}
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
    </div>
  )
}

export default PromoBanner
