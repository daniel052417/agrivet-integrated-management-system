import { Cart, Order } from '../types'
import { supabase } from './supabase'
import PaymentService from './paymentService'
import EmailService from './emailService'
import InventoryService from './inventoryService'
import OrderTrackingService from './orderTrackingService'
import NewOrderAlertService from '../../../lib/alerts/newOrderAlertService'
import { formatManilaDate, getManilaTimestamp, getManilaTimestampWithOffset } from '../utils/dateTime'

interface OrderServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface CreateOrderRequest {
  cart: Cart
  customerId?: string
  branchId: string
  paymentMethod: string
  paymentReference?: string // GCash reference number
  paymentProof?: File // Payment proof screenshot
  notes?: string
  customerInfo?: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  // Delivery fields
  orderType?: 'pickup' | 'delivery'
  deliveryMethod?: 'maxim' | 'other'
  deliveryAddress?: string
  deliveryContactNumber?: string
  deliveryLandmark?: string
  deliveryStatus?: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed'
  deliveryLatitude?: number
  deliveryLongitude?: number
}

interface CreateOrderResponse {
  success: boolean
  order?: Order
  orderId?: string
  error?: string
}

class OrderService {
  private paymentService: PaymentService
  private emailService: EmailService
  private inventoryService: InventoryService
  private trackingService: OrderTrackingService

  constructor(config: OrderServiceConfig) {
    this.paymentService = new PaymentService(config)
    this.emailService = new EmailService(config)
    this.inventoryService = new InventoryService(config)
    this.trackingService = new OrderTrackingService(config)
  }


