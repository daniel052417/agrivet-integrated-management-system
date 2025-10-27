import React, { useState, useEffect } from 'react';
import { ProductWithUnits, ProductUnit } from '../../types';
import { X, Plus, Minus, ShoppingCart, Package } from 'lucide-react';

interface ProductSelectionModalProps {
  product: ProductWithUnits | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductWithUnits, unit: ProductUnit, quantity: number) => void;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('1');

  useEffect(() => {
    if (product && isOpen) {
      // Set default unit (base unit or first sellable unit)
      const defaultUnit =
        product.available_units?.find(u => u.is_base_unit) ||
        product.available_units?.[0] ||
        null;
      
      setSelectedUnit(defaultUnit);
      setQuantity(defaultUnit?.min_sellable_quantity || 1);
      setInputValue(String(defaultUnit?.min_sellable_quantity || 1));
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const getProductImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url;
    }
    if (product.product?.image_url) {
      return product.product.image_url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=6b7280&size=400`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!selectedUnit) return;

    const minQty = selectedUnit.min_sellable_quantity;
    const maxQty = product.inventory?.[0]?.quantity_available || 999;

    const validQty = Math.max(minQty, Math.min(newQuantity, maxQty));
    setQuantity(validQty);
    setInputValue(String(validQty));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      handleQuantityChange(numValue);
    }
  };

  const handleIncrement = () => {
    handleQuantityChange(quantity + (selectedUnit?.min_sellable_quantity || 1));
  };

  const handleDecrement = () => {
    handleQuantityChange(quantity - (selectedUnit?.min_sellable_quantity || 1));
  };

  const handleAddToCart = () => {
    if (selectedUnit && quantity > 0) {
      onAddToCart(product, selectedUnit, quantity);
      onClose();
    }
  };

  const calculateTotal = () => {
    if (!selectedUnit) return 0;
    return selectedUnit.price_per_unit * quantity;
  };

  const availableStock = product.inventory?.[0]?.quantity_available || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-4 sm:px-6">
            {/* Product Image */}
            <div className="w-full max-w-md mx-auto aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
              <img
                src={getProductImage()}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=6b7280&size=400`;
                }}
              />
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              {product.brand && (
                <p className="text-sm text-gray-600 mb-2">Brand: {product.brand}</p>
              )}
              {product.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {product.description}
                </p>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {availableStock} units available
                </span>
              </div>
            </div>

            {/* Unit Selection */}
            {product.available_units && product.available_units.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Unit
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.available_units
                    .filter(unit => unit.is_sellable)
                    .map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => {
                          setSelectedUnit(unit);
                          setQuantity(unit.min_sellable_quantity);
                          setInputValue(String(unit.min_sellable_quantity));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedUnit?.id === unit.id
                            ? 'border-agrivet-green bg-green-50 ring-2 ring-agrivet-green ring-offset-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">
                            {unit.unit_name}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {unit.unit_label}
                          </p>
                          <p className="text-lg font-bold text-agrivet-green">
                            {formatPrice(unit.price_per_unit)}
                          </p>
                          {unit.conversion_factor !== 1 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {unit.conversion_factor}x base unit
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            {selectedUnit && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= (selectedUnit.min_sellable_quantity || 1)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </button>

                  <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    min={selectedUnit.min_sellable_quantity}
                    max={availableStock}
                    step={selectedUnit.min_sellable_quantity}
                    className="flex-1 h-11 sm:h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:border-agrivet-green focus:ring-2 focus:ring-agrivet-green focus:ring-offset-2 outline-none"
                  />

                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= availableStock}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Plus className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Min: {selectedUnit.min_sellable_quantity} {selectedUnit.unit_label} • Max: {availableStock} {selectedUnit.unit_label}
                </p>
              </div>
            )}

            {/* Total Price */}
            {selectedUnit && (
              <div className="bg-green-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-xl sm:text-2xl font-bold text-agrivet-green">
                      {formatPrice(calculateTotal())}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {quantity} {selectedUnit.unit_label}
                    </p>
                    <p className="text-xs text-gray-500">
                      @ {formatPrice(selectedUnit.price_per_unit)} each
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Add to Cart Button */}
          <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={!selectedUnit || quantity <= 0 || quantity > availableStock}
              className="w-full py-3 sm:py-4 bg-agrivet-green text-white rounded-xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProductSelectionModal;