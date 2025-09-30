import React from 'react'
import { Plus, Minus, Trash2, Package } from 'lucide-react'
import { CartItem as CartItemType } from '../../types'

interface CartItemProps {
  item: CartItemType
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  disabled?: boolean
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
  disabled = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  return (
    <div className="cart-item">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {item.product.variant_name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {item.product.products?.name}
          </p>
          <p className="text-xs text-gray-500">
            SKU: {item.product.sku}
          </p>
          {item.notes && (
            <p className="text-xs text-blue-600 mt-1">
              Note: {item.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onQuantityChange(item.quantity - 1)}
            disabled={disabled || item.quantity <= 1}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className="w-8 text-center font-medium text-gray-900">
            {item.quantity}
          </span>
          
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            disabled={disabled}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatPrice(item.lineTotal)}
          </p>
          <p className="text-sm text-gray-500">
            {formatPrice(item.unitPrice)} each
          </p>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          disabled={disabled}
          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default CartItem
