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
  Loader2,
  Truck,
  Home,
  Phone,
  User
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'
import { Order } from '../types'
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
    if (isAuthenticated && user && selectedBranch) {
      loadOrders()
    } else if (!isAuthenticated) {
      setError('Please log in to view your orders')
      setLoading(false)
    } else if (!selectedBranch) {
      setError('Please select a branch to view orders')
      setLoading(false)
    }
  }, [isAuthenticated, user, selectedBranch])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading orders for user:', user?.id)
      
      // Try to load real orders from database
      if (customerOrderService.isAvailable() && user?.id) {
        const result = await customerOrderService.getOrders({
          userId: user.id,
          branchId: selectedBranch?.id,
          limit: 50
        })
        
        console.log('Orders fetch result:', result)
        
        if (result.success && result.orders) {
          // Sort orders: active first, then by date
          const sortedOrders = [...result.orders].sort((a, b) => {
            const aActive = isActiveOrder(a)
            const bActive = isActiveOrder(b)
            
            if (aActive && !bActive) return -1
            if (!aActive && bActive) return 1
            
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          
          setOrders(sortedOrders)
          console.log('Loaded orders:', sortedOrders.length)
          return
        } else {
          console.warn('Failed to load orders:', result.error)
          setError(result.error || 'Failed to load orders')
        }
      }
      
      setOrders([])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string, orderType?: string) => {
    if (orderType === 'delivery') {
      switch (status) {
        case 'pending_confirmation':
          return <Clock className="w-5 h-5 text-yellow-500" />
        case 'confirmed':
          return <CheckCircle className="w-5 h-5 text-blue-500" />
        case 'booked':
          return <Truck className="w-5 h-5 text-purple-500" />
        case 'in_transit':
          return <Truck className="w-5 h-5 text-orange-500 animate-pulse" />
        case 'delivered':
          return <Package className="w-5 h-5 text-green-600" />
        case 'failed':
          return <XCircle className="w-5 h-5 text-red-500" />
        case 'completed':
          return <CheckCircle className="w-5 h-5 text-green-600" />
        case 'cancelled':
          return <XCircle className="w-5 h-5 text-red-500" />
        default:
          return <AlertCircle className="w-5 h-5 text-gray-500" />
      }
    }
    
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

  const getStatusText = (status: string, orderType?: string) => {
    if (orderType === 'delivery') {
      switch (status) {
        case 'pending_confirmation':
          return 'Awaiting Confirmation'
        case 'confirmed':
          return 'Order Confirmed'
        case 'booked':
          return 'Rider Assigned'
        case 'in_transit':
          return 'Out for Delivery'
        case 'delivered':
          return 'Delivered'
        case 'failed':
          return 'Delivery Failed'
        case 'completed':
          return 'Completed'
        case 'cancelled':
          return 'Cancelled'
        default:
          return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    }
    
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
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getStatusColor = (status: string, orderType?: string) => {
    if (orderType === 'delivery') {
      switch (status) {
        case 'pending_confirmation':
          return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        case 'confirmed':
          return 'bg-blue-100 text-blue-800 border border-blue-200'
        case 'booked':
          return 'bg-purple-100 text-purple-800 border border-purple-200'
        case 'in_transit':
          return 'bg-orange-100 text-orange-800 border border-orange-200'
        case 'delivered':
          return 'bg-green-100 text-green-800 border border-green-200'
        case 'failed':
          return 'bg-red-100 text-red-800 border border-red-200'
        case 'completed':
          return 'bg-green-100 text-green-800 border border-green-200'
        case 'cancelled':
          return 'bg-red-100 text-red-800 border border-red-200'
        default:
          return 'bg-gray-100 text-gray-800 border border-gray-200'
      }
    }
    
    switch (status) {
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending_confirmation'
  }

  const isActiveOrder = (order: Order) => {
    const activeStatuses = ['pending_confirmation', 'confirmed', 'ready_for_pickup', 'booked', 'in_transit']
    return activeStatuses.includes(order.status)
  }

  const isCompletedOrder = (order: Order) => {
    const completedStatuses = ['completed', 'delivered', 'cancelled', 'failed']
    return completedStatuses.includes(order.status)
  }

  const getOrderTypeIcon = (orderType: string) => {
    return orderType === 'delivery' ? 
      <Truck className="w-4 h-4 text-blue-500" /> : 
      <Home className="w-4 h-4 text-green-500" />
  }

  const getOrderTypeText = (orderType: string) => {
    return orderType === 'delivery' ? 'Delivery' : 'Pickup'
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return
    }

    try {
      setCancellingOrder(orderId)
      const result = await orderService.cancelOrder(orderId, 'Cancelled by customer')
      
      if (result.success) {
        await loadOrders()
        setShowOrderModal(false)
        setSelectedOrder(null)
      } else {
        alert(result.error || 'Failed to cancel order')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('Failed to cancel order. Please try again.')
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
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
              disabled={loading}
              className="flex items-center space-x-2 text-agrivet-green hover:text-agrivet-green/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="space-y-8">
            {/* Active Orders */}
            {orders.filter(isActiveOrder).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Active Orders
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({orders.filter(isActiveOrder).length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {orders.filter(isActiveOrder).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.order_number}
                            </h3>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              {getOrderTypeIcon(order.order_type)}
                              <span>{getOrderTypeText(order.order_type)}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, order.order_type)}`}>
                              {getStatusText(order.status, order.order_type)}
                            </span>
                            {order.order_type === 'delivery' && order.status === 'in_transit' && (
                              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full flex items-center">
                                <Truck className="w-3 h-3 mr-1 animate-pulse" />
                                Arriving soon
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{formatRelativeTime(order.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 flex-shrink-0" />
                              <span>{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Delivery Information Preview */}
                          {order.order_type === 'delivery' && (
                            <div className="bg-blue-50 rounded-lg p-3 text-sm">
                              <div className="flex items-start space-x-2 mb-2">
                                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 line-clamp-2">{order.delivery_address}</span>
                              </div>
                              {order.delivery_tracking_number && (
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  <Truck className="w-3 h-3" />
                                  <span className="font-mono">{order.delivery_tracking_number}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pickup Information Preview */}
                          {order.order_type === 'pickup' && order.estimated_ready_time && (
                            <div className="bg-green-50 rounded-lg p-3 text-sm flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-gray-700">
                                Ready by {formatDate(order.estimated_ready_time)}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(order.total_amount)}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              • {order.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 ml-4">
                          {canCancelOrder(order) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelOrder(order.id)
                              }}
                              disabled={cancellingOrder === order.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
              </div>
            )}

            {/* Recent/Completed Orders */}
            {orders.filter(isCompletedOrder).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Recent Orders
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({orders.filter(isCompletedOrder).length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {orders.filter(isCompletedOrder).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer opacity-90"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowOrderModal(true)
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.order_number}
                            </h3>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              {getOrderTypeIcon(order.order_type)}
                              <span>{getOrderTypeText(order.order_type)}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, order.order_type)}`}>
                              {getStatusText(order.status, order.order_type)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{formatRelativeTime(order.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 flex-shrink-0" />
                              <span>{order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedOrder.order_number}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
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
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    {getStatusIcon(selectedOrder.status, selectedOrder.order_type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getOrderTypeIcon(selectedOrder.order_type)}
                        <span className="text-sm font-medium text-gray-700">
                          {getOrderTypeText(selectedOrder.order_type)} Order
                        </span>
                      </div>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status, selectedOrder.order_type)}`}>
                        {getStatusText(selectedOrder.status, selectedOrder.order_type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Payment:</span>
                      <p className="text-gray-600 capitalize mt-1">
                        {selectedOrder.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Method:</span>
                      <p className="text-gray-600 capitalize mt-1">
                        {selectedOrder.payment_method}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Status Timeline */}
                {selectedOrder.order_type === 'delivery' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-blue-500" />
                      Delivery Status
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                      {/* Delivery Method & Tracking */}
                      <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-blue-100">
                        <div>
                          <span className="font-medium text-gray-700">Delivery Method:</span>
                          <p className="text-gray-900 capitalize mt-1 font-semibold">
                            {selectedOrder.delivery_method === 'maxim' ? 'Maxim' : selectedOrder.delivery_method || 'Standard'}
                          </p>
                        </div>
                        {selectedOrder.delivery_tracking_number && (
                          <div>
                            <span className="font-medium text-gray-700">Tracking Number:</span>
                            <p className="text-gray-900 font-mono text-xs mt-1 bg-white px-2 py-1 rounded">
                              {selectedOrder.delivery_tracking_number}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <div className="flex items-start space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-700 block mb-1">Delivery Address:</span>
                            <p className="text-gray-900">{selectedOrder.delivery_address}</p>
                          </div>
                        </div>
                        {selectedOrder.delivery_landmark && (
                          <p className="text-sm text-gray-600 ml-6">
                            Landmark: {selectedOrder.delivery_landmark}
                          </p>
                        )}
                      </div>

                      {/* Contact */}
                      {selectedOrder.delivery_contact_number && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Contact:</span>
                          <p className="text-gray-900">{selectedOrder.delivery_contact_number}</p>
                        </div>
                      )}

                      {/* Delivery Fee */}
                      {selectedOrder.delivery_fee && (
                        <div className="pt-3 border-t border-blue-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Delivery Fee:</span>
                            <span className="text-gray-900 font-semibold">
                              {formatPrice(selectedOrder.delivery_fee)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pickup Information */}
                {selectedOrder.order_type === 'pickup' && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-green-500" />
                      Pickup Information
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm space-y-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium text-gray-700 block">Pickup Location:</span>
                            <p className="text-gray-600 mt-1">Visit our store to collect your order</p>
                          </div>
                        </div>
                        {selectedOrder.estimated_ready_time && (
                          <div className="flex items-start space-x-2 pt-3 border-t border-green-100">
                            <Clock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-700 block">Estimated Ready:</span>
                              <p className="text-gray-900 mt-1">
                                {formatDate(selectedOrder.estimated_ready_time)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                          {item.product_sku && (
                            <p className="text-xs text-gray-500 mt-1">SKU: {item.product_sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatPrice(item.line_total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-900">{formatPrice(selectedOrder.tax_amount)}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <span className="text-gray-900">{formatPrice(selectedOrder.delivery_fee)}</span>
                      </div>
                    )}
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-500" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 rounded-lg p-4">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-900 mt-1">{selectedOrder.customer_name}</p>
                    </div>
                    {selectedOrder.customer_email && (
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-900 mt-1">{selectedOrder.customer_email}</p>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>
                        <p className="text-gray-900 mt-1">{selectedOrder.customer_phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-gray-700 text-sm">
                        {selectedOrder.special_instructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Timeline */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order Placed</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                    </div>
                    {selectedOrder.confirmed_at && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                          <p className="text-xs text-gray-500">{formatDate(selectedOrder.confirmed_at)}</p>
                        </div>
                      </div>
                    )}
                    {selectedOrder.completed_at && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedOrder.status === 'delivered' ? 'Delivered' : 'Completed'}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(selectedOrder.completed_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelOrder(selectedOrder.id)
                      }}
                      disabled={cancellingOrder === selectedOrder.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {cancellingOrder === selectedOrder.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Order</span>
                        </>
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