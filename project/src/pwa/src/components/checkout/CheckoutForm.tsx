import React, { useState } from 'react'
import { CreditCard, User, MapPin, Phone, Mail, AlertCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import OrderService from '../../services/orderService'
import MockOrderService from '../../services/mockOrderService'

interface CheckoutFormProps {
  branchId: string
  onOrderCreated: (orderId: string) => void
  onError: (error: string) => void
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  branchId,
  onOrderCreated,
  onError
}) => {
  const { cart, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [orderService] = useState(() => {
    const realService = new OrderService({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    })
    
    // Use mock service if real service is not available
    if (!realService.isAvailable()) {
      console.log('🔄 Using MockOrderService for checkout')
      return new MockOrderService({
        supabaseUrl: '',
        supabaseAnonKey: ''
      })
    }
    
    return realService
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderService.isAvailable()) {
      onError('Order service is not available. Please try again later.')
      return
    }

    if (cart.items.length === 0) {
      onError('Your cart is empty')
      return
    }

    setIsProcessing(true)

    try {
      const result = await orderService.createOrder({
        cart,
        branchId,
        paymentMethod,
        notes: notes.trim() || undefined,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email?.trim() || undefined,
          phone: customerInfo.phone?.trim() || undefined
        }
      })

      if (result.success && result.orderId) {
        // Clear cart after successful order
        await clearCart()
        onOrderCreated(result.orderId)
      } else {
        onError(result.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      onError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  // Note: We now use MockOrderService when real service is not available
  // so we don't need to show the warning message

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Status Indicator */}
      {orderService instanceof MockOrderService && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-800 text-sm">
              Demo Mode: Orders will be processed locally for testing
            </span>
          </div>
        </div>
      )}

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Customer Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={customerInfo.firstName}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter first name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={customerInfo.lastName}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter last name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email (optional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone (optional)"
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Method
        </h3>
        
        <div className="space-y-3">
          {[
            { value: 'cash', label: 'Cash', description: 'Pay with cash at pickup' },
            { value: 'gcash', label: 'GCash', description: 'Pay via GCash' },
            { value: 'paymaya', label: 'PayMaya', description: 'Pay via PayMaya' }
          ].map((method) => (
            <label key={method.value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value={method.value}
                checked={paymentMethod === method.value}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">{method.label}</div>
                <div className="text-sm text-gray-500">{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Order Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Additional Information
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special instructions for your order..."
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Items ({cart.itemCount})</span>
            <span className="font-medium">{formatPrice(cart.subtotal)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || cart.items.length === 0}
        className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing Order...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>Place Order</span>
          </>
        )}
      </button>
    </form>
  )
}

export default CheckoutForm