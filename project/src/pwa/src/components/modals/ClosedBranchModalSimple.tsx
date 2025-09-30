import React, { useEffect, useState } from 'react'
import { X, Clock, MapPin, ShoppingBag, Lock } from 'lucide-react'

interface ClosedBranchModalProps {
  isOpen: boolean
  onClose: () => void
  branchName: string
  nextOpeningTime: string
  onSetReminder: () => void
  onFindAnotherBranch: () => void
  onBrowseAnyway: () => void
}

const ClosedBranchModalSimple: React.FC<ClosedBranchModalProps> = ({
  isOpen,
  onClose,
  branchName,
  nextOpeningTime,
  onSetReminder,
  onFindAnotherBranch,
  onBrowseAnyway
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Simple Lock Icon */}
            <div className="mb-6 -mt-4">
              <div className="w-50 h-50 mx-auto flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                  <Lock className="w-10 h-10 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Branch is locked!
            </h2>

            {/* Subtext */}
            <p className="text-lg text-gray-600 mb-8">
              This branch is currently unavailable. Please try again at{' '}
              <span className="font-semibold text-agrivet-green">
                {nextOpeningTime}
              </span>
            </p>

            {/* Branch Name */}
            <div className="flex items-center justify-center mb-8 text-gray-500">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm">{branchName}</span>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              {/* Set Reminder Button */}
              <button
                onClick={onSetReminder}
                className="w-full flex items-center justify-center px-6 py-3 border-2 border-agrivet-green text-agrivet-green rounded-xl font-medium hover:bg-agrivet-green hover:text-white transition-all duration-200 group"
              >
                <Clock className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Set Reminder
              </button>

              {/* Find Another Open Branch Button */}
              <button
                onClick={onFindAnotherBranch}
                className="w-full flex items-center justify-center px-6 py-3 bg-agrivet-green text-white rounded-xl font-medium hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Find Another Open Branch
              </button>

              {/* Browse Anyway Button */}
              <button
                onClick={onBrowseAnyway}
                className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Anyway
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                You can still browse our products and place an order for pickup when this branch is available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClosedBranchModalSimple
