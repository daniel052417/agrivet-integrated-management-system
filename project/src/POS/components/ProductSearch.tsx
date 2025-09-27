import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Scale, AlertTriangle, Plus, Minus, Barcode, Zap, Eye } from 'lucide-react';
import { ProductVariant, ProductSearchFilters, Category } from '../../types/pos';
import AgrivetProductHandler from './AgrivetProductHandler';
import POSDatabaseService from '../services/databaseService';

interface ProductSearchProps {
  onAddToCart: (product: ProductVariant, quantity?: number, weight?: number, expiryDate?: string, batchNumber?: string) => void;
  filters?: ProductSearchFilters;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddToCart, filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState<number | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showAgrivetHandler, setShowAgrivetHandler] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
    
    // Focus search input on mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products, filters]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await POSDatabaseService.getProductVariants({
        categoryId: selectedCategory || undefined,
        searchTerm: searchTerm || undefined,
        inStockOnly: filters?.in_stock_only,
        quickSaleOnly: filters?.quick_sale_only
      });
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await POSDatabaseService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term)
      );
    }

    // Category filter - Note: This would need to be implemented based on your actual data structure
    // if (selectedCategory) {
    //   filtered = filtered.filter(product => product.products?.category_id === selectedCategory);
    // }

    // Additional filters
    if (filters) {
      if (filters.pricing_type) {
        filtered = filtered.filter(product => product.pos_pricing_type === filters.pricing_type);
      }
      if (filters.in_stock_only) {
        filtered = filtered.filter(product => product.inventory && product.inventory.quantity_available > 0);
      }
      if (filters.quick_sale_only) {
        filtered = filtered.filter(product => product.is_quick_sale);
      }
    }

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (product: ProductVariant) => {
    setSelectedProduct(product);
    setQuantity(1);
    setWeight(null);
    
    // Check if this is an agrivet product that needs special handling
    const isAgrivetProduct = product.name.toLowerCase().includes('feed') ||
                            product.name.toLowerCase().includes('medicine') ||
                            product.name.toLowerCase().includes('fertilizer') ||
                            product.name.toLowerCase().includes('syringe') ||
                            product.name.toLowerCase().includes('capsule') ||
                            product.name.toLowerCase().includes('sachet') ||
                            product.requires_expiry_date ||
                            product.requires_batch_tracking;
    
    if (isAgrivetProduct) {
      setShowAgrivetHandler(true);
    } else {
      // For weight-based products, show weight input
      if (product.pos_pricing_type === 'weight_based') {
        setWeight(product.weight_per_unit || 1);
      }
      setShowQuantityModal(true);
    }
  };

  const handleAddToCart = (expiryDate?: string, batchNumber?: string) => {
    if (selectedProduct) {
      onAddToCart(selectedProduct, quantity, weight || undefined, expiryDate, batchNumber);
      setShowQuantityModal(false);
      setShowAgrivetHandler(false);
      setSelectedProduct(null);
      setQuantity(1);
      setWeight(null);
    }
  };

  const handleAddToCartClick = () => {
    handleAddToCart();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const getPricingTypeIcon = (pricingType?: string) => {
    switch (pricingType) {
      case 'weight_based':
        return Scale;
      case 'bulk':
        return Package;
      default:
        return Package;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Search Header */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-medium bg-gray-50 focus:bg-white transition-all duration-200"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white transition-all duration-200 font-medium"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2 font-semibold">
              <Barcode className="w-5 h-5" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">No products found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const PricingIcon = getPricingTypeIcon(product.pos_pricing_type);
              const stockQuantity = product.inventory?.quantity_available || 0;
              const reorderLevel = product.inventory?.reorder_level || 0;
              const maxStock = product.inventory?.max_stock_level || 0;
              const isLowStock = stockQuantity <= reorderLevel && stockQuantity > 0;
              const isOutOfStock = stockQuantity <= 0;
              const stockPercentage = maxStock ? (stockQuantity / maxStock) * 100 : 100;
              
              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleProductSelect(product)}
                  className={`product-card relative group cursor-pointer ${
                    isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  {/* Product Image Placeholder */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PricingIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    {/* Stock Status Badges */}
                    {isLowStock && (
                      <div className="low-stock-badge">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Low Stock
                      </div>
                    )}
                    
                    {isOutOfStock && (
                      <div className="out-of-stock-overlay">
                        <div className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold text-sm">
                          Out of Stock
                        </div>
                      </div>
                    )}

                    {/* Quick Sale Badge */}
                    {product.is_quick_sale && (
                      <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Quick Sale
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-mono">
                          {product.sku}
                        </p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Stock Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Stock</span>
                        <span className="font-semibold">{stockQuantity}</span>
                      </div>
                      <div className={`stock-progress ${isLowStock ? 'stock-progress-low' : ''}`}>
                        <div 
                          className="stock-progress-fill"
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-emerald-600">
                          {formatPrice(product.price)}
                        </p>
                        {product.pos_pricing_type === 'weight_based' && (
                          <p className="text-xs text-gray-500">per unit</p>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleProductSelect(product);
                        }}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          isOutOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>

                    {/* Special Requirements */}
                    {(product.requires_expiry_date || product.requires_batch_tracking) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {product.requires_expiry_date && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              Expiry Tracking
                            </span>
                          )}
                          {product.requires_batch_tracking && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Batch Tracking
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quantity/Weight Modal */}
      {showQuantityModal && selectedProduct && (() => {
        const stockQuantity = selectedProduct.inventory?.quantity_available || 0;
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Add to Cart</h3>
              
              <div className="mb-4">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">SKU: {selectedProduct.sku}</p>
              </div>

            {selectedProduct.pos_pricing_type === 'weight_based' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter weight"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Price: {formatPrice(selectedProduct.price)} per kg
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={stockQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {stockQuantity} units
                </p>
              </div>
            )}

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Total: {formatPrice(
                  selectedProduct.pos_pricing_type === 'weight_based' && weight
                    ? selectedProduct.price * weight
                    : selectedProduct.price * quantity
                )}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCartClick}
                disabled={stockQuantity <= 0 || (selectedProduct.pos_pricing_type === 'weight_based' && !weight)}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Agrivet Product Handler Modal */}
      {showAgrivetHandler && selectedProduct && (
        <AgrivetProductHandler
          product={selectedProduct}
          onAddToCart={(_, quantity, weight, expiryDate, batchNumber) => {
            if (selectedProduct) {
              onAddToCart(selectedProduct, quantity, weight, expiryDate, batchNumber);
              setShowAgrivetHandler(false);
              setSelectedProduct(null);
            }
          }}
          onCancel={() => {
            setShowAgrivetHandler(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductSearch;
