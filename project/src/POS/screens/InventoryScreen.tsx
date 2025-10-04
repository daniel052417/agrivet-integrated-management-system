import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  Package, 
  Calendar,
  BarChart3,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import TouchButton from '../components/shared/TouchButton';
import Modal from '../components/shared/Modal';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  batchNumber?: string;
  expiryDate?: string;
  supplier: string;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'discontinued';
}

const InventoryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Mock products data
  const products: Product[] = [
    {
      id: '1',
      name: 'Premium Chicken Feed 50kg',
      sku: 'PCF-50',
      barcode: '1234567890123',
      category: 'Feed',
      price: 1250.00,
      cost: 1000.00,
      stock: 25,
      lowStockThreshold: 5,
      batchNumber: 'B2024001',
      expiryDate: '2025-12-31',
      supplier: 'AgriFeed Corp',
      lastUpdated: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Vitamin Supplement 1L',
      sku: 'VS-1L',
      barcode: '1234567890124',
      category: 'Supplements',
      price: 450.00,
      cost: 350.00,
      stock: 3,
      lowStockThreshold: 5,
      batchNumber: 'B2024002',
      expiryDate: '2025-06-30',
      supplier: 'VitaCorp',
      lastUpdated: '2024-01-14',
      status: 'active'
    },
    {
      id: '3',
      name: 'Antibiotic Injection 10ml',
      sku: 'AI-10',
      barcode: '1234567890125',
      category: 'Medication',
      price: 85.00,
      cost: 60.00,
      stock: 50,
      lowStockThreshold: 10,
      batchNumber: 'B2024003',
      expiryDate: '2025-03-31',
      supplier: 'MediVet',
      lastUpdated: '2024-01-13',
      status: 'active'
    },
    {
      id: '4',
      name: 'Poultry Waterer 5L',
      sku: 'PW-5L',
      category: 'Equipment',
      price: 180.00,
      cost: 120.00,
      stock: 2,
      lowStockThreshold: 3,
      supplier: 'FarmEquip',
      lastUpdated: '2024-01-12',
      status: 'active'
    }
  ];

  const categories = ['all', 'Feed', 'Supplements', 'Medication', 'Equipment', 'Tools'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(product => product.stock <= product.lowStockThreshold);

  const totalValue = products.reduce((total, product) => total + (product.stock * product.cost), 0);
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (product.stock <= product.lowStockThreshold) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
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
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
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
            
            <TouchButton
              onClick={() => setShowAddProductModal(true)}
              variant="primary"
              icon={Plus}
            >
              Add Product
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
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product);
              const expiringSoon = isExpiringSoon(product.expiryDate);
              
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
                        <div>Category: {product.category}</div>
                        <div>Stock: {product.stock} units</div>
                        {product.batchNumber && <div>Batch: {product.batchNumber}</div>}
                        {product.expiryDate && (
                          <div className={`flex items-center ${expiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {new Date(product.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-lg font-bold text-green-600">₱{product.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Cost: ₱{product.cost.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <TouchButton
                        onClick={() => setSelectedProduct(product)}
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        className="flex-1"
                      >
                        View
                      </TouchButton>
                      <TouchButton
                        onClick={() => console.log('Edit product:', product.id)}
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        className="flex-1"
                      >
                        Edit
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
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.supplier}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log('Edit product:', product.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => console.log('Delete product:', product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600">SKU: {product.sku} • Current: {product.stock} • Threshold: {product.lowStockThreshold}</div>
                </div>
                <TouchButton
                  onClick={() => console.log('Reorder product:', product.id)}
                  variant="warning"
                  size="sm"
                >
                  Reorder
                </TouchButton>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <TouchButton
              onClick={() => setShowLowStockModal(false)}
              variant="outline"
            >
              Close
            </TouchButton>
            <TouchButton
              onClick={() => console.log('Generate reorder report')}
              variant="primary"
              icon={Download}
            >
              Generate Report
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
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.stock} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.lowStockThreshold} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                <p className="mt-1 text-sm text-gray-900">₱{selectedProduct.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                <p className="mt-1 text-sm text-gray-900">₱{selectedProduct.cost.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedProduct.lastUpdated).toLocaleDateString()}</p>
              </div>
            </div>
            
            {selectedProduct.batchNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <p className="mt-1 text-sm text-gray-900">{selectedProduct.batchNumber}</p>
              </div>
            )}
            
            {selectedProduct.expiryDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <p className={`mt-1 text-sm ${isExpiringSoon(selectedProduct.expiryDate) ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(selectedProduct.expiryDate).toLocaleDateString()}
                  {isExpiringSoon(selectedProduct.expiryDate) && ' (Expiring Soon!)'}
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
              <TouchButton
                onClick={() => console.log('Edit product:', selectedProduct.id)}
                variant="primary"
                icon={Edit}
              >
                Edit Product
              </TouchButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InventoryScreen;















