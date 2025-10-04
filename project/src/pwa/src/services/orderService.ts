import { Cart, Order, OrderItem } from '../types'
import PaymentService from './paymentService'
import EmailService from './emailService'
import InventoryService from './inventoryService'
import OrderTrackingService from './orderTrackingService'

interface OrderServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

interface CreateOrderRequest {
  cart: Cart
  customerId?: string
  branchId: string
  paymentMethod: string
  notes?: string
  customerInfo?: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
}

interface CreateOrderResponse {
  success: boolean
  order?: Order
  orderId?: string
  error?: string
}

class OrderService {
  private config: OrderServiceConfig
  private supabase: any = null
  private paymentService: PaymentService
  private emailService: EmailService
  private inventoryService: InventoryService
  private trackingService: OrderTrackingService

  constructor(config: OrderServiceConfig) {
    this.config = config
    this.initSupabase()
    
    // Initialize other services
    this.paymentService = new PaymentService(config)
    this.emailService = new EmailService(config)
    this.inventoryService = new InventoryService(config)
    this.trackingService = new OrderTrackingService(config)
  }

  private async initSupabase() {
    try {
      // Check if we have valid configuration
      if (!this.config.supabaseUrl || !this.config.supabaseAnonKey || 
          this.config.supabaseUrl === 'https://your-project-id.supabase.co' ||
          this.config.supabaseAnonKey === 'your-anon-key-here') {
        console.warn('⚠️ Supabase configuration missing or using placeholder values')
        console.warn('⚠️ Order service will not be available')
        this.supabase = null
        return
      }

      // Dynamically import Supabase client
      const { createClient } = await import('@supabase/supabase-js')
      this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseAnonKey)
      console.log('✅ Supabase client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      this.supabase = null
    }
  }

