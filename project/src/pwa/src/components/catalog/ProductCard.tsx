import React, { useState, useEffect } from 'react'
import { ShoppingCart, Package, Scale, AlertCircle, Minus, Plus, CheckCircle } from 'lucide-react'
import { ProductWithUnits, ProductUnit } from '../../types'
import { useCart } from '../../contexts/CartContext'
import { productService } from '../../services/productService'
import PreviewButton from './PreviewButton'

interface ProductCardProps {
  product: ProductWithUnits
  viewMode?: 'grid' | 'list'
  onAddToCart?: (product: ProductWithUnits, unit: ProductUnit, quantity: number) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', onAddToCart }) => {
  const { addItem } = useCart()
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Initialize selected unit when product changes
  useEffect(() => {
    if (product.available_units && product.available_units.length > 0) {
      setSelectedUnit(product.available_units[0])
      setQuantity(product.available_units[0].min_sellable_quantity || 1)
    }
  }, [product])

  // Validate quantity when unit or quantity changes
  useEffect(() => {
    if (selectedUnit) {
      const validation = productService.validateQuantity(quantity, selectedUnit)
      setValidationError(validation.isValid ? null : validation.message || null)
    }
  }, [quantity, selectedUnit])

  const handleUnitChange = (unitId: string) => {
    const unit = product.available_units?.find(u => u.id === unitId)
    if (unit) {
      setSelectedUnit(unit)
      setQuantity(unit.min_sellable_quantity || 1)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (selectedUnit) {
      const validation = productService.validateQuantity(newQuantity, selectedUnit)
      if (validation.isValid) {
        setQuantity(newQuantity)
        setValidationError(null)
      } else {
        setValidationError(validation.message || null)
      }
    }
  }

  const handleAddToCart = async () => {
    if (!selectedUnit || validationError) return

    setIsAdding(true)
    try {
      const baseUnitQuantity = productService.convertToBaseUnit(quantity, selectedUnit)
      
      addItem({
        product,
        product_unit: selectedUnit,
        quantity,
        unitPrice: selectedUnit.price_per_unit,
        base_unit_quantity: baseUnitQuantity
      })

      onAddToCart?.(product, selectedUnit, quantity)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const getTotalPrice = () => {
    if (!selectedUnit) return 0
    return selectedUnit.price_per_unit * quantity
  }

  const getUnitIcon = (unit: ProductUnit) => {
    if (unit.unit_label.toLowerCase().includes('kg') || unit.unit_label.toLowerCase().includes('gram')) {
      return <Scale className="w-4 h-4" />
    }
    if (unit.unit_label.toLowerCase().includes('ml') || unit.unit_label.toLowerCase().includes('liter')) {
      return <Package className="w-4 h-4" />
    }
    return <Package className="w-4 h-4" />
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image with Preview Button */}
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center group">
        {product.product?.image_url ? (
          <img
            src={product.product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-16 h-16 text-gray-400" />
        )}
        
        {/* Preview Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <PreviewButton
            productId={product.product_id}
            productName={product.name}
            mainImageUrl={product.product?.image_url}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            size="sm"
            variant="primary"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Brand Information */}
        {product.brand && (
          <p className="text-sm text-gray-600 mb-3">
            Brand: {product.brand}
          </p>
        )}

        {/* Unit Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Unit:
          </label>
          <select
            value={selectedUnit?.id || ''}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-agrivet-green focus:border-agrivet-green"
          >
            {product.available_units?.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_label} - {formatPrice(unit.price_per_unit)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Control */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qty:
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuantityChange(quantity - (selectedUnit?.min_sellable_quantity || 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              min={selectedUnit?.min_sellable_quantity || 1}
              step={selectedUnit?.min_sellable_quantity || 1}
              className={`flex-1 p-2 border rounded-md text-sm text-center focus:ring-2 focus:ring-agrivet-green focus:border-agrivet-green ${
                validationError ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            
            <button
              onClick={() => handleQuantityChange(quantity + (selectedUnit?.min_sellable_quantity || 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Minimum Quantity Display */}
          {selectedUnit && (
            <p className="text-xs text-gray-500 mt-1">
              Min: {selectedUnit.min_sellable_quantity} {selectedUnit.unit_label}
            </p>
          )}
          
          {validationError && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationError}
            </p>
          )}
        </div>

        {/* Total Price */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(getTotalPrice())}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Preview Button */}
          <PreviewButton
            productId={product.product_id}
            productName={product.name}
            mainImageUrl={product.product?.image_url}
            className="w-full"
            size="md"
            variant="secondary"
          />
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedUnit || validationError || isAdding}
            className="w-full bg-agrivet-green text-white py-2 px-4 rounded-md font-medium hover:bg-agrivet-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>

        {/* Stock Status */}
        <div className="mt-3 flex items-center justify-center">
          {product.inventory && product.inventory.length > 0 && product.inventory[0].quantity_available > 0 ? (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>In Stock</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>Out of Stock</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard