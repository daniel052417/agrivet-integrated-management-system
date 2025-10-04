import { Cart, Order, OrderItem } from '../types'

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

class MockOrderService {
  private config: OrderServiceConfig

  constructor(config: OrderServiceConfig) {
    this.config = config
  }

  /**
   * Check if service is available (always true for mock)
   */
  isAvailable(): boolean {
    return true
  }

  /**
   * Create order (mock implementation)
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('🔄 MockOrderService: Creating order...')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate mock order
      const orderId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const orderNumber = `ORD-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const order: Order = {
        id: orderId,
        orderNumber,
        customerId: request.customerId || null,
        branchId: request.branchId,
        orderType: 'pickup',
        status: 'pending',
        totalAmount: request.cart.total,
        subtotal: request.cart.subtotal,
        taxAmount: request.cart.tax,
        discountAmount: 0,
        paymentMethod: request.paymentMethod,
        paymentStatus: 'pending',
        notes: request.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: request.cart.items.map(item => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          orderId,
          productId: item.product.product_id,
          productUnitId: item.product_unit?.id || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          createdAt: new Date().toISOString(),
          product: item.product,
          productUnit: item.product_unit
        }))
      }

      console.log('✅ MockOrderService: Order created successfully', orderId)
      
      return {
        success: true,
        order,
        orderId
      }
    } catch (error) {
      console.error('❌ MockOrderService: Error creating order:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get order by ID (mock implementation)
   */
  async getOrder(orderId: string): Promise<Order | null> {
    console.log('🔄 MockOrderService: Getting order', orderId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return null for mock (in real implementation, this would fetch from database)
    return null
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
    return {
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      itemCount: order.items.length,
      status: order.status,
      createdAt: order.createdAt
    }
  }
}

export default MockOrderService
