import { supabase } from './supabase'
import { Promotion, NotificationData } from '../types'

interface PromotionServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface PromotionAnalytics {
  promotionId: string
  eventType: 'view' | 'click' | 'dismiss' | 'conversion' | 'use'
  sessionId: string
  customerId?: string
  branchId?: string
  eventData?: Record<string, any>
}

interface PromotionTargeting {
  branchId?: string
  customerId?: string
  sessionId?: string
  userRole?: string
}

class PromotionService {
  private readonly SESSION_STORAGE_KEY = 'agrivet-promo-session'
  private readonly MODAL_SHOWN_KEY = 'agrivet-modal-shown'
  private readonly DISMISSED_BANNERS_KEY = 'agrivet-dismissed-banners'

  constructor() {
    // Initialize service
  }

  // ============================================================================
  // TASK 1: UPDATE PROMOTIONSERVICE (CONNECT SUPABASE)
  // ============================================================================

  /**
   * Map database promotion format to TypeScript interface format
   * Updated to match the actual database schema with new display modes
   */
  private mapPromotions(dbPromotions: any[]): Promotion[] {
    return dbPromotions.map(dbPromo => ({
      id: dbPromo.id,
      title: dbPromo.name || dbPromo.title || 'Promotion',
      description: dbPromo.description || '',
      imageUrl: dbPromo.image_url,
      discountType: dbPromo.type || dbPromo.discount_type || 'percentage',
      discountValue: dbPromo.discount_value || 0,
      validFrom: dbPromo.valid_from || dbPromo.start_date,
      validUntil: dbPromo.valid_until || dbPromo.end_date,
      isActive: dbPromo.is_active || false,
      targetAudience: dbPromo.target_audience || 'all',
      targetBranchIds: dbPromo.target_branch_ids || [],
      branchId: dbPromo.branch_id || undefined,
      conditions: dbPromo.conditions || {},
      // New display mode system
      displayMode: dbPromo.display_mode || this.inferDisplayMode(dbPromo),
      displayPriority: dbPromo.display_priority || 0,
      displaySettings: {
        showAsBanner: dbPromo.display_settings?.showAsBanner || false,
        showAsModal: dbPromo.display_settings?.showAsModal || false,
        showAsNotification: dbPromo.display_settings?.showAsNotification || false,
        showAsCarousel: dbPromo.display_settings?.showAsCarousel || false,
        bannerPosition: dbPromo.display_settings?.bannerPosition || 'top',
        modalTrigger: dbPromo.display_settings?.modalTrigger || 'immediate',
        notificationTrigger: dbPromo.display_settings?.notificationTrigger || 'immediate',
        carouselInterval: dbPromo.display_settings?.carouselInterval || 5000,
        carouselPosition: dbPromo.display_settings?.carouselPosition || 'both'
      },
      createdAt: dbPromo.created_at,
      updatedAt: dbPromo.updated_at
    }))
  }

  /**
   * Infer display mode from legacy display settings
   */
  private inferDisplayMode(dbPromo: any): 'banner' | 'modal' | 'notification' | 'carousel' {
    const settings = dbPromo.display_settings || {}
    
    if (settings.showAsBanner) return 'banner'
    if (settings.showAsModal) return 'modal'
    if (settings.showAsNotification) return 'notification'
    if (settings.showAsCarousel) return 'carousel'
    
    // Default to banner for backward compatibility
    return 'banner'
  }

  // ============================================================================
  // TASK 2: REMOVE SAMPLE DATA (ENSURE ONLY REAL DATA SOURCE USED)
  // ============================================================================

  /**
   * Get active promotions from Supabase only (no sample data)
   */
  async getActivePromotions(targeting?: PromotionTargeting): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const promotions = this.mapPromotions(data || [])
      
      // Apply targeting filters
      return this.applyTargetingFilters(promotions, targeting)
    } catch (error) {
      console.error('Error fetching active promotions:', error)
      return []
    }
  }

  /**
   * Get banner promotions from Supabase only
   */
  async getBannerPromotions(targeting?: PromotionTargeting): Promise<Promotion[]> {
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

      const promotions = this.mapPromotions(data || [])
      
      // Apply targeting filters and check if dismissed
      const filteredPromotions = this.applyTargetingFilters(promotions, targeting)
      return this.filterDismissedPromotions(filteredPromotions, 'banner')
    } catch (error) {
      console.error('Error fetching banner promotions:', error)
      return []
    }
  }

  /**
   * Get modal promotions from Supabase only
   */
  async getModalPromotions(targeting?: PromotionTargeting): Promise<Promotion[]> {
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

      const promotions = this.mapPromotions(data || [])
      
      // Apply targeting filters and check if modal was shown
      const filteredPromotions = this.applyTargetingFilters(promotions, targeting)
      return this.filterShownModals(filteredPromotions)
    } catch (error) {
      console.error('Error fetching modal promotions:', error)
      return []
    }
  }

  // ============================================================================
  // NEW DISPLAY MODE METHODS
  // ============================================================================

  /**
   * Get promotions by display mode with enhanced filtering
   */
  async getPromotionsByDisplayMode(
    displayMode: 'banner' | 'modal' | 'notification' | 'carousel',
    targeting?: PromotionTargeting,
    position?: 'homepage' | 'promotions' | 'both'
  ): Promise<Promotion[]> {
    try {
      let query = supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())

      // Filter by display mode
      if (displayMode === 'banner') {
        query = query.eq('display_settings->>showAsBanner', 'true')
      } else if (displayMode === 'modal') {
        query = query.eq('display_settings->>showAsModal', 'true')
      } else if (displayMode === 'notification') {
        query = query.eq('display_settings->>showAsNotification', 'true')
      } else if (displayMode === 'carousel') {
        query = query.eq('display_settings->>showAsCarousel', 'true')
      }

      // Filter by position if specified
      if (position && position !== 'both') {
        query = query.or(`display_settings->>carouselPosition.eq.${position},display_settings->>carouselPosition.eq.both`)
      }

      const { data, error } = await query
        .order('display_priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const promotions = this.mapPromotions(data || [])
      const filteredPromotions = this.applyTargetingFilters(promotions, targeting)

      // Apply display mode specific filtering
      switch (displayMode) {
        case 'banner':
          return this.filterDismissedPromotions(filteredPromotions, 'banner')
        case 'modal':
          return this.filterShownModals(filteredPromotions)
        case 'notification':
          return this.filterNotificationPromotions(filteredPromotions)
        case 'carousel':
          return this.filterCarouselPromotions(filteredPromotions)
        default:
          return filteredPromotions
      }
    } catch (error) {
      console.error(`Error fetching ${displayMode} promotions:`, error)
      return []
    }
  }

  /**
   * Get all promotions grouped by display mode
   */
  async getAllPromotionsByDisplayMode(
    targeting?: PromotionTargeting,
    position?: 'homepage' | 'promotions' | 'both'
  ): Promise<{
    banners: Promotion[]
    modals: Promotion[]
    notifications: Promotion[]
    carousels: Promotion[]
  }> {
    try {
      const [banners, modals, notifications, carousels] = await Promise.all([
        this.getPromotionsByDisplayMode('banner', targeting, position),
        this.getPromotionsByDisplayMode('modal', targeting, position),
        this.getPromotionsByDisplayMode('notification', targeting, position),
        this.getPromotionsByDisplayMode('carousel', targeting, position)
      ])

      return { banners, modals, notifications, carousels }
    } catch (error) {
      console.error('Error fetching all promotions by display mode:', error)
      return { banners: [], modals: [], notifications: [], carousels: [] }
    }
  }

  /**
   * Filter notification promotions (show only once per session)
   */
  private filterNotificationPromotions(promotions: Promotion[]): Promotion[] {
    if (typeof window === 'undefined') return promotions

    const sessionId = this.getSessionId()
    const shownKey = `agrivet-notifications-shown-${sessionId}`
    const shown = JSON.parse(sessionStorage.getItem(shownKey) || '[]')

    return promotions.filter(promotion => !shown.includes(promotion.id))
  }

  /**
   * Filter carousel promotions (prioritize by display_priority)
   */
  private filterCarouselPromotions(promotions: Promotion[]): Promotion[] {
    return promotions
      .sort((a, b) => b.displayPriority - a.displayPriority)
      .slice(0, 10) // Limit to 10 carousel items
  }

  // ============================================================================
  // TASK 3: ADD PROMOTION VALIDATION (VALID_FROM/VALID_UNTIL, IS_ACTIVE)
  // ============================================================================

  /**
   * Validate promotion based on database schema requirements
   */
  isPromotionValid(promotion: Promotion, targeting?: PromotionTargeting): boolean {
    const now = new Date()
    const validFrom = new Date(promotion.validFrom)
    const validUntil = new Date(promotion.validUntil)

    // Check if promotion is active
    if (!promotion.isActive) {
      return false
    }

    // Check date validity using valid_from and valid_until
    if (now < validFrom || now > validUntil) {
      return false
    }

    // Check targeting audience
    if (!this.isTargetAudienceValid(promotion, targeting)) {
      return false
    }

    // Check conditions
    if (!this.validatePromotionConditions(promotion, targeting)) {
      return false
    }

    return true
  }

  /**
   * Validate target audience
   */
  private isTargetAudienceValid(promotion: Promotion, targeting?: PromotionTargeting): boolean {
    if (!targeting) return true

    switch (promotion.targetAudience) {
      case 'all':
        return true
      
      case 'specific_branch':
        return !targeting.branchId || (promotion.targetBranchIds || []).includes(targeting.branchId)
      
      case 'new_customers':
        // For now, return true - this would need to be async in real implementation
        return true
      
      case 'returning_customers':
        // For now, return true - this would need to be async in real implementation
        return true
      
      default:
        return true
    }
  }

  /**
   * Validate promotion conditions
   */
  private validatePromotionConditions(promotion: Promotion, targeting?: PromotionTargeting): boolean {
    const conditions = promotion.conditions || {}
    
    // Check minimum order amount (if applicable)
    if (conditions.minOrderAmount && targeting?.eventData?.orderAmount) {
      if (targeting.eventData.orderAmount < conditions.minOrderAmount) {
        return false
      }
    }

    // Check usage limits
    if (conditions.maxUses && promotion.usage_count >= conditions.maxUses) {
      return false
    }

    return true
  }

  /**
   * Check if customer is new (created within 30 days)
   */
  private async isNewCustomer(customerId?: string): Promise<boolean> {
    if (!customerId) return false

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('created_at')
        .eq('id', customerId)
        .single()

      if (error || !data) return false

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return new Date(data.created_at) > thirtyDaysAgo
    } catch (error) {
      console.error('Error checking if customer is new:', error)
      return false
    }
  }

  /**
   * Check if customer is returning (older than 30 days)
   */
  private async isReturningCustomer(customerId?: string): Promise<boolean> {
    if (!customerId) return false

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('created_at')
        .eq('id', customerId)
        .single()

      if (error || !data) return false

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return new Date(data.created_at) <= thirtyDaysAgo
    } catch (error) {
      console.error('Error checking if customer is returning:', error)
      return false
    }
  }

  // ============================================================================
  // TASK 4: IMPLEMENT PROMOTION TARGETING (BRANCH, ROLE, ETC.)
  // ============================================================================

  /**
   * Apply targeting filters to promotions
   */
  private applyTargetingFilters(promotions: Promotion[], targeting?: PromotionTargeting): Promotion[] {
    if (!targeting) return promotions

    return promotions.filter(promotion => {
      // Check branch targeting
      if (promotion.targetAudience === 'specific_branch' && targeting.branchId) {
        const targetBranches = promotion.targetBranchIds || []
        if (!targetBranches.includes(targeting.branchId)) {
          return false
        }
      }

      // Check customer targeting
      if (promotion.targetAudience === 'new_customers' && targeting.customerId) {
        // This would need to be async in real implementation
        return true // Simplified for now
      }

      if (promotion.targetAudience === 'returning_customers' && targeting.customerId) {
        // This would need to be async in real implementation
        return true // Simplified for now
      }

      return true
    })
  }

  /**
   * Filter out dismissed banner promotions
   */
  private filterDismissedPromotions(promotions: Promotion[], type: 'banner' | 'modal'): Promotion[] {
    if (typeof window === 'undefined') return promotions

    const sessionId = this.getSessionId()
    const dismissedKey = type === 'banner' ? this.DISMISSED_BANNERS_KEY : this.MODAL_SHOWN_KEY
    const dismissed = JSON.parse(sessionStorage.getItem(`${dismissedKey}-${sessionId}`) || '[]')

    return promotions.filter(promotion => !dismissed.includes(promotion.id))
  }

  /**
   * Filter out shown modals
   */
  private filterShownModals(promotions: Promotion[]): Promotion[] {
    if (typeof window === 'undefined') return promotions

    const sessionId = this.getSessionId()
    const shown = sessionStorage.getItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`)
    
    if (!shown) return promotions

    return promotions.filter(promotion => {
      const shownModals = JSON.parse(shown)
      return !shownModals.includes(promotion.id)
    })
  }

  // ============================================================================
  // TASK 5: ADD PROMOTION ANALYTICS (LOGGING SYSTEM)
  // ============================================================================

  /**
   * Track promotion analytics event
   */
  async trackPromotionEvent(analytics: PromotionAnalytics): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      
      // Insert into promotion_analytics table
      const { error: analyticsError } = await supabase
        .from('promotion_analytics')
        .insert({
          promotion_id: analytics.promotionId,
          event_type: analytics.eventType,
          session_id: analytics.sessionId || sessionId,
          customer_id: analytics.customerId || null,
          branch_id: analytics.branchId || null,
          event_data: analytics.eventData || {},
          user_agent: navigator.userAgent,
          ip_address: null, // Will be set by database trigger
          device_type: this.getDeviceType(),
          browser: this.getBrowserType()
        })

      if (analyticsError) {
        console.error('Error tracking promotion analytics:', analyticsError)
        return
      }

      // Update promotion counters
      await this.updatePromotionCounters(analytics.promotionId, analytics.eventType)

    } catch (error) {
      console.error('Error tracking promotion event:', error)
    }
  }

  /**
   * Update promotion counters in the promotions table
   */
  private async updatePromotionCounters(promotionId: string, eventType: string): Promise<void> {
    try {
      const updateData: any = {}
      
      switch (eventType) {
        case 'view':
          updateData.total_views = supabase.raw('total_views + 1')
          break
        case 'click':
          updateData.total_clicks = supabase.raw('total_clicks + 1')
          break
        case 'conversion':
          updateData.total_conversions = supabase.raw('total_conversions + 1')
          break
        case 'use':
          updateData.total_uses = supabase.raw('total_uses + 1')
          break
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('promotions')
          .update(updateData)
          .eq('id', promotionId)
      }
    } catch (error) {
      console.error('Error updating promotion counters:', error)
    }
  }

  /**
   * Track promotion usage when applied to order
   */
  async trackPromotionUsage(
    promotionId: string,
    orderId: string,
    customerId?: string,
    branchId?: string,
    discountApplied: number,
    originalAmount: number,
    finalAmount: number
  ): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      
      await supabase
        .from('promotion_usage')
        .insert({
          promotion_id: promotionId,
          order_id: orderId,
          customer_id: customerId || null,
          branch_id: branchId || null,
          discount_applied: discountApplied,
          original_amount: originalAmount,
          final_amount: finalAmount,
          session_id: sessionId
        })

      // Track as 'use' event
      await this.trackPromotionEvent({
        promotionId,
        eventType: 'use',
        sessionId,
        customerId,
        branchId,
        eventData: {
          orderId,
          discountApplied,
          originalAmount,
          finalAmount
        }
      })
    } catch (error) {
      console.error('Error tracking promotion usage:', error)
    }
  }

  /**
   * Track promotion dismissal
   */
  async trackPromotionDismissal(
    promotionId: string,
    customerId?: string,
    branchId?: string,
    dismissalType: 'user_action' | 'auto_expire' | 'admin_disable' = 'user_action'
  ): Promise<void> {
    try {
      const sessionId = this.getSessionId()
      
      // Insert into promotion_dismissals table
      await supabase
        .from('promotion_dismissals')
        .insert({
          promotion_id: promotionId,
          session_id: sessionId,
          customer_id: customerId || null,
          branch_id: branchId || null,
          dismissal_type: dismissalType
        })

      // Track as 'dismiss' event
      await this.trackPromotionEvent({
        promotionId,
        eventType: 'dismiss',
        sessionId,
        customerId,
        branchId,
        eventData: { dismissalType }
      })

    } catch (error) {
      console.error('Error tracking promotion dismissal:', error)
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, sessionId)
    }
    return sessionId
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('mobile')) return 'mobile'
    if (userAgent.includes('tablet')) return 'tablet'
    return 'desktop'
  }

  private getBrowserType(): string {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('chrome')) return 'chrome'
    if (userAgent.includes('firefox')) return 'firefox'
    if (userAgent.includes('safari')) return 'safari'
    return 'other'
  }

  // ============================================================================
  // EXISTING METHODS (UPDATED)
  // ============================================================================

  shouldShowModal(): boolean {
    if (typeof window === 'undefined') return false
    
    const sessionId = this.getSessionId()
    const shown = sessionStorage.getItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`)
    return !shown
  }

  markModalAsShown(promotionId: string): void {
    if (typeof window === 'undefined') return
    
    const sessionId = this.getSessionId()
    const shown = JSON.parse(sessionStorage.getItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`) || '[]')
    shown.push(promotionId)
    sessionStorage.setItem(`${this.MODAL_SHOWN_KEY}-${sessionId}`, JSON.stringify(shown))
  }

  markBannerAsDismissed(promotionId: string): void {
    if (typeof window === 'undefined') return
    
    const sessionId = this.getSessionId()
    const dismissed = JSON.parse(sessionStorage.getItem(`${this.DISMISSED_BANNERS_KEY}-${sessionId}`) || '[]')
    dismissed.push(promotionId)
    sessionStorage.setItem(`${this.DISMISSED_BANNERS_KEY}-${sessionId}`, JSON.stringify(dismissed))
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
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications')
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          throw new Error('Notification permission denied')
        }
      }

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied. Please enable notifications in your browser settings.')
      }

      const notification = new Notification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction,
        silent: notificationData.silent
      })

      notification.onclick = () => {
        window.focus()
        if (notificationData.data?.url) {
          window.location.href = notificationData.data.url
        }
        notification.close()
      }

      if (!notificationData.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      // Track notification sent
      if (notificationData.data?.promotionId) {
        await this.trackPromotionEvent({
          promotionId: notificationData.data.promotionId,
          eventType: 'conversion',
          sessionId: this.getSessionId(),
          eventData: {
            notificationTitle: notificationData.title,
            notificationType: 'push'
          }
        })
      }

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
      return this.mapPromotions([data])[0] || null
    } catch (error) {
      console.error('Error fetching promotion:', error)
      return null
    }
  }
}

export const promotionService = new PromotionService()