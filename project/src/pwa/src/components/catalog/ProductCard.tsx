import React from 'react';
import { ProductWithUnits } from '../../types';
import { Plus, Package } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithUnits;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: ProductWithUnits) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'grid',
  onAddToCart
}) => {
  const getProductImage = () => {
    // Check if product has images
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url;
    }
    // Check if product object has image_url
    if (product.product?.image_url) {
      return product.product.image_url;
    }
    // Fallback placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=6b7280&size=300`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getStockBadge = () => {
    const inventory = product.inventory?.[0];
    if (!inventory) return null;

    const available = inventory.quantity_available || 0;
    
    if (available === 0) {
      return (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          Out of Stock
        </span>
      );
    }
    
    if (available <= inventory.reorder_level) {
      return (
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
          Low Stock
        </span>
      );
    }
    
    return null;
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onAddToCart?.(product)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex items-center space-x-3 sm:space-x-4 cursor-pointer hover:shadow-md transition-shadow w-full max-w-full overflow-hidden"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=6b7280&size=300`;
            }}
          />
          {getStockBadge()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mt-1 truncate">Brand: {product.brand}</p>
          )}
          <div className="mt-2">
            <p className="text-base sm:text-lg font-bold text-agrivet-green">
              {formatPrice(product.price_per_unit)}
            </p>
            <p className="text-xs text-gray-500">per {product.unit_label}</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          className="flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 bg-agrivet-green text-white rounded-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg touch-manipulation"
          aria-label="Add to cart"
        >
          <Plus className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onAddToCart?.(product)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] w-full"
    >
      {/* Product Image */}
      <div className="relative w-full pt-[75%] bg-gray-100">
        <img
          src={getProductImage()}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=f3f4f6&color=6b7280&size=300`;
          }}
        />
        {getStockBadge()}
        
        {/* Add to Cart Button - Larger and more visible on mobile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-12 h-12 sm:w-10 sm:h-10 bg-agrivet-green text-white rounded-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors shadow-xl border-2 border-white touch-manipulation z-10"
          aria-label="Add to cart"
        >
          <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {product.brand && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {product.brand}
          </p>
        )}

        <div className="mt-3">
          <p className="text-base sm:text-lg font-bold text-gray-900">
            {product.available_units && product.available_units.length > 1 
              ? `from ${formatPrice(product.price_per_unit)}`
              : formatPrice(product.price_per_unit)
            }
          </p>
          {product.available_units && product.available_units.length > 1 && (
            <p className="text-xs text-gray-500 mt-1">
              {product.available_units.length} units available
            </p>
          )}
          {product.unit_label && (!product.available_units || product.available_units.length === 1) && (
            <p className="text-xs text-gray-500 mt-1">
              per {product.unit_label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;