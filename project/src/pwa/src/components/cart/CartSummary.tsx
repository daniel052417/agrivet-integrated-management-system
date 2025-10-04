import React from 'react'
import { ShoppingBag, MapPin, CreditCard } from 'lucide-react'
import { Cart, Branch } from '../../types'

interface CartSummaryProps {
  cart: Cart
  branch: Branch | null
  onCheckout: () => void
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  branch,
  onCheckout
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Order Summary
      </h2>

      {/* Branch Info */}
      {branch && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">{branch.branch_name}</p>
              <p className="text-xs text-gray-600">{branch.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Items Count */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Items ({cart.itemCount})</span>
          <span className="font-medium text-gray-900">
            {formatPrice(cart.subtotal)}
          </span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(cart.subtotal)}</span>
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

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={cart.items.length === 0}
        className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Proceed to Checkout</span>
      </button>

      {/* Payment Methods */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Accepted Payment Methods:</p>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <CreditCard className="w-3 h-3" />
            <span>Cash</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <CreditCard className="w-3 h-3" />
            <span>GCash</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <CreditCard className="w-3 h-3" />
            <span>PayMaya</span>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <p className="text-xs text-green-800">
          🔒 Your order is secure and will be processed safely.
        </p>
      </div>
    </div>
  )
}

export default CartSummary
