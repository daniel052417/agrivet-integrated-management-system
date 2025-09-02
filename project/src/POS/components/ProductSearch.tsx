import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Scale, AlertTriangle, Plus, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product, ProductSearchFilters } from '../../types/pos';
import AgrivetProductHandler from './AgrivetProductHandler';

interface ProductSearchProps {
  onAddToCart: (product: Product, quantity?: number, weight?: number, expiryDate?: string, batchNumber?: string) => void;
  filters?: ProductSearchFilters;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddToCart, filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id(name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
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
        product.sku.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Additional filters
    if (filters) {
      if (filters.pricing_type) {
        filtered = filtered.filter(product => product.pos_pricing_type === filters.pricing_type);
      }
      if (filters.in_stock_only) {
        filtered = filtered.filter(product => product.stock_quantity > 0);
      }
      if (filters.quick_sale_only) {
        filtered = filtered.filter(product => product.is_quick_sale);
      }
    }

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (product: Product) => {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { status: 'out_of_stock', color: 'text-red-600', icon: AlertTriangle };
    } else if (product.stock_quantity <= product.minimum_stock) {
      return { status: 'low_stock', color: 'text-yellow-600', icon: AlertTriangle };
    }
    return { status: 'in_stock', color: 'text-green-600', icon: Package };
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
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              const PricingIcon = getPricingTypeIcon(product.pos_pricing_type);
              
              return (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-300 ${
                    product.stock_quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <PricingIcon className="w-5 h-5 text-gray-600" />
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.status === 'out_of_stock' ? 'Out of Stock' :
                         stockStatus.status === 'low_stock' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.sku}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(product.unit_price)}
                      </p>
                      {product.pos_pricing_type === 'weight_based' && (
                        <p className="text-xs text-gray-500">per {product.unit_of_measure}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Stock: {product.stock_quantity}
                      </p>
                      {product.pos_pricing_type === 'bulk' && product.bulk_discount_threshold && (
                        <p className="text-xs text-blue-600">
                          Bulk: {product.bulk_discount_threshold}+ items
                        </p>
                      )}
                    </div>
                  </div>

                  {product.requires_expiry_date && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Expiry tracking required
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quantity/Weight Modal */}
      {showQuantityModal && selectedProduct && (
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
                  Weight ({selectedProduct.unit_of_measure})
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
                  Price: {formatPrice(selectedProduct.unit_price)} per {selectedProduct.unit_of_measure}
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
                    max={selectedProduct.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {selectedProduct.stock_quantity} {selectedProduct.unit_of_measure}
                </p>
              </div>
            )}

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                Total: {formatPrice(
                  selectedProduct.pos_pricing_type === 'weight_based' && weight
                    ? selectedProduct.unit_price * weight
                    : selectedProduct.unit_price * quantity
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
                onClick={handleAddToCart}
                disabled={selectedProduct.stock_quantity <= 0 || (selectedProduct.pos_pricing_type === 'weight_based' && !weight)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agrivet Product Handler Modal */}
      {showAgrivetHandler && selectedProduct && (
        <AgrivetProductHandler
          product={selectedProduct}
          onAddToCart={handleAddToCart}
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
