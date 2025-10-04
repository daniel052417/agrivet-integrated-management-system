import React from 'react'
import { Minus, Plus, Trash2, Package, Scale } from 'lucide-react'
import { CartItem as CartItemType } from '../../types'
import { useCart } from '../../contexts/CartContext'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemove?: (itemId: string) => void
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const { updateQuantity, removeItem } = useCart()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.id)
      onRemove?.(item.id)
    } else {
      updateQuantity(item.id, newQuantity)
      onUpdateQuantity?.(item.id, newQuantity)
    }
  }

  const handleIncrement = () => {
    const minQuantity = item.product_unit?.min_sellable_quantity || 1
    const newQuantity = item.quantity + minQuantity
    handleQuantityChange(newQuantity)
  }

  const handleDecrement = () => {
    const minQuantity = item.product_unit?.min_sellable_quantity || 1
    const newQuantity = Math.max(0, item.quantity - minQuantity)
    handleQuantityChange(newQuantity)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const getUnitIcon = (unitLabel: string) => {
    if (unitLabel.toLowerCase().includes('kg') || unitLabel.toLowerCase().includes('gram')) {
      return <Scale className="w-4 h-4" />
    }
    if (unitLabel.toLowerCase().includes('ml') || unitLabel.toLowerCase().includes('liter')) {
      return <Package className="w-4 h-4" />
    }
    return <Package className="w-4 h-4" />
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {item.product.product?.image_url ? (
            <img
              src={item.product.product.image_url}
              alt={item.product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-lg mb-1 line-clamp-2">
            {item.product.name}
          </h3>

          {/* Unit Information */}
          {item.product_unit && (
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center text-sm text-gray-600">
                {getUnitIcon(item.product_unit.unit_label)}
                <span className="ml-1">{item.product_unit.unit_label}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                {formatPrice(item.product_unit.price_per_unit)} per {item.product_unit.unit_label}
              </span>
              {item.product_unit.min_sellable_quantity && item.product_unit.min_sellable_quantity !== 1 && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Min: {item.product_unit.min_sellable_quantity}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="text-lg font-medium text-gray-900 min-w-[3rem] text-center">
                {item.quantity}
              </span>
              
              <button
                onClick={handleIncrement}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(item.lineTotal)}
              </p>
              {item.product_unit && (
                <p className="text-xs text-gray-500">
                  {item.base_unit_quantity.toFixed(2)} {item.product.product?.unit_of_measure || 'base units'}
                </p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {(item.expiryDate || item.batchNumber || item.notes) && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {item.expiryDate && (
                <p className="text-xs text-gray-500">
                  Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                </p>
              )}
              {item.batchNumber && (
                <p className="text-xs text-gray-500">
                  Batch: {item.batchNumber}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-gray-500">
                  Note: {item.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => {
            removeItem(item.id)
            onRemove?.(item.id)
          }}
          className="w-8 h-8 rounded-full border border-red-300 text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default CartItem