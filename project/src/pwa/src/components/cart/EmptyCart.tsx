import React from 'react'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

interface EmptyCartProps {
  onContinueShopping: () => void
}

const EmptyCart: React.FC<EmptyCartProps> = ({ onContinueShopping }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h1>
        
        <p className="text-gray-600 mb-8">
          Looks like you haven't added any items to your cart yet. 
          Start shopping to add some products!
        </p>
        
        <button
          onClick={onContinueShopping}
          className="btn-primary flex items-center justify-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>
    </div>
  )
}

export default EmptyCart
