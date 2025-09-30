import { supabase } from './supabase'
import { Promotion, NotificationData } from '../types'

class PromotionService {
  private readonly SESSION_STORAGE_KEY = 'agrivet-promo-session'
  private readonly MODAL_SHOWN_KEY = 'agrivet-modal-shown'

  async getActivePromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching promotions:', error)
      return []
    }
  }

  async getBannerPromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .eq('display_settings->>showAsBanner', 'true')
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching banner promotions:', error)
      return []
    }
  }

  async getModalPromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .eq('display_settings->>showAsModal', 'true')
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching modal promotions:', error)
      return []
    }
  }

  shouldShowModal(): boolean {
    if (typeof window === 'undefined') return false
    
    const sessionId = this.getSessionId()
    const shown = sessionStorage.getItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`)
    return !shown
  }

  markModalAsShown(): void {
    if (typeof window === 'undefined') return
    
    const sessionId = this.getSessionId()
    sessionStorage.setItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`, 'true')
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, sessionId)
    }
    return sessionId
  }

  createNotificationFromPromotion(promotion: Promotion): NotificationData {
    return {
      title: promotion.title,
      body: promotion.description || '',
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
  }

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

      // Auto-close after 5 seconds if not requiring interaction
      if (!notificationData.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Track notification in analytics
      await this.trackEvent('notification_sent', {
        promotion_id: notificationData.data?.promotionId,
        notification_title: notificationData.title
      })

    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  async getPromotionById(id: string): Promise<Promotion | null> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching promotion:', error)
      return null
    }
  }

  isPromotionValid(promotion: Promotion, branchId?: string): boolean {
    const now = new Date()
    const validFrom = new Date(promotion.valid_from)
    const validUntil = new Date(promotion.valid_until)

    // Check date validity
    if (now < validFrom || now > validUntil) {
      return false
    }

    // Check if promotion is active
    if (!promotion.is_active) {
      return false
    }

    // Check target audience
    if (promotion.target_audience === 'specific_branch' && branchId) {
      const targetBranches = promotion.target_branch_ids || []
      if (!targetBranches.includes(branchId)) {
        return false
      }
    }

    return true
  }

  async trackEvent(eventType: string, eventData: Record<string, any> = {}): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      
      await supabase
        .from('pwa_analytics')
        .insert({
          session_id: sessionId,
          event_type: eventType,
          event_data: eventData,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          ip_address: null // Will be set by database trigger
        })
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  async createSession(branchId?: string): Promise<string> {
    try {
      const sessionId = this.getSessionId()
      
      const { data, error } = await supabase
        .from('pwa_sessions')
        .insert({
          session_id: sessionId,
          user_agent: navigator.userAgent,
          ip_address: null, // Will be set by database trigger
          branch_id: branchId,
          is_active: true,
          last_activity: new Date().toISOString()
        })
        .select('session_id')
        .single()

      if (error) throw error
      return data.session_id
    } catch (error) {
      console.error('Error creating session:', error)
      return this.getSessionId()
    }
  }

  async updateSession(sessionId: string, branchId?: string): Promise<void> {
    try {
      await supabase
        .from('pwa_sessions')
        .update({
          branch_id: branchId,
          last_activity: new Date().toISOString()
        })
        .eq('session_id', sessionId)
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('pwa_sessions')
        .update({
          is_active: false,
          last_activity: new Date().toISOString()
        })
        .eq('session_id', sessionId)
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }
}

export const promotionService = new PromotionService()