  /**
   * Create PWA order (pending confirmation from POS)
   * Does NOT deduct inventory or process payment
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('🔧 OrderService: Starting createOrder...')
      console.log('🔧 OrderService: Supabase client:', !!supabase)
      
      if (!supabase) {
        console.error('❌ OrderService: Supabase client not initialized')
        throw new Error('Supabase client not initialized')
      }

      const { 
        cart, 
        customerId, 
        branchId, 
        paymentMethod,
        paymentReference,
        paymentProof,
        notes, 
        customerInfo,
        orderType = 'pickup',
        deliveryMethod,
        deliveryAddress,
        deliveryContactNumber,
        deliveryLandmark,
        deliveryStatus,
        deliveryLatitude,
        deliveryLongitude
      } = request

      // Generate order number
      const orderNumber = this.generateOrderNumber()

      // Get current user ID from Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      const currentUserId = user?.id || null

      console.log('Current user ID:', currentUserId)
      console.log('Customer email:', customerInfo?.email)

      // Get or use existing customer_id from customers table
      let finalCustomerId = customerId

      // If user is authenticated but no customerId provided, look up their customer record
      if (currentUserId && !finalCustomerId) {
        console.log('Looking up customer for user_id:', currentUserId)
        
        const { data: existingCustomer, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id, email')
          .eq('user_id', currentUserId)
          .single()
        
        console.log('Customer lookup result:', { existingCustomer, customerError })
        
        if (existingCustomer && !customerError) {
          finalCustomerId = existingCustomer.id
          console.log('Found existing customer:', finalCustomerId)
        } else {
          console.warn('No customer record found for user_id:', currentUserId, 'Error:', customerError)
          finalCustomerId = undefined
        }
      } else if (customerId) {
        console.log('Using provided customerId:', customerId)
      }
      
      console.log('Final customer_id for order:', finalCustomerId)

      console.log('Creating order with customer_id:', finalCustomerId)

      // Prepare order data
      const orderData = {
        order_number: orderNumber,
        customer_id: finalCustomerId || null,
        branch_id: branchId,
        order_type: orderType,
        status: 'pending_confirmation',
        payment_status: paymentMethod === 'gcash' ? 'pending_verification' : 'pending',
        subtotal: cart.subtotal,
        tax_amount: cart.tax,
        discount_amount: 0,
        total_amount: cart.total,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        payment_notes: notes || null,
        estimated_ready_time: orderType === 'pickup' ? getManilaTimestampWithOffset(30 * 60 * 1000) : null,
        is_guest_order: !finalCustomerId,
        customer_name: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : null,
        customer_email: customerInfo?.email || null,
        customer_phone: customerInfo?.phone || null,
        special_instructions: notes || null,
        notes: notes || null,
        // Delivery fields
        delivery_method: deliveryMethod || null,
        delivery_address: deliveryAddress || null,
        delivery_contact_number: deliveryContactNumber || null,
        delivery_landmark: deliveryLandmark || null,
        delivery_status: deliveryStatus || null,
        confirmed_at: null,
        completed_at: null,
        created_at: getManilaTimestamp(),
        updated_at: getManilaTimestamp(),
        delivery_latitude: deliveryLatitude || null,
        delivery_longitude: deliveryLongitude || null,
      }

      // Direct insert into orders table
      console.log('🔧 OrderService: Inserting order data:', JSON.stringify(orderData, null, 2))
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('❌ OrderService: Order creation error:', orderError)
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log('✅ OrderService: Order created successfully:', order.id, 'with customer_id:', order.customer_id)

      // Send new order alert
      try {
        await NewOrderAlertService.sendNewOrderAlert(order.id);
      } catch (alertError) {
        // Don't fail order creation if alert fails
        console.warn('Failed to send new order alert:', alertError);
      }

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product.product_id,
        product_unit_id: item.product_unit?.id || null,
        quantity: item.quantity,
        base_unit_quantity: item.base_unit_quantity,
        unit_price: item.product_unit?.price_per_unit || item.unitPrice,
        line_total: item.lineTotal,
        product_name: item.product.name,
        product_sku: item.product.sku,
        unit_name: item.product_unit?.unit_name || 'piece',
        unit_label: item.product_unit?.unit_label || 'Piece',
        weight: item.weight || null,
        expiry_date: item.expiryDate || null,
        batch_number: item.batchNumber || null, 
        notes: item.notes || null,
        created_at: getManilaTimestamp()
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        // Rollback order if items fail
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      // Upload payment proof if provided (for GCash payments)
      if (paymentProof && paymentMethod === 'gcash') {
  try {
    console.log('📸 Uploading payment proof...')
    const fileExt = paymentProof.name.split('.').pop()
    const fileName = `${order.id}_${Date.now()}.${fileExt}`
    
    // ✅ STEP 1: Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, paymentProof, {
        contentType: paymentProof.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('⚠️ Failed to upload payment proof:', uploadError)
    } else {
      console.log('✅ Payment proof uploaded:', uploadData.path)
      
      // ✅ STEP 2: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)
      
      // ✅ STEP 3: Update orders table with the URL
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_proof_url: publicUrl,  // ✅ Saved to payment_proof_url column
          updated_at: getManilaTimestamp()
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('⚠️ Failed to update order with payment proof URL:', updateError)
      } else {
        console.log('✅ Order updated with payment proof URL')
        order.payment_proof_url = publicUrl
      }
    }
  } catch (error) {
    console.error('⚠️ Error handling payment proof:', error)
  }
}

      // Create soft inventory reservations (optional - for display purposes only)
      try {
        await this.createSoftReservations(order.id, branchId, cart.items)
      } catch (error) {
        console.warn('Could not create soft reservations:', error)
        // Non-critical, continue
      }

      // Send order notification (not confirmation yet)
      if (customerInfo?.email) {
        try {
          const emailMessage = paymentMethod === 'gcash' 
            ? 'Your order has been received and is awaiting payment verification from our staff. We will confirm your order once the payment is verified.'
            : 'Your order has been received and is awaiting confirmation from our staff.'

          await this.emailService.sendOrderConfirmation(
            order.id,
            customerInfo.email,
            `${customerInfo.firstName} ${customerInfo.lastName}`,
            {
              orderNumber: order.order_number,
              orderTotal: cart.total,
              customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
              orderDate: formatManilaDate(new Date()),
              branchName: 'Tiongson Agrivet',
              message: emailMessage,
              paymentMethod: paymentMethod,
              paymentReference: paymentReference || undefined
            }
          )
        } catch (error) {
          console.error('Error sending order received email:', error)
        }
      }

      return {
        success: true,
        order,
        orderId: order.id
      }

    } catch (error) {
      console.error('❌ OrderService: Error creating order:', error)
      console.error('❌ OrderService: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create soft inventory reservations (for display only, not actual deduction)
   */
  private async createSoftReservations(orderId: string, branchId: string, items: any[]) {
    const reservations = items.map(item => ({
      order_id: orderId,
      product_id: item.product.product_id,
      branch_id: branchId,
      quantity_reserved: item.base_unit_quantity || item.quantity,
      reserved_until: getManilaTimestampWithOffset(24 * 60 * 60 * 1000),
      status: 'pending',
      created_at: getManilaTimestamp()
    }))

    await supabase
      .from('inventory_reservations')
      .insert(reservations)
  }

