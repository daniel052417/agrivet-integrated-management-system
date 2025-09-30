import React, { useState } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle, X } from 'lucide-react'
import { NotificationData, Promotion } from '../../types'

interface PushNotificationSimulatorProps {
  onSendNotification: (notification: NotificationData) => void
}

const PushNotificationSimulator: React.FC<PushNotificationSimulatorProps> = ({
  onSendNotification
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)

  // Sample promotional data for testing
  const samplePromotions: Promotion[] = [
    {
      id: '1',
      title: '10% Off All Feeds!',
      description: 'Get 10% discount on all animal feeds this week. Limited time offer!',
      discountType: 'percentage',
      discountValue: 10,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      displaySettings: {
        showAsBanner: true,
        showAsModal: false,
        showAsNotification: true,
        bannerPosition: 'top',
        modalTrigger: 'immediate',
        notificationTrigger: 'user_action'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Free Shipping Weekend!',
      description: 'Enjoy free shipping on all orders this weekend. No minimum purchase required.',
      discountType: 'free_shipping',
      discountValue: 0,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      displaySettings: {
        showAsBanner: false,
        showAsModal: true,
        showAsNotification: true,
        bannerPosition: 'top',
        modalTrigger: 'immediate',
        notificationTrigger: 'user_action'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Buy 1 Get 1 on Seeds!',
      description: 'Buy any seed packet and get another one free. Perfect for your garden!',
      discountType: 'bogo',
      discountValue: 1,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      displaySettings: {
        showAsBanner: true,
        showAsModal: false,
        showAsNotification: true,
        bannerPosition: 'top',
        modalTrigger: 'immediate',
        notificationTrigger: 'user_action'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const sendTestNotification = async (promotion: Promotion) => {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        alert('This browser does not support notifications')
        return
      }

      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          alert('Notification permission denied')
          return
        }
      }

      if (Notification.permission === 'denied') {
        alert('Notification permission denied. Please enable notifications in your browser settings.')
        return
      }

      // Create notification data
      const notificationData: NotificationData = {
        title: promotion.title,
        body: promotion.description,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `promo-${promotion.id}`,
        data: {
          promotionId: promotion.id,
          type: 'promotion',
          url: '/catalog'
        },
        requireInteraction: true,
        silent: false
      }

      // Send notification
      onSendNotification(notificationData)
      
      // Show success message
      setNotificationSent(true)
      setTimeout(() => setNotificationSent(false), 3000)

    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification')
    }
  }

  const getDiscountText = (promotion: Promotion) => {
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

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-agrivet-green text-white p-3 rounded-full shadow-lg hover:bg-agrivet-green/90 transition-colors"
        title="Test Push Notifications"
      >
        {isOpen ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      </button>

      {/* Simulator Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="bg-agrivet-green text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Test Notifications</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm opacity-90 mt-1">
              Click any promotion to send a test notification
            </p>
          </div>

          {/* Content */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {notificationSent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Notification sent successfully!</span>
              </div>
            )}

            <div className="space-y-3">
              {samplePromotions.map((promotion) => (
                <button
                  key={promotion.id}
                  onClick={() => sendTestNotification(promotion)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-agrivet-green hover:bg-green-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-agrivet-green bg-green-100 px-2 py-1 rounded-full">
                          {getDiscountText(promotion)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm group-hover:text-agrivet-green">
                        {promotion.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {promotion.description}
                      </p>
                    </div>
                    <Bell className="w-4 h-4 text-gray-400 group-hover:text-agrivet-green" />
                  </div>
                </button>
              ))}
            </div>

            {/* Permission Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {Notification.permission === 'granted' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">
                  Permission: {Notification.permission}
                </span>
              </div>
              {Notification.permission !== 'granted' && (
                <p className="text-xs text-gray-600">
                  Notifications will request permission when you click a promotion.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PushNotificationSimulator
