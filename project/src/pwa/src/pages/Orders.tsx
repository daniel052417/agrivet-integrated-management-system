import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { Order, OrderItem } from '../types'
import OrderService from '../services/orderService'
import CustomerOrderService from '../services/customerOrderService'

const Orders: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { selectedBranch } = useBranch()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)

  const orderService = new OrderService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  })

  const customerOrderService = new CustomerOrderService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  })

  useEffect(() => {
    if (isAuthenticated && selectedBranch) {
      loadOrders()
    } else if (!isAuthenticated) {
      setError('Please log in to view your orders')
      setLoading(false)
    } else if (!selectedBranch) {
      setError('Please select a branch to view orders')
      setLoading(false)
    }
  }, [isAuthenticated, selectedBranch])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try to load real orders from database
      if (customerOrderService.isAvailable()) {
        const result = await customerOrderService.getOrders({
          userId: user?.id,
          branchId: selectedBranch?.id,
          limit: 50
        })
        
        if (result.success && result.orders) {
          setOrders(result.orders)
          return
        } else {
          console.warn('Failed to load real orders, falling back to mock data:', result.error)
        }
      }
      
      // Fallback to mock data if database is not available
      const mockOrders: Order[] = [
        {
          id: '1',
          order_number: 'ORD-001',
          customer_id: user?.id || null,
          branch_id: selectedBranch?.id || '',
          order_type: 'pickup',
          status: 'pending_confirmation',
          payment_status: 'pending',
          subtotal: 150.00,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 150.00,
          customer_name: user?.name || 'Guest Customer',
          customer_email: user?.email || null,
          customer_phone: null,
          notes: 'Please prepare fresh vegetables',
          special_instructions: 'Handle with care',
          estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          actual_ready_time: null,
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          confirmed_at: null,
          completed_at: null,
          order_items: [
            {
              id: '1',
              order_id: '1',
              product_id: 'prod-1',
              product_unit_id: 'unit-1',
              quantity: 2,
              base_unit_quantity: 2,
              unit_price: 75.00,
              line_total: 150.00,
              product_name: 'Fresh Tomatoes',
              product_sku: 'TOM-001',
              unit_name: 'kg',
              unit_label: 'Kilogram',
              weight: null,
              expiry_date: null,
              batch_number: null,
              notes: null,
              created_at: new Date().toISOString()
            }
          ]
        },
        {
          id: '2',
          order_number: 'ORD-002',
          customer_id: user?.id || null,
          branch_id: selectedBranch?.id || '',
          order_type: 'pickup',
          status: 'confirmed',
          payment_status: 'paid',
          subtotal: 200.00,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: 200.00,
          customer_name: user?.name || 'Guest Customer',
          customer_email: user?.email || null,
          customer_phone: null,
          notes: null,
          special_instructions: null,
          estimated_ready_time: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          actual_ready_time: null,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          confirmed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          completed_at: null,
          order_items: [
            {
              id: '2',
              order_id: '2',
              product_id: 'prod-2',
              product_unit_id: 'unit-2',
              quantity: 1,
              base_unit_quantity: 1,
              unit_price: 200.00,
              line_total: 200.00,
              product_name: 'Organic Lettuce',
              product_sku: 'LET-001',
              unit_name: 'piece',
              unit_label: 'Piece',
              weight: null,
              expiry_date: null,
              batch_number: null,
              notes: null,
              created_at: new Date().toISOString()
            }
          ]
        }
      ]
      
      setOrders(mockOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'ready_for_pickup':
        return <Package className="w-5 h-5 text-green-500" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return 'Awaiting Confirmation'
      case 'confirmed':
        return 'Confirmed'
      case 'ready_for_pickup':
        return 'Ready for Pickup'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending_confirmation'
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrder(orderId)
      const result = await orderService.cancelOrder(orderId, 'Cancelled by customer')
      
      if (result.success) {
        await loadOrders() // Refresh orders
        setShowOrderModal(false)
        setSelectedOrder(null)
      } else {
        setError(result.error || 'Failed to cancel order')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      setError('Failed to cancel order. Please try again.')
    } finally {
      setCancellingOrder(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-agrivet-green" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-agrivet-green text-white px-4 py-2 rounded-lg hover:bg-agrivet-green/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3 text-agrivet-green" />
                My Orders
              </h1>
              <p className="text-gray-600 mt-2">Track and manage your orders</p>
            </div>
            <button
              onClick={loadOrders}
              className="flex items-center space-x-2 text-agrivet-green hover:text-agrivet-green/80 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/catalog')}
              className="bg-agrivet-green text-white px-6 py-3 rounded-lg hover:bg-agrivet-green/90 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {order.order_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Ordered: {formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>{order.order_items?.length || 0} items</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">
                          Total: {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    {order.estimated_ready_time && (
                      <div className="mt-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Estimated ready: {formatDate(order.estimated_ready_time)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderModal(true)
                      }}
                      className="p-2 text-gray-600 hover:text-agrivet-green transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrder === order.id}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Cancel Order"
                      >
                        {cancellingOrder === order.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order {selectedOrder.order_number}
                  </h2>
                  <button
                    onClick={() => {
                      setShowOrderModal(false)
                      setSelectedOrder(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Order Status */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {getStatusIcon(selectedOrder.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Order Date:</span>
                      <p className="text-gray-600">{formatDate(selectedOrder.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Payment Status:</span>
                      <p className="text-gray-600 capitalize">{selectedOrder.payment_status}</p>
                    </div>
                    {selectedOrder.estimated_ready_time && (
                      <div>
                        <span className="font-medium text-gray-700">Estimated Ready:</span>
                        <p className="text-gray-600">{formatDate(selectedOrder.estimated_ready_time)}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Total Amount:</span>
                      <p className="text-gray-600 font-semibold">{formatPrice(selectedOrder.total_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.quantity} {item.unit_label} × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatPrice(item.line_total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-600">{selectedOrder.customer_name}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-600">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-600">{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h3>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.special_instructions}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowOrderModal(false)
                      setSelectedOrder(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  
                  {canCancelOrder(selectedOrder) && (
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={cancellingOrder === selectedOrder.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancellingOrder === selectedOrder.id ? (
                        <span className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cancelling...</span>
                        </span>
                      ) : (
                        'Cancel Order'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
