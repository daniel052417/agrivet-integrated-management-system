import React, { useState, useEffect } from 'react';
import { Zap, Package, Plus } from 'lucide-react';
import POSDatabaseService from '../services/databaseService';
import { ProductVariant, QuickSaleItem } from '../../types/pos';

interface QuickSaleShortcutsProps {
  onAddToCart: (product: ProductVariant, quantity?: number, weight?: number) => void;
}

const QuickSaleShortcuts: React.FC<QuickSaleShortcutsProps> = ({ onAddToCart }) => {
  const [quickSaleItems, setQuickSaleItems] = useState<QuickSaleItem[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadQuickSaleItems();
    loadProducts();
  }, []);

  const loadQuickSaleItems = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use a simple approach since quick_sale_items table might not exist
      // In a real implementation, you'd create this table or use a different approach
      setQuickSaleItems([]);
    } catch (error) {
      console.error('Error loading quick sale items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productVariants = await POSDatabaseService.getProductVariants({
        quickSaleOnly: true
      });
      setProducts(productVariants);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleQuickSale = (item: QuickSaleItem) => {
    const product = products.find(p => p.id === item.product_id);
    if (product) {
      onAddToCart(product, item.quantity);
    }
  };

  const handleProductQuickSale = (product: ProductVariant) => {
    onAddToCart(product, 1);
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
        return '⚖️';
      case 'bulk':
        return '📦';
      default:
        return '📦';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Quick Sale</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">Frequently sold items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Configured Quick Sale Items */}
            {quickSaleItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Access</h4>
                <div className="space-y-2">
                  {quickSaleItems.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return null;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleQuickSale(item)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-green-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{getPricingTypeIcon(product.pos_pricing_type)}</span>
                              <h5 className="font-medium text-gray-900 text-sm line-clamp-1">
                                {item.shortcut_name}
                              </h5>
                            </div>
                            <p className="text-xs text-gray-600">
                              {formatPrice(product.price)} × {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatPrice(product.price * item.quantity)}
                            </p>
                            {item.shortcut_key && (
                              <p className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                                {item.shortcut_key}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Sale Products */}
            {products.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {quickSaleItems.length > 0 ? 'Other Quick Sale Items' : 'Quick Sale Items'}
                </h4>
                <div className="space-y-2">
                  {products
                    .filter(product => !quickSaleItems.some(item => item.product_id === product.id))
                    .slice(0, 10) // Limit to 10 items for performance
                    .map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleProductQuickSale(product)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-green-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{getPricingTypeIcon(product.pos_pricing_type)}</span>
                              <h5 className="font-medium text-gray-900 text-sm line-clamp-1">
                                {product.name}
                              </h5>
                            </div>
                            <p className="text-xs text-gray-600">
                              {product.sku} • Stock: {product.inventory?.quantity_available || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatPrice(product.price)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.products?.unit_of_measure || 'pcs'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {quickSaleItems.length === 0 && products.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No quick sale items available</p>
                <p className="text-gray-400 text-xs mt-1">
                  Configure quick sale items in settings
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Tip: Use keyboard shortcuts for faster checkout</p>
        </div>
      </div>
    </div>
  );
};

export default QuickSaleShortcuts;

