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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal - Mobile Optimized */}
      <div 
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-1000 ${
          animationLoaded ? 'shadow-green-200' : ''
        }`}>
          {/* Close Button - Compact on Mobile */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* Content - Responsive Padding */}
          <div className="p-6 sm:p-8 text-center">
            {/* Lottie Animation - Smaller on Mobile */}
            <div className="mb-4 sm:mb-6 -mt-2 sm:-mt-4">
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
                      width: window.innerWidth < 640 ? 150 : 200, // Smaller on mobile
                      height: window.innerWidth < 640 ? 150 : 200, 
                      margin: '0 auto',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                    }}
                    rendererSettings={{
                      preserveAspectRatio: 'xMidYMid meet'
                    }}
                  />
                ) : (
                  // Fallback icon if animation fails - Smaller on Mobile
                  <div className="w-32 h-32 sm:w-50 sm:h-50 mx-auto flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
              {!animationLoaded && !animationError && (
                <div className="w-32 h-32 sm:w-50 sm:h-50 mx-auto flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-agrivet-green border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Heading - Responsive Text */}
            <h2 className={`text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 transition-all duration-700 delay-300 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Branch is closed!
            </h2>

            {/* Subtext - Responsive Text */}
            <p className={`text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 transition-all duration-700 delay-500 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              This branch is currently unavailable. Please try again at{' '}
              <span className="font-semibold text-agrivet-green block sm:inline mt-1 sm:mt-0">
                {nextOpeningTime}
              </span>
            </p>

            {/* Branch Name - Compact */}
            <div className={`flex items-center justify-center mb-6 sm:mb-8 text-gray-500 transition-all duration-700 delay-700 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[250px]">{branchName}</span>
            </div>

            {/* Buttons - Compact on Mobile */}
            <div className={`space-y-2.5 sm:space-y-3 transition-all duration-700 delay-900 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {/* Set Reminder Button */}
              <button
                onClick={onSetReminder}
                className="w-full flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 border-2 border-agrivet-green text-agrivet-green rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-agrivet-green hover:text-white transition-all duration-200 group"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:animate-pulse flex-shrink-0" />
                <span>Set Reminder</span>
              </button>

              {/* Find Another Open Branch Button */}
              <button
                onClick={onFindAnotherBranch}
                className="w-full flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 bg-agrivet-green text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="truncate">Find Another Open Branch</span>
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
            <div className={`mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100 transition-all duration-700 delay-1100 ${
              animationLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
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