  /**
   * Confirm order in POS (staff action)
   * THIS is where inventory deduction and payment recording happens
   */
  async confirmOrderInPOS(orderId: string, staffUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get order details
      const orderResult = await this.getOrder(orderId)
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Order not found')
      }

      const order = orderResult.order

      // 1. Deduct inventory (with staff user_id)
      if (order.order_items) {
        const inventoryResult = await this.inventoryService.deductInventoryForOrder(
          orderId,
          order.order_items.map(item => ({
            productId: item.product_id,
            productUnitId: item.product_unit_id || '',
            quantity: item.quantity,
            baseUnitQuantity: item.base_unit_quantity || item.quantity
          })),
          order.branch_id,
          staffUserId
        )

        if (!inventoryResult.success) {
          throw new Error(`Inventory deduction failed: ${inventoryResult.error}`)
        }
      }

      // 2. Process payment (with staff user_id)
      if (order.payment_method === 'cash') {
        const paymentResult = await this.paymentService.processCashPayment(
          order.id,
          order.total_amount,
          staffUserId
        )

        if (!paymentResult.success) {
          throw new Error(`Payment processing failed: ${paymentResult.error}`)
        }
      } else if (order.payment_method === 'gcash') {
        console.log('💳 Verifying GCash payment...')
        
        if (!order.payment_reference) {
          throw new Error('GCash reference number is required')
        }

        // Record the GCash payment as verified
        const paymentResult = await this.paymentService.processGCashPayment(
          order.id,
          order.total_amount,
          order.payment_reference,
          staffUserId
        )

        if (!paymentResult.success) {
          throw new Error(`GCash payment verification failed: ${paymentResult.error}`)
        }

        console.log('✅ GCash payment verified')
      }

