import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Download, Home, ShoppingBag, Clock, MapPin, Phone } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'

interface OrderDetails {
  orderId: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed'
  orderType: 'pickup' | 'delivery'
  estimatedReadyTime?: string
  totalAmount: number
  paymentMethod: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  customerInfo: {
    name: string
    phone: string
    email?: string
  }
  branchInfo: {
    name: string
    address: string
    phone: string
  }
  deliveryInfo?: {
    method: 'maxim' | 'other'
    address: string
    contactNumber: string
    landmark?: string
    status: 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed'
  }
  createdAt: string
}

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { selectedBranch } = useBranch()
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      loadOrderDetails(orderId)
    }
  }, [orderId])

  const loadOrderDetails = async (id: string) => {
    try {
      setIsLoading(true)
      
      console.log('🔍 OrderConfirmation: Loading order details for ID:', id)
      
      // Import supabase dynamically
      const { supabase } = await import('../services/supabase')
      
      // Fetch real order data from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq('id', id)
        .single()
      
      if (orderError) {
        console.error('❌ OrderConfirmation: Error fetching order:', orderError)
        throw new Error(`Failed to load order: ${orderError.message}`)
      }
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      console.log('✅ OrderConfirmation: Order data loaded:', order)
      
      // Fetch branch info
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('name, address, phone')
        .eq('id', order.branch_id)
        .single()
      
      if (branchError) {
        console.warn('⚠️ OrderConfirmation: Could not fetch branch info:', branchError)
      }
      
      // Transform database order to UI format
      const orderDetails: OrderDetails = {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status as 'pending' | 'confirmed' | 'ready' | 'completed',
        orderType: order.order_type as 'pickup' | 'delivery',
        estimatedReadyTime: order.estimated_ready_time 
          ? new Date(order.estimated_ready_time).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : undefined,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method,
        items: order.order_items?.map((item: any) => ({
          name: item.product_name || 'Unknown Product',
          quantity: item.quantity,
          price: item.unit_price
        })) || [],
        customerInfo: {
          name: order.customer_name || 'Unknown Customer',
          phone: order.customer_phone || 'No phone provided',
          email: order.customer_email
        },
        branchInfo: branch ? {
          name: branch.name,
          address: branch.address,
          phone: branch.phone || 'No phone provided'
        } : {
          name: selectedBranch?.name || 'Unknown Branch',
          address: selectedBranch?.address || 'Unknown Address',
          phone: selectedBranch?.phone || 'No phone provided'
        },
        // Real delivery info from database
        deliveryInfo: order.order_type === 'delivery' ? {
          method: order.delivery_method as 'maxim' | 'other',
          address: order.delivery_address || '',
          contactNumber: order.delivery_contact_number || '',
          landmark: order.delivery_landmark,
          status: order.delivery_status as 'pending' | 'booked' | 'in_transit' | 'delivered' | 'failed'
        } : undefined,
        createdAt: new Date(order.created_at).toLocaleString()
      }
      
      console.log('✅ OrderConfirmation: Transformed order details:', orderDetails)
      setOrderDetails(orderDetails)
    } catch (error) {
      console.error('❌ OrderConfirmation: Error loading order details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReceipt = () => {
    // In real app, generate and download PDF receipt
    console.log('Downloading receipt for order:', orderId)
  }

  const handleNewOrder = () => {
    navigate('/catalog')
  }

  const handleGoHome = () => {
    navigate('/branch-selection')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <button onClick={handleGoHome} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              {orderDetails.orderType === 'pickup' 
                ? 'Your order has been successfully placed and is being prepared for pickup'
                : 'Thank you! Your order will be arranged for delivery via Maxim. We\'ll notify you once it\'s booked.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Information
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-medium text-gray-900">{orderDetails.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-green-600 capitalize">{orderDetails.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium text-gray-900">{orderDetails.createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Type</p>
                  <p className="font-medium text-gray-900 capitalize">{orderDetails.orderType}</p>
                </div>
                {orderDetails.orderType === 'pickup' && orderDetails.estimatedReadyTime && (
                  <div>
                    <p className="text-sm text-gray-600">Estimated Ready Time</p>
                    <p className="font-medium text-gray-900">{orderDetails.estimatedReadyTime}</p>
                  </div>
                )}
                {orderDetails.orderType === 'delivery' && orderDetails.deliveryInfo && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Status</p>
                    <p className="font-medium text-gray-900 capitalize">{orderDetails.deliveryInfo.status}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-2">
                <p className="text-gray-900">
                  <span className="font-medium">Name:</span> {orderDetails.customerInfo.name}
                </p>
                <p className="text-gray-900">
                  <span className="font-medium">Phone:</span> {orderDetails.customerInfo.phone}
                </p>
                {orderDetails.customerInfo.email && (
                  <p className="text-gray-900">
                    <span className="font-medium">Email:</span> {orderDetails.customerInfo.email}
                  </p>
                )}
              </div>
            </div>

            {/* Branch Info for Pickup or Delivery Info for Delivery */}
            {orderDetails.orderType === 'pickup' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pickup Location
                </h2>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{orderDetails.branchInfo.name}</p>
                      <p className="text-gray-600">{orderDetails.branchInfo.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <p className="text-gray-600">{orderDetails.branchInfo.phone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Delivery Information
                </h2>
                {orderDetails.deliveryInfo && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Delivery Address</p>
                        <p className="text-gray-600">{orderDetails.deliveryInfo.address}</p>
                        {orderDetails.deliveryInfo.landmark && (
                          <p className="text-sm text-gray-500 mt-1">
                            Landmark: {orderDetails.deliveryInfo.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-600">{orderDetails.deliveryInfo.contactNumber}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-600">
                        Service: {orderDetails.deliveryInfo.method === 'maxim' ? 'Maxim Delivery' : 'Other'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₱{orderDetails.totalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">₱{orderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full btn-outline flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>
                
                <button
                  onClick={handleNewOrder}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>New Order</span>
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Order Status
                    </p>
                    <p className="text-sm text-blue-700">
                      {orderDetails.orderType === 'pickup' 
                        ? 'Your order is being prepared. You\'ll receive updates via SMS.'
                        : 'Your delivery order is being arranged. We\'ll notify you once Maxim delivery is booked.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmation
