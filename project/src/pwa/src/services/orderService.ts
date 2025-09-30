import { supabase } from './supabase'
import { Order, OrderItem, Customer, Branch } from '../types'

export interface CreateOrderData {
  customer_id?: string
  branch_id: string
  order_type: string
  payment_method: string
  notes?: string
  items: Array<{
    product_id: string
    product_variant_id?: string
    quantity: number
    unit_price: number
    line_total: number
  }>
  customer_info?: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address: string
    city: string
    postal_code: string
  }
}

export interface OrderResponse {
  order: Order
  order_items: OrderItem[]
  customer?: Customer
  branch?: Branch
}

class OrderService {
  async createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
    try {
      // Start a transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: this.generateOrderNumber(),
          customer_id: orderData.customer_id,
          branch_id: orderData.branch_id,
          order_type: orderData.order_type,
          status: 'pending',
          total_amount: orderData.items.reduce((sum, item) => sum + item.line_total, 0),
          subtotal: orderData.items.reduce((sum, item) => sum + item.line_total, 0),
          tax_amount: 0, // Calculate tax if needed
          discount_amount: 0,
          payment_method: orderData.payment_method,
          payment_status: 'pending',
          notes: orderData.notes
        })
        .select(`
          *,
          customer:customers(*),
          branch:branches(*)
        `)
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }))

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select(`
          *,
          product:products(*),
          product_variant:product_variants(*)
        `)

      if (itemsError) throw itemsError

      // Create customer if provided
      let customer = null
      if (orderData.customer_info && !orderData.customer_id) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            customer_code: this.generateCustomerCode(),
            first_name: orderData.customer_info.first_name,
            last_name: orderData.customer_info.last_name,
            email: orderData.customer_info.email,
            phone: orderData.customer_info.phone,
            address: orderData.customer_info.address,
            city: orderData.customer_info.city,
            customer_type: 'guest',
            registration_date: new Date().toISOString(),
            is_active: true,
            total_spent: 0,
            loyalty_points: 0
          })
          .select('*')
          .single()

        if (customerError) throw customerError
        customer = newCustomer

        // Update order with customer ID
        await supabase
          .from('orders')
          .update({ customer_id: newCustomer.id })
          .eq('id', order.id)
      }

      // Update inventory quantities
      for (const item of orderData.items) {
        await this.updateInventory(item.product_id, item.product_variant_id, item.quantity, orderData.branch_id)
      }

      // Track order creation
      await this.trackOrderEvent('order_created', {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        item_count: orderData.items.length
      })

      return {
        order,
        order_items: items || [],
        customer: customer || order.customer,
        branch: order.branch
      }
    } catch (error) {
      console.error('Error creating order:', error)
      throw new Error('Failed to create order')
    }
  }

  async getOrderById(orderId: string): Promise<OrderResponse | null> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          branch:branches(*)
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*),
          product_variant:product_variants(*)
        `)
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      return {
        order,
        order_items: items || [],
        customer: order.customer,
        branch: order.branch
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return null
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<OrderResponse | null> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          branch:branches(*)
        `)
        .eq('order_number', orderNumber)
        .single()

      if (orderError) throw orderError

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(*),
          product_variant:product_variants(*)
        `)
        .eq('order_id', order.id)

      if (itemsError) throw itemsError

      return {
        order,
        order_items: items || [],
        customer: order.customer,
        branch: order.branch
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return null
    }
  }

  async updateOrderStatus(orderId: string, status: string, paymentStatus?: string): Promise<void> {
    try {
      const updateData: any = { status }
      if (paymentStatus) {
        updateData.payment_status = paymentStatus
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      // Track status update
      await this.trackOrderEvent('order_status_updated', {
        order_id: orderId,
        status,
        payment_status: paymentStatus
      })
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error('Failed to update order status')
    }
  }

  private async updateInventory(productId: string, productVariantId: string | undefined, quantity: number, branchId: string): Promise<void> {
    try {
      if (productVariantId) {
        // Update product variant inventory
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity_on_hand: supabase.raw(`quantity_on_hand - ${quantity}`),
            quantity_available: supabase.raw(`quantity_available - ${quantity}`)
          })
          .eq('product_variant_id', productVariantId)
          .eq('branch_id', branchId)

        if (error) throw error
      } else {
        // Update product inventory
        const { error } = await supabase
          .from('inventory')
          .update({
            quantity_on_hand: supabase.raw(`quantity_on_hand - ${quantity}`),
            quantity_available: supabase.raw(`quantity_available - ${quantity}`)
          })
          .eq('product_id', productId)
          .eq('branch_id', branchId)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      throw error
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ORD-${timestamp}-${random}`.toUpperCase()
  }

  private generateCustomerCode(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 3)
    return `CUST-${timestamp}-${random}`.toUpperCase()
  }

  private async trackOrderEvent(eventType: string, eventData: Record<string, any> = {}): Promise<void> {
    try {
      const sessionId = sessionStorage.getItem('agrivet-promo-session') || 'unknown'
      
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
      console.error('Error tracking order event:', error)
    }
  }
}

export const orderService = new OrderService()

