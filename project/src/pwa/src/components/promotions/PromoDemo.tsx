import React, { useState, useEffect } from 'react'
import { Eye, RefreshCw } from 'lucide-react'
import { promotionService } from '../../services/promotionService'
import { Promotion, NotificationData } from '../../types'
import PromoBanner from './PromoBanner'
import PromoModal from './PromoModal'

const PromoDemo: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [bannerPromotions, setBannerPromotions] = useState<Promotion[]>([])
  const [modalPromotions, setModalPromotions] = useState<Promotion[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentModalIndex, setCurrentModalIndex] = useState(0)
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPromotions()
  }, [])

  const loadPromotions = async () => {
    try {
      setIsLoading(true)
      
      // Get current session and targeting info
      const sessionId = localStorage.getItem('pwa-session-id') || 'default-session'
      const branchId = localStorage.getItem('selected-branch-id') || undefined
      const customerId = localStorage.getItem('customer-id') || undefined
      
      const targeting = {
        sessionId,
        branchId,
        customerId
      }
      
      const [allPromos, bannerPromos, modalPromos] = await Promise.all([
        promotionService.getActivePromotions(targeting),
        promotionService.getBannerPromotions(targeting),
        promotionService.getModalPromotions(targeting)
      ])
      
      setPromotions(allPromos)
      setBannerPromotions(bannerPromos)
      setModalPromotions(modalPromos)
    } catch (error) {
      console.error('Error loading promotions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBannerDismiss = async (promotionId: string) => {
    setDismissedBanners(prev => new Set([...prev, promotionId]))
    
    // Track dismissal in analytics
    await promotionService.trackPromotionDismissal(promotionId)
    promotionService.markBannerAsDismissed(promotionId)
  }

  const handleBannerAction = async (promotion: Promotion) => {
    console.log('Banner action clicked:', promotion.title)
    
    // Track click in analytics
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'click',
      sessionId: localStorage.getItem('pwa-session-id') || 'default-session',
      branchId: localStorage.getItem('selected-branch-id') || undefined,
      customerId: localStorage.getItem('customer-id') || undefined
    })
  }

  const handleShowModal = async (promotion: Promotion) => {
    const index = modalPromotions.findIndex(p => p.id === promotion.id)
    setCurrentModalIndex(index >= 0 ? index : 0)
    setShowModal(true)
    
    // Track modal view
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'view',
      sessionId: localStorage.getItem('pwa-session-id') || 'default-session',
      branchId: localStorage.getItem('selected-branch-id') || undefined,
      customerId: localStorage.getItem('customer-id') || undefined
    })
  }

  const handleModalClose = async () => {
    setShowModal(false)
    setCurrentModalIndex(0)
    
    // Mark modal as shown for current promotion
    if (modalPromotions[currentModalIndex]) {
      promotionService.markModalAsShown(modalPromotions[currentModalIndex].id)
    }
  }

  const handleModalAction = async (promotion: Promotion) => {
    console.log('Modal action clicked:', promotion.title)
    
    // Track modal action
    await promotionService.trackPromotionEvent({
      promotionId: promotion.id,
      eventType: 'click',
      sessionId: localStorage.getItem('pwa-session-id') || 'default-session',
      branchId: localStorage.getItem('selected-branch-id') || undefined,
      customerId: localStorage.getItem('customer-id') || undefined
    })
    
    handleModalClose()
  }

  const handleModalIndexChange = (index: number) => {
    setCurrentModalIndex(index)
  }


  const resetDemo = () => {
    setDismissedBanners(new Set())
    setShowModal(false)
    setCurrentModalIndex(0)
    loadPromotions()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <p className="text-gray-600">Loading promotional components...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Promotional Banners */}
      {bannerPromotions
        .filter(promo => !dismissedBanners.has(promo.id))
        .map((promotion) => (
          <PromoBanner
            key={promotion.id}
            promotion={promotion}
            onDismiss={() => handleBannerDismiss(promotion.id)}
            onAction={() => handleBannerAction(promotion)}
          />
        ))}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Promotional Components Demo
              </h1>
              <p className="text-gray-600">
                Test the promotional UI components for AgriVet PWA
              </p>
            </div>
            <button
              onClick={resetDemo}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Available Promotions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Promotions ({promotions.length})
            </h2>
            <div className="space-y-3">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-agrivet-green transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {promotion.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {promotion.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Type: {promotion.discountType}</span>
                        <span>Value: {promotion.discountValue}</span>
                        <span>Banner: {promotion.displaySettings.showAsBanner ? 'Yes' : 'No'}</span>
                        <span>Modal: {promotion.displaySettings.showAsModal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {promotion.displaySettings.showAsModal && (
                        <button
                          onClick={() => handleShowModal(promotion)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Show Modal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component Status */}
          <div className="space-y-6">
            {/* Banner Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Banner Components
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Banners:</span>
                  <span className="font-medium">
                    {bannerPromotions.filter(promo => !dismissedBanners.has(promo.id)).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dismissed Banners:</span>
                  <span className="font-medium">{dismissedBanners.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Banner Promotions:</span>
                  <span className="font-medium">{bannerPromotions.length}</span>
                </div>
              </div>
            </div>

            {/* Modal Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Modal Components
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Modal Promotions:</span>
                  <span className="font-medium">{modalPromotions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Currently Open:</span>
                  <span className="font-medium">{showModal ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Session Modal Shown:</span>
                  <span className="font-medium">
                    {promotionService.shouldShowModal() ? 'No' : 'Yes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notification Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Permission:</span>
                  <span className="font-medium">{Notification.permission}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Supported:</span>
                  <span className="font-medium">
                    {'Notification' in window ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Demo Instructions
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Banners:</strong> Dismiss banners by clicking the X button, or click "Shop Now" to test actions</p>
            <p>• <strong>Modals:</strong> Click the eye icon next to modal promotions to show them</p>
            <p>• <strong>Notifications:</strong> Use the bell button in the bottom-right to test push notifications</p>
            <p>• <strong>Reset:</strong> Click "Reset Demo" to clear dismissed banners and reload promotions</p>
          </div>
        </div>
      </div>

      {/* Promotional Modal */}
      {modalPromotions.length > 0 && (
        <PromoModal
          promotions={modalPromotions}
          isOpen={showModal}
          onClose={handleModalClose}
          onAction={handleModalAction}
          currentIndex={currentModalIndex}
          onIndexChange={handleModalIndexChange}
        />
      )}

    </div>
  )
}

export default PromoDemo
