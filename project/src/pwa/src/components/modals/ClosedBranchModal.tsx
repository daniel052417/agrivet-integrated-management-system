import React, { useEffect, useState } from 'react'
import { X, Clock, MapPin, ShoppingBag, Lock } from 'lucide-react'
import Lottie from 'lottie-react'
import lockedAnimation from '../../assets/Locked Icon.json'

interface ClosedBranchModalProps {
  isOpen: boolean
  onClose: () => void
  branchName: string
  nextOpeningTime: string
  onSetReminder: () => void
  onFindAnotherBranch: () => void
  onBrowseAnyway: () => void
}

const ClosedBranchModal: React.FC<ClosedBranchModalProps> = ({
  isOpen,
  onClose,
  branchName,
  nextOpeningTime,
  onSetReminder,
  onFindAnotherBranch,
  onBrowseAnyway
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [animationLoaded, setAnimationLoaded] = useState(false)
  const [animationError, setAnimationError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Reset animation states when modal opens
      setAnimationLoaded(false)
      setAnimationError(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fallback timeout to show content even if animation fails
  useEffect(() => {
    if (isOpen && !animationLoaded && !animationError) {
      const timeout = setTimeout(() => {
        console.warn('Lottie animation taking too long to load, showing content anyway')
        setAnimationLoaded(true)
      }, 2000) // Show content after 2 seconds regardless

      return () => clearTimeout(timeout)
    }
  }, [isOpen, animationLoaded, animationError])

  // Alternative: Show content immediately for better UX
  useEffect(() => {
    if (isOpen) {
      // Show content after a short delay to allow animation to load
      const timeout = setTimeout(() => {
        setAnimationLoaded(true)
      }, 500) // Show content after 500ms

      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal - Mobile Optimized */}
      <div 
        className={`relative w-[calc(100vw-16px)] sm:w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden transform transition-all duration-300 ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className={`bg-white rounded-lg sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000 w-full ${
          animationLoaded ? 'shadow-green-200' : ''
        }`}>
          {/* Close Button - Compact on Mobile */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200 touch-manipulation"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* Content - Responsive Padding */}
          <div className="p-4 sm:p-8 text-center w-full box-border overflow-x-hidden">
            {/* Lottie Animation - Smaller on Mobile */}
            <div className="mb-3 sm:mb-6">
              <div className={`transition-opacity duration-500 ${animationLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {!animationError ? (
                  <Lottie
                    animationData={lockedAnimation}
                    loop={true}
                    autoplay={true}
                    onComplete={() => setAnimationLoaded(true)}
                    onLoadedData={() => setAnimationLoaded(true)}
                    onError={() => {
                      console.error('Lottie animation failed to load')
                      setAnimationError(true)
                      setAnimationLoaded(true) // Show content even if animation fails
                    }}
                    style={{ 
                      width: isMobile ? 120 : 200, // Smaller on mobile
                      height: isMobile ? 120 : 200, 
                      margin: '0 auto',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                    rendererSettings={{
                      preserveAspectRatio: 'xMidYMid meet'
                    }}
                  />
                ) : (
                  // Fallback icon if animation fails - Smaller on Mobile
                  <div className="w-24 h-24 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <Lock className="w-6 h-6 sm:w-10 sm:h-10 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
              {!animationLoaded && !animationError && (
                <div className="w-24 h-24 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 border-[3px] sm:border-4 border-agrivet-green border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Heading - Responsive Text */}
            <h2 className={`text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 transition-all duration-700 delay-300 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Branch is closed!
            </h2>

            {/* Subtext - Responsive Text */}
            <p className={`text-xs sm:text-lg text-gray-600 mb-4 sm:mb-8 leading-relaxed transition-all duration-700 delay-500 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              This branch is currently unavailable. Please try again at{' '}
              <span className="font-semibold text-agrivet-green block sm:inline mt-1 sm:mt-0">
                {nextOpeningTime}
              </span>
            </p>

            {/* Branch Name - Compact */}
            <div className={`flex items-center justify-center mb-4 sm:mb-8 text-gray-500 transition-all duration-700 delay-700 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[250px]">{branchName}</span>
            </div>

            {/* Buttons - Compact on Mobile with Better Touch Targets */}
            <div className={`space-y-2.5 sm:space-y-3 transition-all duration-700 delay-900 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Set Reminder Button */}
              <button
                onClick={onSetReminder}
                className="w-full flex items-center justify-center px-4 py-3 sm:px-6 sm:py-3.5 border-2 border-agrivet-green text-agrivet-green rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-agrivet-green hover:text-white active:bg-green-50 active:scale-[0.98] transition-all duration-200 group touch-manipulation min-h-[44px]"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse flex-shrink-0" />
                <span>Set Reminder</span>
              </button>

              {/* Find Another Open Branch Button */}
              <button
                onClick={onFindAnotherBranch}
                className="w-full flex items-center justify-center px-4 py-3 sm:px-6 sm:py-3.5 bg-agrivet-green text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-green-600 active:bg-green-700 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation min-h-[44px] overflow-hidden"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate min-w-0">Find Another Open Branch</span>
              </button>

              {/* Browse Anyway Button */}
              {/* <button
                onClick={onBrowseAnyway}
                className="w-full flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-gray-200 transition-all duration-200"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span>Browse Anyway</span>
              </button> */}
            </div>

            {/* Additional Info - Compact Text */}
            <div className={`mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 transition-all duration-700 delay-1100 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-[11px] sm:text-sm text-gray-500 leading-relaxed px-1">
                You can still browse our products and place an order for pickup when this branch is available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClosedBranchModal