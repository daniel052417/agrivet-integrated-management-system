import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, X, Save, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string;
  supplier_id: string;
  unit_price: number;
  cost_price: number | null;
  stock_quantity: number;
  minimum_stock: number | null;
  is_active: boolean;
  updated_at: string | null;
  created_at: string | null;
}

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    unit_price: '',
    stock_quantity: '',
    supplier_id: '',
    description: ''
  });

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, description, category_id, supplier_id, unit_price, cost_price, stock_quantity, minimum_stock, is_active, updated_at, created_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProducts(data as ProductRow[] || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);
        await fetchProducts();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load categories and suppliers');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category_id || !formData.supplier_id || !formData.unit_price || !formData.stock_quantity) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for insertion
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        supplier_id: formData.supplier_id,
        unit_price: parseFloat(formData.unit_price),
        cost_price: parseFloat(formData.unit_price) * 0.7, // Assuming 30% markup
        stock_quantity: parseInt(formData.stock_quantity),
        minimum_stock: Math.max(10, parseInt(formData.stock_quantity) * 0.2), // 20% of initial stock or minimum 10
        is_active: true
      };

      let error: any = null;
      if (modalMode === 'add') {
        const res = await supabase
          .from('products')
          .insert([productData])
          .select();
        error = res.error;
      } else if (modalMode === 'edit' && editingProductId) {
        const res = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId)
          .select();
        error = res.error;
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error('A product with this SKU already exists');
        }
        throw error;
      }

      // Success
      setSuccess(modalMode === 'add' ? 'Product added successfully!' : 'Product updated successfully!');
      await fetchProducts();
      setIsModalOpen(false);
      setFormData({
        name: '',
        category_id: '',
        sku: '',
        unit_price: '',
        stock_quantity: '',
        supplier_id: '',
        description: ''
      });
      setEditingProductId(null);
      setModalMode('add');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('Error adding product:', error);
      setError(error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      unit_price: '',
      stock_quantity: '',
      supplier_id: '',
      description: ''
    });
    setError(null);
    setSuccess(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await fetchProducts();
    } catch (err: any) {
      console.error('Delete failed', err);
      setError('Failed to delete product');
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      unit_price: '',
      stock_quantity: '',
      supplier_id: '',
      description: ''
    });
    setEditingProductId(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductRow) => {
    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      sku: product.sku || '',
      unit_price: String(product.unit_price ?? ''),
      stock_quantity: String(product.stock_quantity ?? ''),
      supplier_id: product.supplier_id || '',
      description: product.description || ''
    });
    setEditingProductId(product.id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Save className="w-3 h-3 text-white" />
          </div>
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button 
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isLoadingProducts ? [] : products)
                .filter((p) => selectedCategory === 'all' || p.category_id === selectedCategory)
                .filter((p) => {
                  const q = searchTerm.trim().toLowerCase();
                  if (!q) return true;
                  return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                })
                .map((product) => {
                  const categoryName = categories.find(c => c.id === product.category_id)?.name || '—';
                  const supplierName = suppliers.find(s => s.id === product.supplier_id)?.name || '—';
                  const status = product.stock_quantity === 0
                    ? 'Out of Stock'
                    : (product.minimum_stock != null && product.stock_quantity <= product.minimum_stock)
                      ? 'Low Stock'
                      : 'In Stock';
                  return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{supplierName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{Number(product.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(product.updated_at || product.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="View (coming soon)">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(product)} className="text-green-600 hover:text-green-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
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
        {isLoadingProducts && (
          <div className="p-6 text-sm text-gray-500">Loading products...</div>
        )}
        {!isLoadingProducts && products.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No products found</div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      id="productName"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="productSku" className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      id="productSku"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value.toUpperCase()}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter SKU"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="productCategory"
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({...prev, category_id: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="productSupplier" className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier *
                    </label>
                    <select
                      id="productSupplier"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData(prev => ({...prev, supplier_id: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price (₱) *
                    </label>
                    <input
                      type="number"
                      id="productPrice"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({...prev, unit_price: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="productStock"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      id="productStock"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: e.target.value }))}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>


                  {/* Form Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="productDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter product description (optional)"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{modalMode === 'add' ? 'Add Product' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;