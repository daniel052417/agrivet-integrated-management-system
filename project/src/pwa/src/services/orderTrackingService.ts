import { OrderTracking } from '../types'
import { supabase } from './supabase'
import { getManilaTimestamp, getManilaTimestampWithOffset } from '../utils/dateTime'

interface OrderTrackingServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface CreateTrackingRequest {
  orderId: string
  trackingNumber?: string
  carrier?: string
  currentLocation?: string
  estimatedDelivery?: string
  status?: string
  updateNotes?: string
}

interface CreateTrackingResponse {
  success: boolean
  tracking?: OrderTracking
  trackingId?: string
  error?: string
}

interface UpdateTrackingRequest {
  trackingId: string
  currentLocation?: string
  status?: string
  updateNotes?: string
  actualDelivery?: string
}

class OrderTrackingService {
  private config: OrderTrackingServiceConfig

  constructor(config: OrderTrackingServiceConfig) {
    this.config = config
  }

  /**
   * Create order tracking record
   */
  async createTracking(request: CreateTrackingRequest): Promise<CreateTrackingResponse> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { orderId, trackingNumber, carrier, currentLocation, estimatedDelivery, status, updateNotes } = request

      const trackingData = {
        order_id: orderId,
        tracking_number: trackingNumber || this.generateTrackingNumber(),
        carrier: carrier || 'AgriVet Delivery',
        current_location: currentLocation || 'Preparing',
        estimated_delivery: estimatedDelivery || null,
        status: status || 'pending',
        last_update: getManilaTimestamp(),
        update_notes: updateNotes || null,
        created_at: getManilaTimestamp()
      }

      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .insert(trackingData)
        .select(`
          *,
          order:orders(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to create order tracking: ${error.message}`)
      }

      return {
        success: true,
        tracking,
        trackingId: tracking.id
      }

    } catch (error) {
      console.error('Error creating order tracking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update order tracking
   */
  async updateTracking(request: UpdateTrackingRequest): Promise<{ success: boolean; tracking?: OrderTracking; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { trackingId, currentLocation, status, updateNotes, actualDelivery } = request

      const updateData: any = {
        last_update: getManilaTimestamp()
      }

      if (currentLocation) {
        updateData.current_location = currentLocation
      }

      if (status) {
        updateData.status = status
      }

      if (updateNotes) {
        updateData.update_notes = updateNotes
      }

      if (actualDelivery) {
        updateData.actual_delivery = actualDelivery
      }

      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .update(updateData)
        .eq('id', trackingId)
        .select(`
          *,
          order:orders(*)
        `)
        .single()

      if (error) {
        throw new Error(`Failed to update order tracking: ${error.message}`)
      }

      return {
        success: true,
        tracking
      }

    } catch (error) {
      console.error('Error updating order tracking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tracking by order ID
   */
  async getTrackingByOrder(orderId: string): Promise<{ success: boolean; tracking?: OrderTracking; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('order_id', orderId)
        .single()

      if (error) {
        throw new Error(`Failed to get order tracking: ${error.message}`)
      }

      return {
        success: true,
        tracking
      }

    } catch (error) {
      console.error('Error getting order tracking:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tracking by tracking number
   */
  async getTrackingByNumber(trackingNumber: string): Promise<{ success: boolean; tracking?: OrderTracking; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .select(`
          *,
          order:orders(*)
        `)
        .eq('tracking_number', trackingNumber)
        .single()

      if (error) {
        throw new Error(`Failed to get tracking by number: ${error.message}`)
      }

      return {
        success: true,
        tracking
      }

    } catch (error) {
      console.error('Error getting tracking by number:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update order status in tracking
   */
  async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for Supabase client to be initialized
      if (!supabase) {
        await this.initSupabase()
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get existing tracking record
      const trackingResult = await this.getTrackingByOrder(orderId)
      
      if (!trackingResult.success || !trackingResult.tracking) {
        // Create new tracking record if none exists
        const createResult = await this.createTracking({
          orderId,
          status,
          updateNotes: notes
        })

        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create tracking record')
        }

        return { success: true }
      }

      // Update existing tracking record
      const updateResult = await this.updateTracking({
        trackingId: trackingResult.tracking.id,
        status,
        updateNotes: notes
      })

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update tracking')
      }

      return { success: true }

    } catch (error) {
      console.error('Error updating order status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark order as ready for pickup
   */
  async markOrderReady(orderId: string, estimatedReadyTime?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const readyTime = estimatedReadyTime || getManilaTimestampWithOffset(30 * 60 * 1000) // 30 minutes from now

      return await this.updateOrderStatus(
        orderId,
        'ready',
        `Order is ready for pickup. Estimated ready time: ${new Date(readyTime).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila'
        })}`
      )

    } catch (error) {
      console.error('Error marking order as ready:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Mark order as completed
   */
  async markOrderCompleted(orderId: string, actualDeliveryTime?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deliveryTime = actualDeliveryTime || getManilaTimestamp()

      const trackingResult = await this.getTrackingByOrder(orderId)
      
      if (trackingResult.success && trackingResult.tracking) {
        const updateResult = await this.updateTracking({
          trackingId: trackingResult.tracking.id,
          status: 'delivered',
          actualDelivery: deliveryTime,
          updateNotes: 'Order completed and delivered'
        })

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update tracking')
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error marking order as completed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get tracking status summary
   */
  getTrackingStatusSummary(tracking: OrderTracking): {
    status: string
    statusText: string
    currentLocation: string
    estimatedDelivery: string | null
    isDelivered: boolean
    progress: number
  } {
    const statusMap: { [key: string]: { text: string; progress: number } } = {
      'pending': { text: 'Order Pending', progress: 10 },
      'confirmed': { text: 'Order Confirmed', progress: 20 },
      'preparing': { text: 'Preparing Order', progress: 40 },
      'ready': { text: 'Ready for Pickup', progress: 70 },
      'in_transit': { text: 'In Transit', progress: 80 },
      'out_for_delivery': { text: 'Out for Delivery', progress: 90 },
      'delivered': { text: 'Delivered', progress: 100 },
      'failed': { text: 'Delivery Failed', progress: 0 }
    }

    const statusInfo = statusMap[tracking.status] || { text: 'Unknown Status', progress: 0 }

    return {
      status: tracking.status,
      statusText: statusInfo.text,
      currentLocation: tracking.current_location || 'Unknown',
      estimatedDelivery: tracking.estimated_delivery,
      isDelivered: tracking.status === 'delivered',
      progress: statusInfo.progress
    }
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `TRK-${timestamp.slice(-6)}-${random}`
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!supabase
  }
}

export default OrderTrackingService
