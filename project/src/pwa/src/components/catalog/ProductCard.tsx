import React from 'react'
import { Plus, Package, Weight } from 'lucide-react'
import { ProductVariant } from '../../types'
import { useCart } from '../../contexts/CartContext'

interface ProductCardProps {
  product: ProductVariant
  viewMode?: 'grid' | 'list'
  onAddToCart?: (product: ProductVariant) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = 'grid',
  onAddToCart 
}) => {
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      product,
      quantity: 1,
      unitPrice: product.price
    })
    
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {product.products?.name}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500">
                SKU: {product.sku}
              </span>
              {product.weight_kg && (
                <div className="flex items-center text-sm text-gray-500">
                  <Weight className="w-3 h-3 mr-1" />
                  {product.weight_kg}kg
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatPrice(product.price)}
            </p>
            <p className="text-sm text-gray-500">
              per {product.unit_of_measure || 'piece'}
            </p>
            <button
              onClick={handleAddToCart}
              className="mt-2 btn-primary text-sm px-3 py-1 flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-card">
      <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
        <Package className="w-12 h-12 text-gray-400" />
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          {product.products?.name}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>SKU: {product.sku}</span>
          {product.weight_kg && (
            <div className="flex items-center">
              <Weight className="w-3 h-3 mr-1" />
              {product.weight_kg}kg
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>
          <p className="text-xs text-gray-500">
            per {product.unit_of_measure || 'piece'}
          </p>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="btn-primary text-sm px-3 py-2 flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
    </div>
  )
}

export default ProductCard
