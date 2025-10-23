import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, Package, Truck, Shield, Clock, Star } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useBranch } from '../contexts/BranchContext'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import EmptyCart from '../components/cart/EmptyCart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { CartItem as CartItemType } from '../types'


const ShoppingCart: React.FC = () => {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeItem, clearCart, addItem } = useCart()
  const { selectedBranch } = useBranch()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    setIsUpdating(true)
    try {
      updateQuantity(itemId, quantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(true)
    try {
      removeItem(itemId)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  const handleCheckout = () => {
    if (cart.items.length === 0) return
    navigate('/checkout')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Empty Cart Header - Compact */}
        <div className="bg-white shadow-md border-b">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => navigate('/catalog')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  Shopping Cart
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">
                  Your selected items are ready for checkout
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <EmptyCart onContinueShopping={() => navigate('/catalog')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-md border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/catalog')}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  Shopping Cart
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} • {formatPrice(cart.total)}
                </p>
              </div>
            </div>
            
            {/* Right: Clear Cart Button */}
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Clear Cart</span>
              <span className="sm:hidden">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Cart Items - Mobile First */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Items Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">
                    Your Items
                  </h2>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{cart.itemCount} {cart.itemCount === 1 ? 'product' : 'products'}</span>
                  </div>
                </div>
              </div>
              
              {/* Cart Items List */}
              <div className="divide-y divide-gray-100">
                {isUpdating && (
                  <div className="p-6 sm:p-8 text-center">
                    <LoadingSpinner message="Updating cart..." />
                  </div>
                )}
                
                {cart.items.map((item, index) => (
                  <div key={item.id} className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                    <CartItem
                      item={item}
                      onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                      onRemove={() => handleRemoveItem(item.id)}
                      disabled={isUpdating}
                    />
                  </div>
                ))}
              </div>

              {/* Cart Features - Compact on Mobile */}
              {/* <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Free Pickup</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Ready in 30 min</span>
                  </div>
                </div>
              </div> */}
            </div>
          </div>

          {/* Cart Summary - Sticky on Desktop, Normal on Mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <CartSummary
                cart={cart}
                branch={selectedBranch}
                onCheckout={handleCheckout}
              />
              
              {/* Additional Info - Hidden on Small Mobile */}
              <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">
                  Why Choose AgriVet?
                </h3>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Quality Guaranteed</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">Premium agricultural products</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Fast Pickup</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">Ready within 30 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Secure Payment</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">Safe and encrypted transactions</p>
                    </div>
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

export default ShoppingCart