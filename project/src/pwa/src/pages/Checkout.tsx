import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Smartphone, User, MapPin, Phone, Mail, CheckCircle, Clock, Shield, Truck } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useBranch } from '../contexts/BranchContext'
import EnhancedCheckoutForm from '../components/checkout/EnhancedCheckoutForm'
import OrderSummary from '../components/checkout/OrderSummary'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { selectedBranch } = useBranch()
  
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleOrderCreated = (id: string) => {
    setOrderId(id)
    // Navigate to order confirmation after a short delay
    setTimeout(() => {
      navigate(`/order-confirmation/${id}`)
    }, 2000)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleBack = () => {
    navigate('/cart')
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
                <p className="text-gray-600 mt-1">Complete your order with our enhanced checkout system</p>
              </div>
              <div className="p-6">
                <EnhancedCheckoutForm
                  onOrderCreated={handleOrderCreated}
                  onError={handleError}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                cart={cart}
                branch={selectedBranch}
                customerInfo={{
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  city: '',
                  postalCode: '',
                  isGuest: true
                }}
                paymentInfo={{
                  method: 'cash',
                  referenceNumber: '',
                  notes: ''
                }}
                currentStep="customer"
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
