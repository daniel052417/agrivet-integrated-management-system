import React, { useState, useEffect } from 'react';
import { 
  Search, 
  AlertTriangle, 
  Package, 
  Calendar,
  BarChart3,
  Eye
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/pos';

const InventoryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load products and categories from database
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          ),
          inventory:inventory!product_id (
            id,
            branch_id,
            product_id,
            quantity_on_hand,
            quantity_reserved,
            quantity_available,
            reorder_level,
            max_stock_level,
            last_counted,
            updated_at,
            base_unit
          ),
          product_units (
            id,
            unit_name,
            unit_label,
            price_per_unit,
            is_base_unit,
            is_sellable,
            conversion_factor,
            min_sellable_quantity
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Transform the data to match the Product type with unit information
      const transformedProducts: Product[] = data?.map((item: any) => {
        // Get sellable units sorted by conversion factor (largest first)
        const sellableUnits = (item.product_units || [])
          .filter((unit: any) => unit.is_sellable)
          .sort((a: any, b: any) => b.conversion_factor - a.conversion_factor);
        
        // Find base unit or primary display unit
        const baseUnit = sellableUnits.find((unit: any) => unit.is_base_unit) || sellableUnits[0];
        
        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          category_id: item.category_id,
          unit_of_measure: item.unit_of_measure,
          weight: item.weight,
          is_prescription_required: item.is_prescription_required,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          supplier_id: item.supplier_id,
          image_url: item.image_url,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          expiry_date: item.expiry_date,
          inventory: item.inventory?.[0] ? {
            id: item.inventory[0].id,
            branch_id: item.inventory[0].branch_id,
            product_id: item.inventory[0].product_id,
            quantity_on_hand: item.inventory[0].quantity_on_hand,
            quantity_reserved: item.inventory[0].quantity_reserved,
            quantity_available: item.inventory[0].quantity_available,
            reorder_level: item.inventory[0].reorder_level,
            max_stock_level: item.inventory[0].max_stock_level,
            base_unit: item.inventory[0].base_unit
          } : undefined,
          category: item.categories ? {
            id: item.categories.id,
            name: item.categories.name,
            sort_order: 0,
            is_active: true,
            created_at: new Date().toISOString()
          } : undefined,
          // Add unit information for display
          productUnits: sellableUnits,
          displayUnit: baseUnit
        };
      }) || [];

      setProducts(transformedProducts);
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
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(product => 
    (product.inventory?.quantity_available || 0) <= (product.inventory?.reorder_level || 0)
  );

  const totalValue = products.reduce((total, product) => 
    total + ((product.inventory?.quantity_available || 0) * (product.cost_price || 0)), 0
  );
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => (p.inventory?.quantity_available || 0) === 0).length;

  const getStockStatus = (product: Product) => {
    const stock = product.inventory?.quantity_available || 0;
    const reorderLevel = product.inventory?.reorder_level || 0;
    if (stock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock <= reorderLevel) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  };

  // Helper function to format stock display with contextual units
  const formatStockDisplay = (product: any) => {
    const stock = product.inventory?.quantity_available || 0;
    const displayUnit = product.displayUnit;
    
    if (!displayUnit || stock === 0) {
      return `${stock} ${product.unit_of_measure || 'units'}`;
    }
    
    // Calculate how many of the display unit we have
    const quantityInDisplayUnit = Math.floor(stock / displayUnit.conversion_factor);
    const remainder = stock % displayUnit.conversion_factor;
    
    if (quantityInDisplayUnit > 0) {
      if (remainder > 0) {
        // Show both display unit and remainder
        return `${quantityInDisplayUnit} ${displayUnit.unit_label}, ${remainder} ${product.unit_of_measure || 'units'}`;
      } else {
        // Show only display unit
        return `${quantityInDisplayUnit} ${displayUnit.unit_label}`;
      }
    } else {
      // Stock is less than one display unit
      return `${stock} ${product.unit_of_measure || 'units'}`;
    }
  };

  // Helper function to get the primary unit label for display
  const getPrimaryUnitLabel = (product: any) => {
    return product.displayUnit?.unit_label || product.unit_of_measure || 'units';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setShowLowStockModal(true)}
              variant="warning"
              icon={AlertTriangle}
              className="relative"
            >
              Low Stock ({lowStockCount})
            </TouchButton>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <Package className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Products ({filteredProducts.length})</h2>
          <div className="flex space-x-2">
            <TouchButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
            >
              Grid
            </TouchButton>
            <TouchButton
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
            >
              Table
            </TouchButton>
          </div>
        </div>

        {/* Products Display */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              const expiringSoon = isExpiringSoon(product.expiry_date);
              const stockDisplay = formatStockDisplay(product);
              const primaryUnitLabel = getPrimaryUnitLabel(product);
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Product Image Placeholder */}
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-gray-600">
                        <div>SKU: {product.sku}</div>
                        <div>Category: {product.category?.name || 'Uncategorized'}</div>
                        <div>Stock: {stockDisplay}</div>
                        {product.expiry_date && (
                          <div className={`flex items-center ${expiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {new Date(product.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          ₱{((product as any).displayUnit?.price_per_unit || product.unit_price || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          per {primaryUnitLabel} • Cost: ₱{(product.cost_price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <TouchButton
                        onClick={() => setSelectedProduct(product)}
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        className="w-full"
                      >
                        View Details
                      </TouchButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const stockStatus = getStockStatus(product);
                    const stockDisplay = formatStockDisplay(product);
                    const primaryUnitLabel = getPrimaryUnitLabel(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.supplier_id || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category?.name || 'Uncategorized'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stockDisplay}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{((product as any).displayUnit?.price_per_unit || product.unit_price || 0).toFixed(2)}
                          <div className="text-xs text-gray-500">per {primaryUnitLabel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Modal */}
      <Modal
        isOpen={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
        title="Low Stock Alert"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            The following products are running low on stock:
          </div>
          
          <div className="space-y-3">
            {lowStockProducts.map(product => {
              const stockDisplay = formatStockDisplay(product);
              const reorderLevel = product.inventory?.reorder_level || 0;
              const reorderDisplay = `${reorderLevel} ${product.unit_of_measure || 'units'}`;
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">SKU: {product.sku} • Current: {stockDisplay} • Threshold: {reorderDisplay}</div>
                  </div>
                  <span className="text-sm text-gray-500">
                    View Only
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <TouchButton
              onClick={() => setShowLowStockModal(false)}
              variant="outline"
            >
              Close
            </TouchButton>
          </div>
        </div>
      </Modal>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.sku}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.category?.name || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                <p className="mt-1 text-sm text-gray-900">{formatStockDisplay(selectedProduct)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.inventory?.reorder_level || 0} {selectedProduct.unit_of_measure || 'units'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                <p className="mt-1 text-sm text-gray-900">
                  ₱{((selectedProduct as any).displayUnit?.price_per_unit || selectedProduct.unit_price || 0).toFixed(2)}
                  {(selectedProduct as any).displayUnit && (
                    <span className="text-gray-500"> per {(selectedProduct as any).displayUnit.unit_label}</span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                <p className="mt-1 text-sm text-gray-900">₱{(selectedProduct.cost_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.supplier_id || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedProduct.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Available Units Section */}
            {(selectedProduct as any).productUnits && (selectedProduct as any).productUnits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Units</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedProduct as any).productUnits.map((unit: any) => (
                    <div key={unit.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{unit.unit_label}</div>
                          <div className="text-sm text-gray-600">
                            {unit.conversion_factor} {selectedProduct.unit_of_measure || 'units'} per {unit.unit_label}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">₱{unit.price_per_unit.toFixed(2)}</div>
                          {unit.is_base_unit && (
                            <div className="text-xs text-blue-600">Base Unit</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedProduct.expiry_date && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className={`mt-1 text-sm ${isExpiringSoon(selectedProduct.expiry_date) ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(selectedProduct.expiry_date).toLocaleDateString()}
                  {isExpiringSoon(selectedProduct.expiry_date) && ' (Expiring Soon!)'}
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <TouchButton
                onClick={() => setSelectedProduct(null)}
                variant="outline"
              >
                Close
              </TouchButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryScreen;















