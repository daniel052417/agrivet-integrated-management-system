import React from 'react';
import { CartItem as CartItemType } from '../../types';
import { Plus, Minus, Trash2, Package } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
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
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getProductImage = () => {
    if (item.product.images && item.product.images.length > 0) {
      return item.product.images[0].image_url;
    }
    if (item.product.product?.image_url) {
      return item.product.product.image_url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=f3f4f6&color=6b7280&size=200`;
  };

  const handleIncrement = () => {
    if (!disabled) {
      onQuantityChange(item.quantity + (item.product_unit?.min_sellable_quantity || 1));
    }
  };

  const handleDecrement = () => {
    if (!disabled) {
      const minQty = item.product_unit?.min_sellable_quantity || 1;
      if (item.quantity > minQty) {
        onQuantityChange(item.quantity - minQty);
      }
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
      {/* Product Image - Compact on Mobile */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={getProductImage()}
          alt={item.product.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.product.name)}&background=f3f4f6&color=6b7280&size=200`;
          }}
        />
      </div>

      {/* Product Info - Flexible */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top Section: Name and Remove Button */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
              {item.product.name}
            </h3>
            {item.product.brand && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {item.product.brand}
              </p>
            )}
          </div>
          
          {/* Remove Button - Compact */}
          <button
            onClick={onRemove}
            disabled={disabled}
            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Middle Section: Unit Info */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
            <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            <span className="font-medium">{item.product_unit?.unit_label || 'Unit'}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-xs sm:text-sm text-gray-600">
            {formatPrice(item.unitPrice)} each
          </span>
        </div>

        {/* Bottom Section: Quantity Controls and Price */}
        <div className="flex items-center justify-between mt-2 gap-2">
          {/* Quantity Controls - Compact */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDecrement}
              disabled={disabled || item.quantity <= (item.product_unit?.min_sellable_quantity || 1)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
            
            <div className="min-w-[2.5rem] sm:min-w-[3rem] text-center">
              <span className="text-sm sm:text-base font-bold text-gray-900">
                {item.quantity}
              </span>
            </div>
            
            <button
              onClick={handleIncrement}
              disabled={disabled}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" />
            </button>
          </div>

          {/* Line Total - Right Aligned */}
          <div className="text-right flex-shrink-0">
            <p className="text-base sm:text-lg font-bold text-gray-900">
              {formatPrice(item.lineTotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] sm:text-xs text-gray-500">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Min Quantity Info - If applicable */}
        {item.product_unit?.min_sellable_quantity && item.product_unit.min_sellable_quantity > 1 && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            Min: {item.product_unit.min_sellable_quantity} {item.product_unit.unit_label}
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItem;