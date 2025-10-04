import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

export interface RealtimeCallbacks {
  onInventoryUpdate?: (payload: any) => void
  onBranchUpdate?: (payload: any) => void
  onProductUpdate?: (payload: any) => void
  onCategoryUpdate?: (payload: any) => void
  onPromotionUpdate?: (payload: any) => void
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private callbacks: RealtimeCallbacks = {}
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.setupConnectionMonitoring()
  }

  /**
   * Set up real-time callbacks
   */
  setCallbacks(callbacks: RealtimeCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Subscribe to inventory changes
   */
  subscribeToInventory(branchId?: string): RealtimeSubscription | null {
    try {
      console.log('🔄 RealtimeService: Subscribing to inventory changes...')
      
      // Check if we have a valid Supabase client
      if (!supabase) {
        console.error('❌ RealtimeService: Supabase client not available')
        return null
      }
      
      const channelName = branchId ? `inventory-${branchId}` : 'inventory'
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'inventory',
            filter: branchId ? `branch_id=eq.${branchId}` : undefined
          },
          (payload) => {
            console.log('📦 RealtimeService: Inventory update received:', payload)
            this.callbacks.onInventoryUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('📦 RealtimeService: Inventory subscription status:', status)
          this.handleConnectionStatus(status)
        })

      const subscription: RealtimeSubscription = {
        channel,
        unsubscribe: () => {
          console.log('🔌 RealtimeService: Unsubscribing from inventory...')
          try {
            supabase.removeChannel(channel)
          } catch (error) {
            console.error('❌ RealtimeService: Error removing channel:', error)
          }
          this.subscriptions.delete(channelName)
        }
      }

      this.subscriptions.set(channelName, subscription)
      return subscription
    } catch (error) {
      console.error('❌ RealtimeService: Error subscribing to inventory:', error)
      return null
    }
  }

  /**
   * Subscribe to branch changes
   */
  subscribeToBranches(): RealtimeSubscription | null {
    try {
      console.log('🔄 RealtimeService: Subscribing to branch changes...')
      
      // Check if we have a valid Supabase client
      if (!supabase) {
        console.error('❌ RealtimeService: Supabase client not available')
        return null
      }
      
      const channelName = 'branches'
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'branches'
          },
          (payload) => {
            console.log('🏢 RealtimeService: Branch update received:', payload)
            this.callbacks.onBranchUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('🏢 RealtimeService: Branch subscription status:', status)
          this.handleConnectionStatus(status)
        })

      const subscription: RealtimeSubscription = {
        channel,
        unsubscribe: () => {
          console.log('🔌 RealtimeService: Unsubscribing from branches...')
          try {
            supabase.removeChannel(channel)
          } catch (error) {
            console.error('❌ RealtimeService: Error removing channel:', error)
          }
          this.subscriptions.delete(channelName)
        }
      }

      this.subscriptions.set(channelName, subscription)
      return subscription
    } catch (error) {
      console.error('❌ RealtimeService: Error subscribing to branches:', error)
      return null
    }
  }

  /**
   * Subscribe to product changes
   */
  subscribeToProducts(): RealtimeSubscription | null {
    try {
      console.log('🔄 RealtimeService: Subscribing to product changes...')
      
      const channelName = 'products'
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'product_variants'
          },
          (payload) => {
            console.log('🛍️ RealtimeService: Product update received:', payload)
            this.callbacks.onProductUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('🛍️ RealtimeService: Product subscription status:', status)
          this.handleConnectionStatus(status)
        })

      const subscription: RealtimeSubscription = {
        channel,
        unsubscribe: () => {
          console.log('🔌 RealtimeService: Unsubscribing from products...')
          supabase.removeChannel(channel)
          this.subscriptions.delete(channelName)
        }
      }

      this.subscriptions.set(channelName, subscription)
      return subscription
    } catch (error) {
      console.error('❌ RealtimeService: Error subscribing to products:', error)
      return null
    }
  }

  /**
   * Subscribe to category changes
   */
  subscribeToCategories(): RealtimeSubscription | null {
    try {
      console.log('🔄 RealtimeService: Subscribing to category changes...')
      
      const channelName = 'categories'
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'categories'
          },
          (payload) => {
            console.log('📂 RealtimeService: Category update received:', payload)
            this.callbacks.onCategoryUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('📂 RealtimeService: Category subscription status:', status)
          this.handleConnectionStatus(status)
        })

      const subscription: RealtimeSubscription = {
        channel,
        unsubscribe: () => {
          console.log('🔌 RealtimeService: Unsubscribing from categories...')
          supabase.removeChannel(channel)
          this.subscriptions.delete(channelName)
        }
      }

      this.subscriptions.set(channelName, subscription)
      return subscription
    } catch (error) {
      console.error('❌ RealtimeService: Error subscribing to categories:', error)
      return null
    }
  }

  /**
   * Subscribe to promotion changes
   */
  subscribeToPromotions(): RealtimeSubscription | null {
    try {
      console.log('🔄 RealtimeService: Subscribing to promotion changes...')
      
      const channelName = 'promotions'
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'promotions'
          },
          (payload) => {
            console.log('🎉 RealtimeService: Promotion update received:', payload)
            this.callbacks.onPromotionUpdate?.(payload)
          }
        )
        .subscribe((status) => {
          console.log('🎉 RealtimeService: Promotion subscription status:', status)
          this.handleConnectionStatus(status)
        })

      const subscription: RealtimeSubscription = {
        channel,
        unsubscribe: () => {
          console.log('🔌 RealtimeService: Unsubscribing from promotions...')
          supabase.removeChannel(channel)
          this.subscriptions.delete(channelName)
        }
      }

      this.subscriptions.set(channelName, subscription)
      return subscription
    } catch (error) {
      console.error('❌ RealtimeService: Error subscribing to promotions:', error)
      return null
    }
  }

  /**
   * Subscribe to all relevant changes
   */
  subscribeToAll(branchId?: string): Map<string, RealtimeSubscription> {
    console.log('🔄 RealtimeService: Subscribing to all real-time updates...')
    
    const subscriptions = new Map<string, RealtimeSubscription>()
    
    // Subscribe to all channels
    const inventorySub = this.subscribeToInventory(branchId)
    if (inventorySub) subscriptions.set('inventory', inventorySub)
    
    const branchSub = this.subscribeToBranches()
    if (branchSub) subscriptions.set('branches', branchSub)
    
    const productSub = this.subscribeToProducts()
    if (productSub) subscriptions.set('products', productSub)
    
    const categorySub = this.subscribeToCategories()
    if (categorySub) subscriptions.set('categories', categorySub)
    
    const promotionSub = this.subscribeToPromotions()
    if (promotionSub) subscriptions.set('promotions', promotionSub)
    
    console.log(`✅ RealtimeService: Subscribed to ${subscriptions.size} channels`)
    return subscriptions
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    console.log('🔌 RealtimeService: Unsubscribing from all channels...')
    
    this.subscriptions.forEach((subscription, name) => {
      console.log(`🔌 RealtimeService: Unsubscribing from ${name}...`)
      subscription.unsubscribe()
    })
    
    this.subscriptions.clear()
    this.isConnected = false
  }

  /**
   * Handle connection status changes
   */
  private handleConnectionStatus(status: string) {
    const wasConnected = this.isConnected
    
    if (status === 'SUBSCRIBED') {
      this.isConnected = true
      this.reconnectAttempts = 0
      if (!wasConnected) {
        console.log('✅ RealtimeService: Connected to real-time updates')
        this.callbacks.onConnectionStatusChange?.('connected')
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      this.isConnected = false
      console.error('❌ RealtimeService: Connection error:', status)
      this.callbacks.onConnectionStatusChange?.('error')
      this.attemptReconnect()
    } else if (status === 'CLOSED') {
      this.isConnected = false
      console.log('🔌 RealtimeService: Connection closed')
      this.callbacks.onConnectionStatusChange?.('disconnected')
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ RealtimeService: Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 RealtimeService: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`)
    
    setTimeout(() => {
      this.subscribeToAll()
    }, delay)
  }

  /**
   * Set up connection monitoring
   */
  private setupConnectionMonitoring() {
    // Monitor network status
    if ('navigator' in window && 'onLine' in navigator) {
      window.addEventListener('online', () => {
        console.log('🌐 RealtimeService: Network back online, reconnecting...')
        this.subscribeToAll()
      })
      
      window.addEventListener('offline', () => {
        console.log('🌐 RealtimeService: Network offline, disconnecting...')
        this.unsubscribeAll()
      })
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()
