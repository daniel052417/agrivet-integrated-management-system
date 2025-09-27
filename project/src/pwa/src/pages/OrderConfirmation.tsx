import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Download, Home, ShoppingBag, Clock, MapPin, Phone } from 'lucide-react'
import { useBranch } from '../contexts/BranchContext'

interface OrderDetails {
  orderId: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed'
  estimatedReadyTime: string
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
      
      // Simulate API call - in real app, fetch from backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock order details
      const mockOrder: OrderDetails = {
        orderId: id,
        orderNumber: `ORD-${id.slice(-8)}`,
        status: 'pending',
        estimatedReadyTime: new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        totalAmount: 1250.00,
        paymentMethod: 'GCash',
        items: [
          { name: 'Chicken Feed 50kg', quantity: 2, price: 500.00 },
          { name: 'Vitamin Supplement', quantity: 1, price: 250.00 }
        ],
        customerInfo: {
          name: 'Juan Dela Cruz',
          phone: '+63 912 345 6789',
          email: 'juan@example.com'
        },
        branchInfo: selectedBranch ? {
          name: selectedBranch.name,
          address: selectedBranch.address,
          phone: selectedBranch.phone || '+63 912 345 6789'
        } : {
          name: 'AgriVet Main Branch',
          address: '123 Main Street, City',
          phone: '+63 912 345 6789'
        },
        createdAt: new Date().toLocaleString()
      }
      
      setOrderDetails(mockOrder)
    } catch (error) {
      console.error('Error loading order details:', error)
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
              Your order has been successfully placed
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
                  <p className="text-sm text-gray-600">Estimated Ready Time</p>
                  <p className="font-medium text-gray-900">{orderDetails.estimatedReadyTime}</p>
                </div>
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

            {/* Branch Info */}
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
                  <span className="font-medium">₱{(orderDetails.totalAmount * 0.893).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (12%)</span>
                  <span className="font-medium">₱{(orderDetails.totalAmount * 0.107).toFixed(2)}</span>
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
                      Your order is being prepared. You'll receive updates via SMS.
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
