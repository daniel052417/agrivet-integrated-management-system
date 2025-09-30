import { Promotion, NotificationData } from '../types'

class PromotionService {
  private readonly SESSION_STORAGE_KEY = 'agrivet-promo-session'
  private readonly MODAL_SHOWN_KEY = 'agrivet-modal-shown'

  // Sample promotional data
  private samplePromotions: Promotion[] = [
    {
      id: '1',
      title: '10% Off All Feeds!',
      description: 'Get 10% discount on all animal feeds this week. Limited time offer!',
      imageUrl: '/images/promo-feeds.jpg',
      discountType: 'percentage',
      discountValue: 10,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      conditions: {
        minOrderAmount: 500,
        maxUses: 1000
      },
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
      imageUrl: '/images/promo-shipping.jpg',
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
        modalTrigger: 'delay',
        notificationTrigger: 'user_action'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Buy 1 Get 1 on Seeds!',
      description: 'Buy any seed packet and get another one free. Perfect for your garden!',
      imageUrl: '/images/promo-seeds.jpg',
      discountType: 'bogo',
      discountValue: 1,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      conditions: {
        applicableProducts: ['seeds', 'planting-materials']
      },
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
      id: '4',
      title: '₱100 Off Orders Over ₱1000',
      description: 'Save ₱100 on orders over ₱1000. Valid on all products!',
      imageUrl: '/images/promo-fixed-discount.jpg',
      discountType: 'fixed',
      discountValue: 100,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      targetAudience: 'all',
      conditions: {
        minOrderAmount: 1000,
        maxUses: 500
      },
      displaySettings: {
        showAsBanner: false,
        showAsModal: true,
        showAsNotification: true,
        bannerPosition: 'top',
        modalTrigger: 'scroll',
        notificationTrigger: 'user_action'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Get all active promotions
  async getActivePromotions(): Promise<Promotion[]> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const now = new Date()
      return this.samplePromotions.filter(promo => 
        promo.isActive && 
        new Date(promo.validFrom) <= now && 
        new Date(promo.validUntil) >= now
      )
    } catch (error) {
      console.error('Error fetching promotions:', error)
      return []
    }
  }

  // Get banner promotions
  async getBannerPromotions(): Promise<Promotion[]> {
    const activePromotions = await this.getActivePromotions()
    return activePromotions.filter(promo => promo.displaySettings.showAsBanner)
  }

  // Get modal promotions
  async getModalPromotions(): Promise<Promotion[]> {
    const activePromotions = await this.getActivePromotions()
    return activePromotions.filter(promo => promo.displaySettings.showAsModal)
  }

  // Check if modal should be shown in this session
  shouldShowModal(): boolean {
    const sessionId = this.getSessionId()
    const modalShown = sessionStorage.getItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`)
    return !modalShown
  }

  // Mark modal as shown for this session
  markModalAsShown(): void {
    const sessionId = this.getSessionId()
    sessionStorage.setItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`, 'true')
  }

  // Get or create session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, sessionId)
    }
    return sessionId
  }

  // Create notification data from promotion
  createNotificationFromPromotion(promotion: Promotion): NotificationData {
    return {
      title: promotion.title,
      body: promotion.description,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `promo-${promotion.id}`,
      data: {
        promotionId: promotion.id,
        type: 'promotion',
        url: '/catalog',
        discountType: promotion.discountType,
        discountValue: promotion.discountValue
      },
      requireInteraction: true,
      silent: false
    }
  }

  // Send browser notification
  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications')
      }

      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Notification permission denied')
        }
      }

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied. Please enable notifications in your browser settings.')
      }

      // Create and show notification
      const notification = new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent
      })

      // Handle notification click
      notification.onclick = () => {
        window.focus()
        if (notificationData.data?.url) {
          window.location.href = notificationData.data.url
        }
        notification.close()
      }

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close()
      }, 10000)

    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  // Get promotion by ID
  async getPromotionById(id: string): Promise<Promotion | null> {
    const promotions = await this.getActivePromotions()
    return promotions.find(promo => promo.id === id) || null
  }

  // Check if promotion is valid for current user/branch
  isPromotionValid(promotion: Promotion, branchId?: string): boolean {
    const now = new Date()
    const validFrom = new Date(promotion.validFrom)
    const validUntil = new Date(promotion.validUntil)

    // Check if promotion is active and within date range
    if (!promotion.isActive || now < validFrom || now > validUntil) {
      return false
    }

    // Check target audience
    if (promotion.targetAudience === 'specific_branch' && branchId) {
      return promotion.targetBranchIds?.includes(branchId) || false
    }

    return true
  }
}

export const promotionService = new PromotionService()
