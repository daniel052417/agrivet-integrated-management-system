import React, { useState, useEffect, useCallback } from 'react'
import { promotionService } from '../../services/promotionService'
import { useNotifications } from '../../hooks/useNotifications'
import { PromotionDisplayManagerProps, PromotionDisplayState, Promotion } from '../../types'
import PromoBanner from './PromoBanner'
import PromoModal from './PromoModal'
import PromoCarousel from './PromoCarousel'

const PromotionDisplayManager: React.FC<PromotionDisplayManagerProps> = ({
  branchId,
  customerId,
  sessionId,
  position = 'both',
  onPromotionAction
}) => {
  const [displayState, setDisplayState] = useState<PromotionDisplayState>({
    banners: [],
    modals: [],
    notifications: [],
    carousels: [],
    isLoading: true,
    error: undefined
  })

  const [showModal, setShowModal] = useState(false)
  const [currentModalIndex, setCurrentModalIndex] = useState(0)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())

  // Notification hook
  const {
    permission: notificationPermission,
    isSupported: notificationsSupported,
    requestPermission,
    showNotification,
    scheduleNotification
  } = useNotifications({
    onPermissionGranted: () => console.log('Notification permission granted'),
    onPermissionDenied: () => console.log('Notification permission denied'),
    onNotificationClick: (notification) => {
      console.log('Notification clicked:', notification)
      onPromotionAction?.(notification.data?.promotion, 'click')
    },
    onNotificationError: (error) => console.error('Notification error:', error)
  })

  // Load promotions
  const loadPromotions = useCallback(async () => {
    try {
      setDisplayState(prev => ({ ...prev, isLoading: true, error: undefined }))

      const targeting = {
        branchId,
        customerId,
        sessionId: sessionId || localStorage.getItem('pwa-session-id') || 'default-session'
      }

      const promotions = await promotionService.getAllPromotionsByDisplayMode(targeting, position)

      setDisplayState({
        banners: promotions.banners,
        modals: promotions.modals,
        notifications: promotions.notifications,
        carousels: promotions.carousels,
        isLoading: false,
        error: undefined
      })

      // Handle notifications
      await handleNotifications(promotions.notifications)

    } catch (error) {
      console.error('Error loading promotions:', error)
      setDisplayState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load promotions'
      }))
    }
  }, [branchId, customerId, sessionId, position])

  // Handle notifications
  const handleNotifications = async (notifications: Promotion[]) => {
    if (!notificationsSupported || notificationPermission !== 'granted' || notifications.length === 0) {
      return
    }

    for (const promotion of notifications) {
      try {
        const notificationData = promotionService.createNotificationFromPromotion(promotion)
        
        // Check if notification was already shown
        const shownKey = `agrivet-notifications-shown-${sessionId || 'default-session'}`
        const shown = JSON.parse(sessionStorage.getItem(shownKey) || '[]')
        
        if (!shown.includes(promotion.id)) {
          await showNotification(notificationData)
          
          // Mark as shown
          shown.push(promotion.id)
          sessionStorage.setItem(shownKey, JSON.stringify(shown))
          
          // Track notification sent
          await promotionService.trackPromotionEvent({
            promotionId: promotion.id,
            eventType: 'conversion',
            sessionId: sessionId || 'default-session',
            branchId,
            customerId,
            eventData: { notificationType: 'push' }
          })
        }
      } catch (error) {
        console.error('Error showing notification:', error)
      }
    }
  }

  // Load promotions on mount and when dependencies change
  useEffect(() => {
    loadPromotions()
  }, [loadPromotions])

  // Handle banner dismissal
  const handleBannerDismiss = useCallback(async (promotionId: string) => {
    setDismissedBanners(prev => new Set([...prev, promotionId]))
    
    // Track dismissal
    await promotionService.trackPromotionDismissal(promotionId, customerId, branchId)
    promotionService.markBannerAsDismissed(promotionId)
    
    onPromotionAction?.(displayState.banners.find(p => p.id === promotionId)!, 'dismiss')
  }, [displayState.banners, customerId, branchId, onPromotionAction])

  // Handle banner action
  const handleBannerAction = useCallback(async (promotion: Promotion) => {
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'click',
      sessionId: sessionId || 'default-session',
      branchId,
      customerId
    })
    
    onPromotionAction?.(promotion, 'click')
  }, [sessionId, branchId, customerId, onPromotionAction])

  // Handle modal show
  const handleShowModal = useCallback(async (promotion: Promotion) => {
    const index = displayState.modals.findIndex(p => p.id === promotion.id)
    setCurrentModalIndex(index >= 0 ? index : 0)
    setShowModal(true)
    
    // Track modal view
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'view',
      sessionId: sessionId || 'default-session',
      branchId,
      customerId
    })
    
    onPromotionAction?.(promotion, 'view')
  }, [displayState.modals, sessionId, branchId, customerId, onPromotionAction])

  // Handle modal close
  const handleModalClose = useCallback(async () => {
    setShowModal(false)
    setCurrentModalIndex(0)
    
    // Mark modal as shown
    if (displayState.modals[currentModalIndex]) {
      promotionService.markModalAsShown(displayState.modals[currentModalIndex].id)
    }
  }, [displayState.modals, currentModalIndex])

  // Handle modal action
  const handleModalAction = useCallback(async (promotion: Promotion) => {
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'click',
      sessionId: sessionId || 'default-session',
      branchId,
      customerId
    })
    
    onPromotionAction?.(promotion, 'click')
    handleModalClose()
  }, [sessionId, branchId, customerId, onPromotionAction, handleModalClose])

  // Handle carousel action
  const handleCarouselAction = useCallback(async (promotion: Promotion) => {
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'click',
      sessionId: sessionId || 'default-session',
      branchId,
      customerId
    })
    
    onPromotionAction?.(promotion, 'click')
  }, [sessionId, branchId, customerId, onPromotionAction])

  // Request notification permission
  const handleRequestNotificationPermission = useCallback(async () => {
    try {
      await requestPermission()
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }, [requestPermission])

  if (displayState.isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agrivet-green"></div>
        <span className="ml-2 text-gray-600">Loading promotions...</span>
      </div>
    )
  }

  if (displayState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading promotions: {displayState.error}</p>
        <button
          onClick={loadPromotions}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Banners */}
      {displayState.banners
        .filter(promo => !dismissedBanners.has(promo.id))
        .map((promotion) => (
          <PromoBanner
            key={promotion.id}
            promotion={promotion}
            onDismiss={() => handleBannerDismiss(promotion.id)}
            onAction={() => handleBannerAction(promotion)}
          />
        ))}

      {/* Modals */}
      {displayState.modals.length > 0 && (
        <PromoModal
          promotions={displayState.modals}
          isOpen={showModal}
          onClose={handleModalClose}
          onAction={handleModalAction}
          currentIndex={currentModalIndex}
          onIndexChange={setCurrentModalIndex}
        />
      )}

      {/* Carousels */}
      {displayState.carousels.length > 0 && (
        <PromoCarousel
          promotions={displayState.carousels}
          currentIndex={0}
          onIndexChange={() => {}}
          onAction={handleCarouselAction}
          autoplayInterval={displayState.carousels[0]?.displaySettings?.carouselInterval || 5000}
          showControls={true}
          showDots={true}
          showPlayPause={true}
        />
      )}

      {/* Notification Permission Request */}
      {notificationsSupported && notificationPermission === 'default' && displayState.notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-agrivet-green rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔔</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Enable Notifications</h4>
              <p className="text-xs text-gray-600 mt-1">
                Get notified about special promotions and offers
              </p>
              <button
                onClick={handleRequestNotificationPermission}
                className="mt-2 text-xs bg-agrivet-green text-white px-3 py-1 rounded hover:bg-agrivet-green/90"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>Banners: {displayState.banners.length}</div>
          <div>Modals: {displayState.modals.length}</div>
          <div>Notifications: {displayState.notifications.length}</div>
          <div>Carousels: {displayState.carousels.length}</div>
          <div>Permission: {notificationPermission}</div>
        </div>
      )}
    </>
  )
}

export default PromotionDisplayManager
