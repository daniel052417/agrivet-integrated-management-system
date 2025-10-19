import React from 'react'
import { X, ArrowRight } from 'lucide-react'
import { PromoBannerProps } from '../../types'

const PromoBanner: React.FC<PromoBannerProps> = ({ 
  promotion, 
  onDismiss, 
  onAction 
}) => {
  const getBannerColor = () => 'bg-emerald-600'

  const isExpiringSoon = () => {
    const validUntil = new Date(promotion.validUntil)
    const now = new Date()
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 3 && daysLeft > 0
  }

  return (
    <div className={`relative overflow-hidden ${getBannerColor()} text-white`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Announcement info */}
          <div className="flex items-center space-x-3">
            {/* Carousel of images if multiple */}
            {Array.isArray(promotion.imageUrls) && promotion.imageUrls.length > 0 && (
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {promotion.imageUrls.slice(0, 5).map((url, idx) => (
                  <img key={idx} src={url} alt={`promo-${idx}`} className="h-8 w-14 object-cover rounded-md border border-white/30" />
                ))}
              </div>
            )}

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
                <span>{promotion.buttonText || 'Start Shopping'}</span>
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
