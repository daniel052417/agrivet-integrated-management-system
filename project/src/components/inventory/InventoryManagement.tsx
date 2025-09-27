import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, X, Save, Package, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Branch {
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
  branch_id: string;
  is_active: boolean;
  updated_at: string | null;
  created_at: string | null;
  // Inventory data
  inventory_id: string;
  quantity_on_hand: number;
  quantity_available: number;
  reorder_level: number;
  max_stock_level: number;
  // Variant data
  variant_id: string;
  variant_name: string;
  variant_sku: string;
  price: number;
  cost: number | null;
  image_url?: string;
  // Additional fields from the query
  variant_type?: string;
  variant_value?: string;
  branch_name?: string;
  branch_code?: string;
}

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
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
    price: '',
    cost: '',
    stock_quantity: '',
    reorder_level: '',
    supplier_id: '',
    branch_id: '',
    description: '',
    variant_name: '',
    variant_sku: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image upload functions
  const uploadImage = async (file: File): Promise<string> => {
    try {
      setIsUploadingImage(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      console.log('Attempting to upload image to bucket: product-images');
      console.log('File path:', filePath);

      // Try to upload directly - if bucket doesn't exist, we'll get a clear error
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Check if it's a bucket not found error
        if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
          throw new Error('Storage bucket "product-images" not found. Please create it in your Supabase dashboard and make sure it\'s set to public.');
        }
        
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      console.log('Image URL will be saved to database:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error; // Re-throw the original error to preserve the message
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchProducts = async () => {
    console.log('🚀 Starting to fetch products...');
    setIsLoadingProducts(true);
    
    try {
      // Use RPC function to execute the complex SQL query
      const { data, error } = await supabase.rpc('get_inventory_with_details', {
        branch_filter: selectedBranch !== 'all' ? selectedBranch : null
      });
      
      if (error){ 
        console.error('❌ RPC Error:', error);
        throw error;
      }
      console.log('🔍 Raw inventory data fetched:', data);
      console.log('📊 Number of inventory records:', data?.length || 0);
      console.log('🏢 Selected branch:', selectedBranch);
      
      // Transform the data to match our interface
      const transformedData = data?.map((item: any) => ({
        id: item.product_id,
        name: item.product_name,
        sku: item.variant_name, // Using variant_name as SKU for display
        description: item.description,
        category_id: item.category_id,
        supplier_id: '', // Not in the query, will need to add if needed
        branch_id: item.branch_id,
        is_active: true, // Filtered by is_active in query
        updated_at: null, // Not in the query
        created_at: null, // Not in the query
        inventory_id: item.inventory_id,
        quantity_on_hand: item.quantity_on_hand,
        quantity_available: item.quantity_available,
        reorder_level: item.reorder_level,
        max_stock_level: item.max_stock_level,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        variant_sku: item.variant_sku, // Using variant_name as SKU
        price: item.price,
        cost: item.cost, // Not in the query, will need to add if needed
        image_url: item.image_url || null,
        // Additional fields from the query
        variant_type: item.variant_type,
        variant_value: item.variant_value,
        branch_name: item.branch_name,
        branch_code: item.branch_code
      })) || [];
      
      console.log('✅ Transformed data for display:', transformedData);
      console.log('📋 Number of products to display:', transformedData.length);
      
      setProducts(transformedData);
    } catch (err: any) {
      console.error('❌ Error fetching products:', err);
    setError('Failed to load products: ' + (err.message || 'Unknown error'));
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      console.log('🎯 Component mounted, starting data fetch...');
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (categoriesError) throw categoriesError;
        console.log('📂 Categories loaded:', categoriesData?.length || 0, 'categories');
        setCategories(categoriesData || []);

        // Fetch suppliers
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (suppliersError) throw suppliersError;
        console.log('🏭 Suppliers loaded:', suppliersData?.length || 0, 'suppliers');
        setSuppliers(suppliersData || []);

        // Fetch branches
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (branchesError) throw branchesError;
        console.log('🏢 Branches loaded:', branchesData?.length || 0, 'branches');
        setBranches(branchesData || []);

        await fetchProducts();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load categories and suppliers');
      }
    };

    fetchData();
  }, []);

  // Refetch products when branch selection changes
  useEffect(() => {
    if (branches.length > 0) {
      console.log('🔄 Branch selection changed, refetching products...');
      console.log('🏢 New selected branch:', selectedBranch);
      fetchProducts();
    }
  }, [selectedBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category_id || !formData.supplier_id || !formData.branch_id || !formData.price || !formData.stock_quantity) {
        throw new Error('Please fill in all required fields');
      }

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          // For now, continue without image rather than failing the entire form
          setError(`Image upload failed: ${uploadError?.message || 'Unknown error'}. Product will be saved without image.`);
          imageUrl = ''; // Set to empty string so we don't save an invalid URL
        }
      }

      if (modalMode === 'add') {
        // Create product first
        const productData = {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          supplier_id: formData.supplier_id,
          is_active: true
        };

        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (productError) throw productError;

        // Create product variant
        const variantData = {
          product_id: newProduct.id,
          name: formData.variant_name.trim() || formData.name.trim(),
          sku: formData.variant_sku.trim().toUpperCase() || formData.sku.trim().toUpperCase(),
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost) || parseFloat(formData.price) * 0.7,
          image_url: imageUrl || null,
          is_active: true
        };

        console.log('Creating product variant with data:', variantData);

        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert([variantData])
          .select()
          .single();

        if (variantError) throw variantError;

        // Create inventory record
        const inventoryData = {
          branch_id: formData.branch_id,
          product_variant_id: newVariant.id,
          quantity_on_hand: parseInt(formData.stock_quantity),
          quantity_reserved: 0,
          reorder_level: parseInt(formData.reorder_level) || Math.max(10, parseInt(formData.stock_quantity) * 0.2),
          max_stock_level: parseInt(formData.stock_quantity) * 2
        };

        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert([inventoryData]);

        if (inventoryError) throw inventoryError;

      } else if (modalMode === 'edit' && editingProductId) {
        // Find the product to get variant and inventory IDs
        const product = products.find(p => p.id === editingProductId);
        if (!product) throw new Error('Product not found');

        // Update product
        const productData = {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          supplier_id: formData.supplier_id
        };

        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId);

        if (productError) throw productError;

        // Update variant
        const variantData = {
          name: formData.variant_name.trim() || formData.name.trim(),
          sku: formData.variant_sku.trim().toUpperCase() || formData.sku.trim().toUpperCase(),
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost) || parseFloat(formData.price) * 0.7,
          image_url: imageUrl || null
        };

        const { error: variantError } = await supabase
          .from('product_variants')
          .update(variantData)
          .eq('id', product.variant_id);

        if (variantError) throw variantError;

        // Update inventory
        const inventoryData = {
          quantity_on_hand: parseInt(formData.stock_quantity),
          reorder_level: parseInt(formData.reorder_level) || Math.max(10, parseInt(formData.stock_quantity) * 0.2),
          max_stock_level: parseInt(formData.stock_quantity) * 2
        };

        const { error: inventoryError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', product.inventory_id);

        if (inventoryError) throw inventoryError;
      }

      // Error handling is done in individual operations above

      // Success
      setSuccess(modalMode === 'add' ? 'Product added successfully!' : 'Product updated successfully!');
      await fetchProducts();
      setIsModalOpen(false);
      setFormData({
        name: '',
        category_id: '',
        sku: '',
        price: '',
        cost: '',
        stock_quantity: '',
        reorder_level: '',
        supplier_id: '',
        branch_id: '',
        description: '',
        variant_name: '',
        variant_sku: '',
        image_url: ''
      });
      setImageFile(null);
      setImagePreview(null);
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
      price: '',
      cost: '',
      stock_quantity: '',
      reorder_level: '',
      supplier_id: '',
      branch_id: '',
      description: '',
      variant_name: '',
      variant_sku: '',
      image_url: ''
    });
    setImageFile(null);
    setImagePreview(null);
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


  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    try {
      // Find the product to get variant and inventory IDs
      const product = products.find(p => p.id === id);
      if (!product) throw new Error('Product not found');

      // Delete inventory record first (due to foreign key constraints)
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', product.inventory_id);
      if (inventoryError) throw inventoryError;

      // Delete product variant
      const { error: variantError } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', product.variant_id);
      if (variantError) throw variantError;

      // Delete product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (productError) throw productError;

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
      price: '',
      cost: '',
      stock_quantity: '',
      reorder_level: '',
      supplier_id: '',
      branch_id: '',
      description: '',
      variant_name: '',
      variant_sku: '',
      image_url: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingProductId(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductRow) => {
    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      sku: product.sku || '',
      price: String(product.price ?? ''),
      cost: String(product.cost ?? ''),
      stock_quantity: String(product.quantity_on_hand ?? ''),
      reorder_level: String(product.reorder_level ?? ''),
      supplier_id: product.supplier_id || '',
      branch_id: product.branch_id || '',
      description: product.description || '',
      variant_name: product.variant_name || '',
      variant_sku: product.variant_sku || '',
      image_url: product.image_url || ''
    });
    setImageFile(null);
    setImagePreview(product.image_url || null);
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
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

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
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product / Branch
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
                  Variant
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
                  const status = product.quantity_on_hand === 0
                    ? 'Out of Stock'
                    : (product.reorder_level != null && product.quantity_on_hand <= product.reorder_level)
                      ? 'Low Stock'
                      : 'In Stock';
                  return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.branch_name || '—'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantity_on_hand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{Number(product.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{product.variant_name}</div>
                      {product.variant_type && (
                        <div className="text-xs text-gray-500">{product.variant_type}: {product.variant_value}</div>
                      )}
                    </div>
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
                    <label htmlFor="productBranch" className="block text-sm font-medium text-gray-700 mb-2">
                      Branch *
                    </label>
                    <select
                      id="productBranch"
                      value={formData.branch_id}
                      onChange={(e) => setFormData(prev => ({...prev, branch_id: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₱) *
                    </label>
                    <input
                      type="number"
                      id="productPrice"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="productCost" className="block text-sm font-medium text-gray-700 mb-2">
                      Cost (₱)
                    </label>
                    <input
                      type="number"
                      id="productCost"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({...prev, cost: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="productReorderLevel"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      id="productReorderLevel"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reorder_level: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="10"
                      min="0"
                    />
                  </div>


                  {/* Form Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="productVariantName" className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Name
                    </label>
                    <input
                      type="text"
                      id="productVariantName"
                      value={formData.variant_name}
                      onChange={(e) => setFormData(prev => ({...prev, variant_name: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Leave empty to use product name"
                    />
                  </div>

                  <div>
                    <label htmlFor="productVariantSku" className="block text-sm font-medium text-gray-700 mb-2">
                      Variant SKU
                    </label>
                    <input
                      type="text"
                      id="productVariantSku"
                      value={formData.variant_sku}
                      onChange={(e) => setFormData(prev => ({...prev, variant_sku: e.target.value.toUpperCase()}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Leave empty to use product SKU"
                    />
                  </div>
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

                {/* Image Upload Section */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {(imagePreview || formData.image_url) && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || formData.image_url}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{imagePreview || formData.image_url ? 'Change Image' : 'Upload Image'}</span>
                          </>
                        )}
                      </button>
                      
                      {!imagePreview && !formData.image_url && (
                        <span className="text-sm text-gray-500">
                          JPG, PNG, GIF up to 5MB
                        </span>
                      )}
                    </div>

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
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