  /**
   * Create order from cart and persist to Supabase
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { cart, customerId, branchId, paymentMethod, notes, customerInfo } = request

      // Generate order number
      const orderNumber = this.generateOrderNumber()

      // Create order data with additional fields
      const orderData = {
        order_number: orderNumber,
        customer_id: customerId || null,
        branch_id: branchId,
        order_type: 'pickup',
        status: 'pending',
        payment_status: 'pending',
        subtotal: cart.subtotal,
        tax_amount: cart.tax,
        discount_amount: 0,
        total_amount: cart.total,
        payment_method: paymentMethod,
        payment_reference: null,
        payment_notes: notes || null,
        estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        is_guest_order: !customerId,
        customer_name: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : null,
        customer_email: customerInfo?.email || null,
        customer_phone: customerInfo?.phone || null,
        special_instructions: notes || null,
        confirmed_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      // Create order items with unit information
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.product.product_id,
        product_unit_id: item.product_unit?.id || null,
        quantity: item.quantity, // Quantity in selected unit
        base_unit_quantity: item.base_unit_quantity, // Quantity in base units for inventory
        unit_price: item.product_unit?.price_per_unit || item.unitPrice,
        line_total: item.lineTotal,
        product_name: item.product.name,
        product_sku: item.product.sku,
        unit_name: item.product_unit?.unit_name || item.product.unit_name,
        unit_label: item.product_unit?.unit_label || item.product.unit_label,
        weight: item.weight || null,
        expiry_date: item.expiryDate || null,
        batch_number: item.batchNumber || null,
        notes: item.notes || null,
        created_at: new Date().toISOString()
      }))

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        // Rollback order if items fail
        await this.supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      // Deduct inventory using the new inventory service
      if (this.inventoryService.isAvailable()) {
        const inventoryResult = await this.inventoryService.deductInventoryForOrder(
          order.id,
          cart.items.map(item => ({
            productId: item.product.product_id,
            productUnitId: item.product_unit?.id || '',
            quantity: item.quantity,
            baseUnitQuantity: item.base_unit_quantity
          })),
          branchId,
          'system'
        )

        if (!inventoryResult.success) {
          console.error('Error deducting inventory:', inventoryResult.error)
          // Note: We don't rollback here as the order is already created
          // In production, you might want to implement a compensation transaction
        }
      } else {
        console.warn('Inventory service not available, skipping inventory deduction')
      }

      // If customer info provided but no customer ID, create customer record
      if (customerInfo && !customerId) {
        const customerData = {
          customer_code: this.generateCustomerCode(),
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          email: customerInfo.email || null,
          phone: customerInfo.phone || null,
          customer_type: 'walk_in',
          registration_date: new Date().toISOString(),
          is_active: true,
          total_spent: cart.total,
          last_purchase_date: new Date().toISOString(),
          loyalty_points: 0,
          loyalty_tier: 'bronze',
          total_lifetime_spent: cart.total,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: customer, error: customerError } = await this.supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single()

        if (!customerError && customer) {
          // Update order with customer ID
          await this.supabase
            .from('orders')
            .update({ customer_id: customer.id })
            .eq('id', order.id)
        }
      }

      // Process payment
      if (this.paymentService.isAvailable()) {
        try {
          const paymentResult = await this.paymentService.simulatePayment(
            order.id,
            paymentMethod,
            cart.total
          )

          if (paymentResult.success && paymentResult.payment) {
            // Update order payment status
            await this.updateOrderStatus(order.id, 'confirmed', 'paid')
          }
        } catch (error) {
          console.error('Error processing payment:', error)
        }
      }

      // Create order tracking
      if (this.trackingService.isAvailable()) {
        try {
          await this.trackingService.createTracking({
            orderId: order.id,
            status: 'confirmed',
            updateNotes: 'Order confirmed and payment processed'
          })
        } catch (error) {
          console.error('Error creating order tracking:', error)
        }
      }

      // Send email notification
      if (this.emailService.isAvailable() && customerInfo?.email) {
        try {
          await this.emailService.sendOrderConfirmation(
            order.id,
            customerInfo.email,
            `${customerInfo.firstName} ${customerInfo.lastName}`,
            {
              orderNumber: order.order_number,
              orderTotal: cart.total,
              customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
              orderDate: new Date().toLocaleDateString(),
              branchName: 'AgriVet Branch', // You might want to fetch this from the branch
              estimatedReadyTime: order.estimated_ready_time
            }
          )
        } catch (error) {
          console.error('Error sending order confirmation email:', error)
        }
      }

      return {
        success: true,
        order,
        orderId: order.id
      }

    } catch (error) {
      console.error('Error creating order:', error)
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: order, error } = await this.supabase
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (paymentStatus) {
        updateData.payment_status = paymentStatus
      }

      // Add timestamp fields based on status
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        throw new Error(`Failed to update order: ${error.message}`)
      }

      // Update order tracking
      if (this.trackingService.isAvailable()) {
        try {
          await this.trackingService.updateOrderStatus(orderId, status, `Order status updated to ${status}`)
        } catch (error) {
          console.error('Error updating order tracking:', error)
        }
      }

      // Send email notifications based on status
      if (this.emailService.isAvailable()) {
        try {
          const orderResult = await this.getOrder(orderId)
          if (orderResult.success && orderResult.order) {
            const order = orderResult.order
            
            if (status === 'ready' && order.customer_email) {
              await this.emailService.sendOrderReady(
                orderId,
                order.customer_email,
                order.customer_name || 'Customer',
                {
                  orderNumber: order.order_number,
                  orderTotal: order.total_amount,
                  customerName: order.customer_name || 'Customer',
                  branchName: 'AgriVet Branch',
                  estimatedReadyTime: order.estimated_ready_time
                }
              )
            } else if (status === 'cancelled' && order.customer_email) {
              await this.emailService.sendOrderCancellation(
                orderId,
                order.customer_email,
                order.customer_name || 'Customer',
                {
                  orderNumber: order.order_number,
                  orderTotal: order.total_amount,
                  customerName: order.customer_name || 'Customer'
                }
              )
            }
          }
        } catch (error) {
          console.error('Error sending status email:', error)
        }
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
  async markOrderReady(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update order status
      const statusResult = await this.updateOrderStatus(orderId, 'ready')
      
      if (!statusResult.success) {
        return statusResult
      }

      // Update tracking
      if (this.trackingService.isAvailable()) {
        await this.trackingService.markOrderReady(orderId)
      }

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
  async markOrderCompleted(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update order status
      const statusResult = await this.updateOrderStatus(orderId, 'completed')
      
      if (!statusResult.success) {
        return statusResult
      }

      // Update tracking
      if (this.trackingService.isAvailable()) {
        await this.trackingService.markOrderCompleted(orderId)
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
   * Cancel order and restore inventory
   */
  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get order details
      const orderResult = await this.getOrder(orderId)
      if (!orderResult.success || !orderResult.order) {
        throw new Error('Order not found')
      }

      const order = orderResult.order

      // Restore inventory if available
      if (this.inventoryService.isAvailable() && order.order_items) {
        const inventoryResult = await this.inventoryService.restoreInventoryForOrder(
          orderId,
          order.order_items.map(item => ({
            productId: item.product_id,
            productUnitId: item.product_unit_id || '',
            quantity: item.quantity,
            baseUnitQuantity: item.base_unit_quantity || item.quantity
          })),
          order.branch_id,
          'system'
        )

        if (!inventoryResult.success) {
          console.error('Error restoring inventory:', inventoryResult.error)
        }
      }

      // Update order status
      const statusResult = await this.updateOrderStatus(orderId, 'cancelled')
      
      if (!statusResult.success) {
        return statusResult
      }

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
   * Generate unique customer code
   */
  private generateCustomerCode(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substr(2, 3).toUpperCase()
    return `CUST-${timestamp.slice(-6)}-${random}`
  }

  /**
   * Check if Supabase is available
   */
  isAvailable(): boolean {
    return !!this.supabase
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