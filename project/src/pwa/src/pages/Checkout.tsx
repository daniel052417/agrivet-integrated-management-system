import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Smartphone, User, MapPin, Phone, Mail, CheckCircle, Clock, Shield, Truck } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useBranch } from '../contexts/BranchContext'
import CheckoutForm from '../components/checkout/CheckoutForm'
import OrderSummary from '../components/checkout/OrderSummary'
import PaymentMethod from '../components/checkout/PaymentMethod'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { selectedBranch } = useBranch()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'customer' | 'payment' | 'confirmation'>('customer')
  
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 912 345 6789',
    address: '123 Barangay Poblacion',
    city: 'San Jose',
    postalCode: '3100',
    isGuest: true
  })
  
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'gcash' as 'cash' | 'gcash' | 'paymaya',
    referenceNumber: 'GC123456789',
    notes: 'Please prepare order for pickup'
  })

  const handleCustomerSubmit = (info: typeof customerInfo) => {
    setCustomerInfo(info)
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async (payment: typeof paymentInfo) => {
    setPaymentInfo(payment)
    setCurrentStep('confirmation')
    
    try {
      setIsProcessing(true)
      setError(null)
      
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate order ID
      const orderId = `ORD-${Date.now()}`
      
      // Clear cart and redirect to confirmation
      clearCart()
      navigate(`/order-confirmation/${orderId}`)
      
    } catch (err) {
      setError('Failed to process order. Please try again.')
      console.error('Order processing error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('customer')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('payment')
    } else {
      navigate('/cart')
    }
  }

  if (cart.items.length === 0) {
    navigate('/catalog')
    return null
  }

  if (!selectedBranch) {
    navigate('/branch-selection')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Checkout
              </h1>
              <p className="text-gray-600">
                Complete your order in 3 easy steps
              </p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-8">
            <div className="flex items-center space-x-4">
              {/* Step 1 */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === 'customer' 
                    ? 'bg-agrivet-green text-white' 
                    : currentStep === 'payment' || currentStep === 'confirmation'
                    ? 'bg-green-100 text-agrivet-green'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep === 'payment' || currentStep === 'confirmation' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">1</span>
                  )}
                </div>
                <div className={`text-sm font-medium ${
                  currentStep === 'customer' ? 'text-agrivet-green' : 'text-gray-500'
                }`}>
                  Customer Info
                </div>
              </div>

              <div className={`w-12 h-0.5 ${
                currentStep === 'payment' || currentStep === 'confirmation' 
                  ? 'bg-agrivet-green' 
                  : 'bg-gray-300'
              }`} />

              {/* Step 2 */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === 'payment' 
                    ? 'bg-agrivet-green text-white' 
                    : currentStep === 'confirmation'
                    ? 'bg-green-100 text-agrivet-green'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep === 'confirmation' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">2</span>
                  )}
                </div>
                <div className={`text-sm font-medium ${
                  currentStep === 'payment' ? 'text-agrivet-green' : 'text-gray-500'
                }`}>
                  Payment
                </div>
              </div>

              <div className={`w-12 h-0.5 ${
                currentStep === 'confirmation' ? 'bg-agrivet-green' : 'bg-gray-300'
              }`} />

              {/* Step 3 */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === 'confirmation' 
                    ? 'bg-agrivet-green text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <span className="font-semibold">3</span>
                </div>
                <div className={`text-sm font-medium ${
                  currentStep === 'confirmation' ? 'text-agrivet-green' : 'text-gray-500'
                }`}>
                  Confirmation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 'customer' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                  <p className="text-gray-600 mt-1">Please provide your details for order processing</p>
                </div>
                <CheckoutForm
                  initialData={customerInfo}
                  onSubmit={handleCustomerSubmit}
                  branch={selectedBranch}
                />
              </div>
            )}
            
            {currentStep === 'payment' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
                  <p className="text-gray-600 mt-1">Choose your preferred payment option</p>
                </div>
                <PaymentMethod
                  initialData={paymentInfo}
                  onSubmit={handlePaymentSubmit}
                  customerInfo={customerInfo}
                  isProcessing={isProcessing}
                />
              </div>
            )}
            
            {currentStep === 'confirmation' && isProcessing && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-agrivet-green rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <LoadingSpinner message="Processing your order..." />
                <p className="text-gray-600 mt-4">
                  Please wait while we prepare your order for pickup
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                cart={cart}
                branch={selectedBranch}
                customerInfo={customerInfo}
                paymentInfo={paymentInfo}
                currentStep={currentStep}
              />
              
              {/* Security & Trust */}
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-green-600 mr-2" />
                  Secure Checkout
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Data Protected</span>
                  </div>
                </div>
              </div>

              {/* Pickup Info */}
              <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Pickup Information
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Location:</strong> {selectedBranch?.name}</p>
                  <p><strong>Address:</strong> {selectedBranch?.address}</p>
                  <p><strong>Ready Time:</strong> 30 minutes</p>
                  <p><strong>Contact:</strong> {selectedBranch?.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
