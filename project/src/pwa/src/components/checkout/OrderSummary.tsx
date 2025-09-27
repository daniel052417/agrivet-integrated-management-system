import React from 'react'
import { ShoppingBag, MapPin, User, CreditCard } from 'lucide-react'
import { Cart, Branch } from '../../types'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  isGuest: boolean
}

interface PaymentInfo {
  method: 'cash' | 'gcash' | 'paymaya'
  referenceNumber: string
  notes: string
}

interface OrderSummaryProps {
  cart: Cart
  branch: Branch | null
  customerInfo: CustomerInfo
  paymentInfo: PaymentInfo
  currentStep: 'customer' | 'payment' | 'confirmation'
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cart,
  branch,
  customerInfo,
  paymentInfo,
  currentStep
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash on Pickup'
      case 'gcash': return 'GCash'
      case 'paymaya': return 'PayMaya'
      default: return method
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Order Summary
      </h2>

      {/* Cart Items */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Items ({cart.itemCount})</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {item.product.name}
                </p>
                <p className="text-gray-600">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <p className="font-medium text-gray-900 ml-2">
                {formatPrice(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(cart.subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">VAT (12%)</span>
          <span className="text-gray-900">{formatPrice(cart.tax)}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-semibold text-gray-900">
              {formatPrice(cart.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      {currentStep === 'payment' || currentStep === 'confirmation' ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">Customer</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900">{customerInfo.name}</p>
            <p className="text-gray-600">{customerInfo.phone}</p>
            <p className="text-gray-600">{customerInfo.email}</p>
          </div>
        </div>
      ) : null}

      {/* Branch Information */}
      {branch && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">Pickup Location</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900">{branch.name}</p>
            <p className="text-gray-600">{branch.address}</p>
            {branch.phone && (
              <p className="text-gray-600">{branch.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Payment Information */}
      {currentStep === 'confirmation' ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">Payment</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900">{getPaymentMethodName(paymentInfo.method)}</p>
            {paymentInfo.referenceNumber && (
              <p className="text-gray-600">Ref: {paymentInfo.referenceNumber}</p>
            )}
            {paymentInfo.notes && (
              <p className="text-gray-600">Note: {paymentInfo.notes}</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Security Note */}
      <div className="p-3 bg-green-50 rounded-lg">
        <p className="text-xs text-green-800">
          🔒 Your order is secure and will be processed safely.
        </p>
      </div>
    </div>
  )
}

export default OrderSummary
