import React from 'react';
import { Cart, Branch } from '../../types';
import { MapPin, ShoppingBag, CreditCard } from 'lucide-react';

interface CartSummaryProps {
  cart: Cart;
  branch: Branch | null;
  onCheckout: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  branch,
  onCheckout
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          Order Summary
        </h2>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Branch Info - Compact */}
        {branch && (
          <div className="flex items-start gap-2 pb-3 sm:pb-4 border-b border-gray-100">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-900">Pickup Location</p>
              <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                {branch.address}, {branch.city}
              </p>
            </div>
          </div>
        )}

        {/* Items Count - Compact */}
        <div className="flex items-center justify-between text-sm sm:text-base py-1">
          <div className="flex items-center gap-2 text-gray-600">
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span>Items ({cart.itemCount})</span>
          </div>
          <span className="font-semibold text-gray-900">{formatPrice(cart.subtotal)}</span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between text-sm sm:text-base text-gray-600 py-1">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(cart.subtotal)}</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm sm:text-base text-gray-600 py-1">
          <span>Tax (12%)</span>
          <span className="font-medium text-gray-900">{formatPrice(cart.tax)}</span>
        </div>

        {/* Total - Emphasized */}
        <div className="flex justify-between items-center pt-3 sm:pt-4 border-t-2 border-gray-200">
          <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg sm:text-2xl font-bold text-agrivet-green">
            {formatPrice(cart.total)}
          </span>
        </div>

        {/* Checkout Button - Full Width */}
        <button
          onClick={onCheckout}
          disabled={cart.itemCount === 0}
          className="w-full mt-4 sm:mt-6 py-3 sm:py-4 bg-agrivet-green text-white rounded-xl font-bold text-sm sm:text-base hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Proceed to Checkout</span>
        </button>

        {/* Additional Info */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Payment</span>
              <span className="text-gray-900 font-medium">Cash on Pickup</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Estimated Ready</span>
              <span className="text-gray-900 font-medium">30 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;