      // 3. Update order status to confirmed
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'verified',
          confirmed_at: getManilaTimestamp(),
          confirmed_by: staffUserId,
          updated_at: getManilaTimestamp()
        })
        .eq('id', orderId)

      // 4. Update soft reservations to confirmed
      await supabase
        .from('inventory_reservations')
        .update({ status: 'confirmed' })
        .eq('order_id', orderId)

      // 5. Create order tracking
      await this.trackingService.createTracking({
        orderId: order.id,
        status: 'confirmed',
        updateNotes: order.payment_method === 'gcash' 
          ? 'Order confirmed by staff. GCash payment verified.'
          : 'Order confirmed by staff. Payment processed.'
      })

      // 6. Send confirmation email
      if (order.customer_email) {
        await this.emailService.sendOrderConfirmation(
          order.id,
          order.customer_email,
          order.customer_name || 'Customer',
          {
            orderNumber: order.order_number,
            orderTotal: order.total_amount,
            customerName: order.customer_name || 'Customer',
            orderDate: formatManilaDate(order.created_at),
            branchName: 'Tiongson Agrivet',
            estimatedReadyTime: order.estimated_ready_time,
            paymentMethod: order.payment_method,
            paymentReference: order.payment_reference || undefined
          }
        )
      }

      return { success: true }

    } catch (error) {
      console.error('Error confirming order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reject order in POS (staff action)
   */
  async rejectOrderInPOS(orderId: string, staffUserId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const orderResult = await this.getOrder(orderId)
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Order not found')
      }

      const order = orderResult.order

      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: getManilaTimestamp(),
          cancelled_by: staffUserId,
          special_instructions: `${order.special_instructions || ''}\n\nREJECTED: ${reason}`,
          updated_at: getManilaTimestamp()
        })
        .eq('id', orderId)

      await supabase
        .from('inventory_reservations')
        .update({ status: 'released' })
        .eq('order_id', orderId)

      await this.trackingService.createTracking({
        orderId: order.id,
        status: 'cancelled',
        updateNotes: `Order rejected by staff. Reason: ${reason}`
      })

      if (order.customer_email) {
        await this.emailService.sendOrderCancellation(
          order.id,
          order.customer_email,
          order.customer_name || 'Customer',
          {
            orderNumber: order.order_number,
            orderTotal: order.total_amount,
            customerName: order.customer_name || 'Customer',
            reason: reason
          }
        )
      }

      return { success: true }

    } catch (error) {
      console.error('Error rejecting order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Reject GCash payment (staff action)
   */
  async rejectGCashPayment(
    orderId: string, 
    staffUserId: string, 
    rejectionReason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const orderResult = await this.getOrder(orderId)
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Order not found')
      }

      const order = orderResult.order

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          cancellation_reason: `GCash payment rejected: ${rejectionReason}`,
          cancelled_at: getManilaTimestamp(),
          cancelled_by: staffUserId,
          updated_at: getManilaTimestamp()
        })
        .eq('id', orderId)

      // Release inventory reservations
      await supabase
        .from('inventory_reservations')
        .update({ status: 'released' })
        .eq('order_id', orderId)

      // Create tracking
      await this.trackingService.createTracking({
        orderId: order.id,
        status: 'cancelled',
        updateNotes: `GCash payment rejected by staff. Reason: ${rejectionReason}`
      })

      // Send email notification
      if (order.customer_email) {
      await this.emailService.sendOrderCancellation(
        order.id,
        order.customer_email,
        order.customer_name || 'Customer',
        {
          orderNumber: order.order_number,
          orderTotal: order.total_amount,
          customerName: order.customer_name || 'Customer',
          reason: `Payment Verification Failed: ${rejectionReason}. Reference Number: ${order.payment_reference || 'N/A'}`
        }
      )
    }

      return { success: true }

    } catch (error) {
      console.error('Error rejecting GCash payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          branch:branches(*),
          order_items:order_items(
            *,
            product:products(*),
            product_unit:product_units(*)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        throw new Error(`Failed to get order: ${error.message}`)
      }

      return {
        success: true,
        order
      }

    } catch (error) {
      console.error('Error getting order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, paymentStatus?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const updateData: any = {
        status,
        updated_at: getManilaTimestamp()
      }

      if (paymentStatus) {
        updateData.payment_status = paymentStatus
      }

      if (status === 'ready_for_pickup') {
        updateData.ready_at = getManilaTimestamp()
      } else if (status === 'completed') {
        updateData.completed_at = getManilaTimestamp()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        throw new Error(`Failed to update order: ${error.message}`)
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
  async markOrderReady(orderId: string, staffUserId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateOrderStatus(orderId, 'ready_for_pickup')
      await this.trackingService.markOrderReady(orderId, staffUserId)

      return { success: true }

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
  async markOrderCompleted(orderId: string, staffUserId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateOrderStatus(orderId, 'completed')
      await this.trackingService.markOrderCompleted(orderId, staffUserId)

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
   * Cancel order (customer-initiated before confirmation)
   */
  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const orderResult = await this.getOrder(orderId)
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Order not found')
      }

      const order = orderResult.order

      if (order.status !== 'pending_confirmation') {
        throw new Error('Order has already been confirmed and cannot be cancelled')
      }

      await supabase
        .from('inventory_reservations')
        .update({ status: 'released' })
        .eq('order_id', orderId)

      await this.updateOrderStatus(orderId, 'cancelled')

      return { success: true }

    } catch (error) {
      console.error('Error cancelling order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `ORD-${timestamp.slice(-6)}-${random}`
  }

  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return !!supabase
  }

  /**
   * Get order summary for display
   */
  getOrderSummary(order: Order): {
    orderNumber: string
    total: number
    itemCount: number
    status: string
    createdAt: string
  } {
    const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0

    return {
      orderNumber: order.order_number,
      total: order.total_amount,
      itemCount,
      status: order.status,
      createdAt: order.created_at
    }
  }
}

export default OrderService