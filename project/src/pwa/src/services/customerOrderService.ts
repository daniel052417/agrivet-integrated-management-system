import { Order, OrderItem } from '../types/index'
import { supabase } from './supabase'

export interface CustomerOrderServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface GetOrdersRequest {
  userId?: string
  branchId?: string
  status?: string
  limit?: number
  offset?: number
}

export interface GetOrdersResponse {
  success: boolean
  orders?: Order[]
  error?: string
  total?: number
}

class CustomerOrderService {
  private config: CustomerOrderServiceConfig

  constructor(config: CustomerOrderServiceConfig) {
    this.config = config
  }

  /**
   * Get orders for a customer using the optimized database function
   */
  async getOrders(request: GetOrdersRequest): Promise<GetOrdersResponse> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not initialized'
        }
      }

      // Get the authenticated user's ID
      let userId = request.userId

      // If not provided, get from logged-in user
      if (!userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (user) {
          userId = user.id
          console.log('🔑 Auth user id:', userId)
        } else {
          console.warn('⚠️ No authenticated user found')
        }
      }

      // Use the optimized database function with user_id
          const { data: orders, error } = await supabase
        .rpc('get_customer_orders', {
          p_user_id: userId || null,
          p_branch_id: request.branchId || null,
          p_status: request.status || null,
          p_limit: request.limit || 50,
          p_offset: request.offset || 0
        }) as unknown as { data: Order[] | null; error: any }

      if (error) {
        console.error('Error fetching orders:', error)
        
        return {
          success: false,
          error: `Failed to fetch orders: ${error.message}`
          
        }
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order: Order) => {
          const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              order_id,
              product_id,
              product_unit_id,
              quantity,
              base_unit_quantity,
              unit_price,
              line_total,
              product_name,
              product_sku,
              unit_name,
              unit_label,
              weight,
              expiry_date,
              batch_number,
              notes,
              created_at
            `)
            .eq('order_id', order.id)
            .order('created_at', { ascending: true })

          if (itemsError) {
            console.warn(`Error fetching items for order ${order.id}:`, itemsError)
          }

          return {
            ...order,
            order_items: orderItems || []
          }
        })
      )

      return {
        success: true,
        orders: ordersWithItems,
        total: orders?.length || 0
      }
    } catch (error) {
      console.error('Error in getOrders:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get a single order by ID using the optimized database function
   */
  async getOrder(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not initialized'
        }
      }

      // Use the optimized function to get order with items
      // 2️⃣ Fetch single order
          const { data: result, error } = (await supabase.rpc('get_order_with_items', {
        p_order_id: orderId
      })) as unknown as {
        data: { order_data: Order; order_items: OrderItem[] }[] | null
        error: any
      }


      if (error) {
        console.error('Error fetching order:', error)
        return {
          success: false,
          error: `Failed to fetch order: ${error.message}`
        }
      }

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      const orderData = result[0].order_data
      const orderItems = result[0].order_items

      const order: Order = {
        ...orderData,
        order_items: orderItems
      }

      return {
        success: true,
        order
      }
    } catch (error) {
      console.error('Error in getOrder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get orders by customer email (for guest orders)
   */
  async getOrdersByEmail(email: string, branchId?: string): Promise<GetOrdersResponse> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not initialized'
        }
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            product_unit_id,
            quantity,
            base_unit_quantity,
            unit_price,
            line_total,
            product_name,
            product_sku,
            unit_name,
            unit_label,
            weight,
            expiry_date,
            batch_number,
            notes,
            created_at
          )
        `)
        .eq('customer_email', email)
        .order('created_at', { ascending: false })

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data: orders, error } = await query

      if (error) {
        console.error('Error fetching orders by email:', error)
        return {
          success: false,
          error: `Failed to fetch orders: ${error.message}`
        }
      }

      return {
        success: true,
        orders: orders || []
      }
    } catch (error) {
      console.error('Error in getOrdersByEmail:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get order statistics for a customer
   */
  async getOrderStats(customerId?: string, customerEmail?: string, branchId?: string): Promise<{
    success: boolean
    stats?: {
      totalOrders: number
      pendingOrders: number
      completedOrders: number
      cancelledOrders: number
      totalSpent: number
    }
    error?: string
  }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not initialized'
        }
      }

      let query = supabase
        .from('orders')
        .select('status, total_amount')

      if (customerId) {
        query = query.eq('customer_id', customerId)
      } else if (customerEmail) {
        query = query.eq('customer_email', customerEmail)
      }

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data: orders, error } = await query

      if (error) {
        console.error('Error fetching order stats:', error)
        return {
          success: false,
          error: `Failed to fetch order stats: ${error.message}`
        }
      }

      const stats = {
        totalOrders: orders?.length || 0,
        pendingOrders: orders?.filter(o => ['pending_confirmation', 'confirmed'].includes(o.status)).length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
        cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
        totalSpent: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      }

      return {
        success: true,
        stats
      }
    } catch (error) {
      console.error('Error in getOrderStats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!supabase
  }
}

export default CustomerOrderService
