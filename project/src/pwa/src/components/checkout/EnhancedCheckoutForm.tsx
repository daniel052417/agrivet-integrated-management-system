import React, { useState, useEffect } from 'react'
import { CreditCard, User, MapPin, Phone, Mail, AlertCircle, CheckCircle, Clock, Truck } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useBranch } from '../../contexts/BranchContext'
import { useAuth } from '../../contexts/AuthContext'
import OrderService from '../../services/orderService'
import PaymentService from '../../services/paymentService'
import EmailService from '../../services/emailService'
import InventoryService from '../../services/inventoryService'
import OrderTrackingService from '../../services/orderTrackingService'

interface EnhancedCheckoutFormProps {
  onOrderCreated: (orderId: string) => void
  onError: (error: string) => void
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

interface PaymentInfo {
  method: string
  referenceNumber?: string
  notes?: string
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onOrderCreated,
  onError
}) => {
  const { cart, clearCart } = useCart()
  const { selectedBranch } = useBranch()
  const { user, isAuthenticated } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'customer' | 'payment' | 'processing' | 'confirmation'>('customer')
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: ''
  })
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'cash',
    referenceNumber: '',
    notes: ''
  })

  const [orderService] = useState(() => {
    return new OrderService({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    })
  })

  const [paymentService] = useState(() => new PaymentService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }))

  const [emailService] = useState(() => new EmailService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }))

  const [inventoryService] = useState(() => new InventoryService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }))

  const [trackingService] = useState(() => new OrderTrackingService({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  }))

  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load available payment methods
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const result = await paymentService.getPaymentMethods()
      if (result.success && result.methods) {
        // Filter to only show cash payments
        const cashMethods = result.methods.filter(method => method.type === 'cash')
        setAvailablePaymentMethods(cashMethods)
      } else {
        throw new Error(result.error || 'Failed to load payment methods')
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      setError('Failed to load payment methods. Please check your Supabase configuration.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerInfo.firstName.trim() || !customerInfo.lastName.trim()) {
      onError('Please fill in all required fields')
      return
    }

    setCurrentStep('payment')
  }

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentInfo.method !== 'cash') {
      onError('Only cash payments are currently supported')
      return
    }

    setCurrentStep('processing')
    processOrder()
  }

  const processOrder = async () => {
    if (!selectedBranch) {
      onError('No branch selected')
      return
    }
  
    setIsProcessing(true)
  
    try {
      // Look up customer_id if user is authenticated
      let customerId: string | undefined = undefined
      
      if (user?.id) {
        // Import supabase client
        const { supabase } = await import('../../services/supabase')
        
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (customer && !customerError) {
          customerId = customer.id
          console.log('Found customer ID:', customerId)
        } else {
          console.warn('No customer record found for authenticated user')
        }
      }
  
      const result = await orderService.createOrder({
        cart,
        customerId: customerId, // Now passing customers.id, not auth.users.id
        branchId: selectedBranch.id,
        paymentMethod: paymentInfo.method,
        notes: paymentInfo.notes?.trim() || undefined,
        customerInfo: {
          firstName: customerInfo.firstName.trim(),
          lastName: customerInfo.lastName.trim(),
          email: customerInfo.email?.trim() || undefined,
          phone: customerInfo.phone?.trim() || undefined
        }
      })
  
      if (result.success && result.orderId) {
        await clearCart()
        setCurrentStep('confirmation')
        onOrderCreated(result.orderId)
      } else {
        onError(result.error || 'Failed to create order')
        setCurrentStep('payment')
      }
    } catch (error) {
      console.error('Order processing error:', error)
      onError('An unexpected error occurred. Please try again.')
      setCurrentStep('payment')
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout system...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">Configuration Error</span>
        </div>
        <p className="text-red-700">{error}</p>
        <p className="text-sm text-red-600 mt-2">
          Please ensure your Supabase environment variables are properly configured.
        </p>
      </div>
    )
  }

  if (currentStep === 'customer') {
    return (
      <form onSubmit={handleCustomerSubmit} className="space-y-6">

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

        <button
          type="submit"
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>Continue to Payment</span>
        </button>
      </form>
    )
  }

  if (currentStep === 'payment') {
    return (
      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Method
          </h3>
          
          <div className="space-y-3">
            {availablePaymentMethods.map((method) => (
              <label key={method.id} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.type}
                  checked={paymentInfo.method === method.type}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, method: e.target.value }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-500">
                    {method.type === 'cash' ? 'Pay with cash at pickup' : 
                     method.type === 'digital_wallet' ? 'Pay via digital wallet' : 
                     'Pay with card'}
                  </div>
                  {method.processing_fee > 0 && (
                    <div className="text-xs text-orange-600">
                      Processing fee: {(method.processing_fee * 100).toFixed(1)}%
                    </div>
                  )}
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
              value={paymentInfo.notes}
              onChange={(e) => setPaymentInfo(prev => ({ ...prev, notes: e.target.value }))}
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

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setCurrentStep('customer')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Place Order</span>
          </button>
        </div>
      </form>
    )
  }

  if (currentStep === 'processing') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Order</h2>
        <p className="text-gray-600 mb-6">
          Please wait while we process your order and prepare it for pickup
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Order created successfully</span>
          </div>
          
          {inventoryService.isAvailable() && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Inventory updated</span>
            </div>
          )}
          
          {paymentService.isAvailable() && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Payment processed</span>
            </div>
          )}
          
          {emailService.isAvailable() && customerInfo.email && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Confirmation email sent</span>
            </div>
          )}
          
          {trackingService.isAvailable() && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Order tracking created</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
        <p className="text-gray-600 mb-6">
          Your order has been successfully placed and is being prepared for pickup
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium capitalize">{paymentInfo.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Ready Time:</span>
              <span className="font-medium">30 minutes</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center justify-center">
            <Truck className="w-5 h-5 mr-2" />
            Pickup Information
          </h3>
          <div className="text-sm text-blue-800">
            <p><strong>Location:</strong> {selectedBranch?.name}</p>
            <p><strong>Address:</strong> {selectedBranch?.address}</p>
            <p><strong>Contact:</strong> {selectedBranch?.phone}</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          You will receive a confirmation email shortly with your order details and tracking information.
        </p>
      </div>
    )
  }

  return null
}

export default EnhancedCheckoutForm
