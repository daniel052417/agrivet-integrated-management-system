import React from 'react';
import { Package, AlertTriangle, Calendar } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  image?: string;
  expiryDate?: string;
  batchNumber?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isLowStock?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  isLowStock = false,
}) => {
  const isLowStockItem = product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock === 0;

  return (
    <div className={`
      bg-white rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl cursor-pointer
      ${isLowStockItem ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}
      ${isOutOfStock ? 'opacity-60' : ''}
    `}>
      {/* Product Image */}
      <div className="relative h-32 bg-gray-100 rounded-t-xl overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Stock Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col space-y-1">
          {isLowStockItem && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Stock
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>SKU: {product.sku}</span>
            <span>Stock: {product.stock}</span>
          </div>
          
          {product.batchNumber && (
            <div className="text-xs text-gray-500">
              Batch: {product.batchNumber}
            </div>
          )}
          
          {product.expiryDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              Expires: {new Date(product.expiryDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-2xl font-bold text-green-600 mb-4">
          ₱{product.price.toFixed(2)}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className={`
              flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200
              ${isOutOfStock 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 active:scale-95'
              }
            `}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          <button
            onClick={() => onViewDetails(product)}
            className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors duration-200"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;















