import React from 'react';
import { ShoppingCart, Package, ArrowRight } from 'lucide-react';

interface EmptyCartProps {
  onContinueShopping: () => void;
}

const EmptyCart: React.FC<EmptyCartProps> = ({ onContinueShopping }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 lg:py-20">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          Your Cart is Empty
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
          Start adding products to your cart and they will appear here. 
          Browse our wide selection of agricultural supplies and veterinary products.
        </p>

        {/* Features */}
        <div className="space-y-3 mb-6 sm:mb-8 text-left">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Package className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Quality Products</p>
              <p className="text-xs text-gray-600">Premium agricultural supplies</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Easy Checkout</p>
              <p className="text-xs text-gray-600">Simple and secure payment</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onContinueShopping}
          className="w-full py-3 sm:py-4 bg-agrivet-green text-white rounded-xl font-bold text-sm sm:text-base hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default EmptyCart;