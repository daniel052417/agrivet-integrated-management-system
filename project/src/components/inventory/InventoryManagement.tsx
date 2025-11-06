import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, X, Save, Package, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { InventoryManagementRow, ProductFormData } from '../../types/inventory';
import { useInventoryManagementData } from '../../hooks/useInventoryManagementData';

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data fetching with RBAC filtering - uses hook
  const {
    products,
    categories,
    suppliers,
    branches,
    brands,
    loading: isLoadingProducts,
    error: dataError,
    refreshProducts
  } = useInventoryManagementData();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category_id: '',
    sku: '',
    price_per_unit: '',
    stock_quantity: '',
    reorder_level: '',
    supplier_id: '',
    branch_id: '',
    description: '',
    unit_name: '',
    unit_label: '',
    conversion_factor: '1',
    min_sellable_quantity: '1',
    image_url: '',
    barcode: '',
    brand: '',
    enable_multi_unit: false,
    batch_no: '',
    expiration_date: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product units state for multi-unit management
  interface ProductUnit {
    id: string;
    unit_name: string;
    unit_label: string;
    conversion_factor: string;
    price_per_unit: string;
    min_sellable_quantity: string;
    is_base_unit: boolean;
  }

  const [productUnits, setProductUnits] = useState<ProductUnit[]>([
    {
      id: '1',
      unit_name: '',
      unit_label: '',
      conversion_factor: '1',
      price_per_unit: '',
      min_sellable_quantity: '1',
      is_base_unit: true
    }
  ]);

  // Image upload functions
  const uploadImage = async (file: File): Promise<string> => {
  try {
    setIsUploadingImage(true);
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // ✅ FIXED: No prefix needed

    console.log('Attempting to upload image to bucket: product-images');
    console.log('File path:', filePath);

    // Upload to storage
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
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  } finally {
    setIsUploadingImage(false);
  }
};

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setLocalError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Image size must be less than 5MB');
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

  // Refetch products when filters change
  useEffect(() => {
    if (branches.length > 0) {
      console.log('🔄 Filters changed, refetching products...');
      console.log('🏢 Selected branch:', selectedBranch);
      console.log('📂 Selected category:', selectedCategory);
      console.log('🔍 Search term:', searchTerm);
      refreshProducts({
        searchTerm,
        selectedBranch,
        selectedCategory
      });
    }
  }, [selectedBranch, selectedCategory, searchTerm, branches.length, refreshProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    setSuccess(null);

    try {
      // Validate required fields based on mode
      if (!formData.name || !formData.sku || !formData.category_id || !formData.supplier_id || !formData.branch_id || !formData.stock_quantity) {
        throw new Error('Please fill in all required fields');
      }

      // Additional validation for single-unit mode
      if (!formData.enable_multi_unit) {
        if (!formData.price_per_unit || !formData.unit_name) {
          throw new Error('Please fill in Price per Unit and Unit Name');
        }
      }

      // Additional validation for multi-unit mode
      if (formData.enable_multi_unit) {
        if (productUnits.length === 0) {
          throw new Error('Please add at least one unit');
        }
        
        // Check if exactly one base unit exists
        const baseUnits = productUnits.filter(u => u.is_base_unit);
        if (baseUnits.length !== 1) {
          throw new Error('Please select exactly one base unit');
        }

        // Check all units have required fields
        for (const unit of productUnits) {
          if (!unit.unit_name || !unit.unit_label || !unit.price_per_unit) {
            throw new Error('Please fill in all unit fields');
          }
        }
      }

      // Upload image if selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          // For now, continue without image rather than failing the entire form
          setLocalError(`Image upload failed: ${uploadError?.message || 'Unknown error'}. Product will be saved without image.`);
          imageUrl = ''; // Set to empty string so we don't save an invalid URL
        }
      }

      if (modalMode === 'add') {
        // Determine the unit_of_measure (base unit label)
        const baseUnitLabel = formData.enable_multi_unit 
          ? productUnits.find(u => u.is_base_unit)?.unit_label || 'pcs'
          : formData.unit_label || 'pcs';

        // Create product first
        const productData = {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          supplier_id: formData.supplier_id,
          brand: formData.brand || null,
          unit_of_measure: baseUnitLabel,
          image_url: imageUrl || null,
          is_active: true,
          batch_no: formData.batch_no || null,
          expiration_date: formData.expiration_date || null
        };

        console.log('Creating product with data:', productData);

        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (productError) throw productError;

        // Create product units based on mode
        if (formData.enable_multi_unit) {
          // Multi-unit mode: Create multiple units
          const unitsToInsert = productUnits.map(unit => ({
            product_id: newProduct.id,
            unit_name: unit.unit_name.trim(),
            unit_label: unit.unit_label.trim(),
            conversion_factor: parseFloat(unit.conversion_factor),
            is_base_unit: unit.is_base_unit,
            is_sellable: true,
            price_per_unit: parseFloat(unit.price_per_unit),
            min_sellable_quantity: parseFloat(unit.min_sellable_quantity)
          }));

          console.log('Creating multiple product units:', unitsToInsert);

          const { data: newUnits, error: unitError } = await supabase
            .from('product_units')
            .insert(unitsToInsert)
            .select();

          if (unitError) throw unitError;

          // Get the base unit for inventory
          const baseUnit = newUnits?.find(u => u.is_base_unit);
          if (!baseUnit) throw new Error('Failed to create base unit');

          // Create inventory record with base unit
          const inventoryData = {
            branch_id: formData.branch_id,
            product_id: newProduct.id,
            quantity_on_hand: parseFloat(formData.stock_quantity),
            quantity_reserved: 0,
            reorder_level: parseFloat(formData.reorder_level) || Math.max(10, parseFloat(formData.stock_quantity) * 0.2),
            max_stock_level: parseFloat(formData.stock_quantity) * 2,
            base_unit: baseUnit.unit_label
          };

          const { error: inventoryError } = await supabase
            .from('inventory')
            .insert([inventoryData]);

          if (inventoryError) throw inventoryError;

        } else {
          // Single-unit mode: Create one unit
          const unitData = {
            product_id: newProduct.id,
            unit_name: formData.unit_name.trim() || formData.name.trim(),
            unit_label: formData.unit_label.trim() || 'pcs',
            conversion_factor: parseFloat(formData.conversion_factor),
            is_base_unit: true,
            is_sellable: true,
            price_per_unit: parseFloat(formData.price_per_unit),
            min_sellable_quantity: parseFloat(formData.min_sellable_quantity)
          };

          console.log('Creating single product unit with data:', unitData);

          const { data: newUnit, error: unitError } = await supabase
            .from('product_units')
            .insert([unitData])
            .select()
            .single();

          if (unitError) throw unitError;

          // Create inventory record
          const inventoryData = {
            branch_id: formData.branch_id,
            product_id: newProduct.id,
            quantity_on_hand: parseFloat(formData.stock_quantity),
            quantity_reserved: 0,
            reorder_level: parseFloat(formData.reorder_level) || Math.max(10, parseFloat(formData.stock_quantity) * 0.2),
            max_stock_level: parseFloat(formData.stock_quantity) * 2,
            base_unit: newUnit.unit_label
          };

          const { error: inventoryError } = await supabase
            .from('inventory')
            .insert([inventoryData]);

          if (inventoryError) throw inventoryError;
        }

      } else if (modalMode === 'edit' && editingProductId) {
        // Find the product to get unit and inventory IDs
        const product = products.find(p => p.product_id === editingProductId);
        if (!product) throw new Error('Product not found');

        // Update product
        const productData = {
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          description: formData.description.trim(),
          category_id: formData.category_id,
          brand: formData.brand || null,
          image_url: imageUrl || null,
          supplier_id: formData.supplier_id,
          batch_no: formData.batch_no || null,
          expiration_date: formData.expiration_date || null
        };

        const { error: productError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProductId);

        if (productError) throw productError;

        // Handle units based on multi-unit mode
        if (formData.enable_multi_unit) {
          // Delete existing units for this product (except the ones we're updating)
          const existingUnitIds = productUnits.filter(u => u.id && !u.id.startsWith('temp-')).map(u => u.id);
          
          if (existingUnitIds.length > 0) {
            await supabase
              .from('product_units')
              .delete()
              .eq('product_id', editingProductId)
              .not('id', 'in', `(${existingUnitIds.join(',')})`);
          } else {
            // Delete all existing units if we're creating all new ones
            await supabase
              .from('product_units')
              .delete()
              .eq('product_id', editingProductId);
          }
          // Update existing units and create new ones
          for (const unit of productUnits) {
            if (unit.id && !unit.id.startsWith('temp-')) {
              // Update existing unit
              const { error: updateError } = await supabase
                .from('product_units')
                .update({
                  unit_name: unit.unit_name.trim(),
                  unit_label: unit.unit_label.trim(),
                  conversion_factor: parseFloat(unit.conversion_factor),
                  is_base_unit: unit.is_base_unit,
                  price_per_unit: parseFloat(unit.price_per_unit),
                  min_sellable_quantity: parseFloat(unit.min_sellable_quantity)
                })
                .eq('id', unit.id);

              if (updateError) throw updateError;
            } else {
              // Create new unit
              const { error: createError } = await supabase
                .from('product_units')
                .insert({
                  product_id: editingProductId,
                  unit_name: unit.unit_name.trim(),
                  unit_label: unit.unit_label.trim(),
                  conversion_factor: parseFloat(unit.conversion_factor),
                  is_base_unit: unit.is_base_unit,
                  is_sellable: true,
                  price_per_unit: parseFloat(unit.price_per_unit),
                  min_sellable_quantity: parseFloat(unit.min_sellable_quantity)
                });

              if (createError) throw createError;
            }
          }
        } else {
          // Single unit mode - just update the primary unit
          const unitData = {
            unit_name: formData.unit_name.trim() || formData.name.trim(),
            unit_label: formData.unit_label.trim() || 'pcs',
            conversion_factor: parseFloat(formData.conversion_factor),
            price_per_unit: parseFloat(formData.price_per_unit),
            min_sellable_quantity: parseFloat(formData.min_sellable_quantity)
          };

          const { error: unitError } = await supabase
            .from('product_units')
            .update(unitData)
            .eq('id', product.primary_unit_id);

          if (unitError) throw unitError;
        }

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

        // Check and send low stock alert if stock is below threshold
        try {
          const LowStockAlertService = (await import('../../lib/alerts/lowStockAlertService')).default;
          await LowStockAlertService.checkAndSendLowStockAlert(product.id);
        } catch (alertError) {
          // Don't fail the update if alert fails
          console.warn('Failed to send low stock alert:', alertError);
        }
      }

      // Error handling is done in individual operations above

      // Success
      setSuccess(modalMode === 'add' ? 'Product added successfully!' : 'Product updated successfully!');
      await refreshProducts({
        searchTerm,
        selectedBranch,
        selectedCategory
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        category_id: '',
        sku: '',
        price_per_unit: '',
        stock_quantity: '',
        reorder_level: '',
        supplier_id: '',
        branch_id: '',
        description: '',
        unit_name: '',
        unit_label: '',
        conversion_factor: '1',
        min_sellable_quantity: '1',
        image_url: '',
        brand: '',
        enable_multi_unit: false,
        batch_no: '',
        expiration_date: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setEditingProductId(null);
      setModalMode('add');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('Error adding product:', error);
      setLocalError(error.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      price_per_unit: '',
      stock_quantity: '',
      reorder_level: '',
      supplier_id: '',
      branch_id: '',
      description: '',
      unit_name: '',
      unit_label: '',
      conversion_factor: '1',
      min_sellable_quantity: '1',
      image_url: '',
      barcode: '',
      brand: '',
      enable_multi_unit: false,
      batch_no: '',
      expiration_date: ''
    });
    setProductUnits([
      {
        id: '1',
        unit_name: '',
        unit_label: '',
        conversion_factor: '1',
        price_per_unit: '',
        min_sellable_quantity: '1',
        is_base_unit: true
      }
    ]);
    setImageFile(null);
    setImagePreview(null);
    setLocalError(null);
    setSuccess(null);
  };

  // Multi-unit management functions
  const addProductUnit = () => {
    const newUnit: ProductUnit = {
      id: `temp-${Date.now()}`,
      unit_name: '',
      unit_label: '',
      conversion_factor: '1',
      price_per_unit: '',
      min_sellable_quantity: '1',
      is_base_unit: false
    };
    setProductUnits([...productUnits, newUnit]);
  };

  const removeProductUnit = (id: string) => {
    if (productUnits.length <= 1) {
      setLocalError('At least one unit is required');
      return;
    }
    setProductUnits(productUnits.filter(unit => unit.id !== id));
  };

  const updateProductUnit = (id: string, field: keyof ProductUnit, value: string | boolean) => {
    setProductUnits(productUnits.map(unit => 
      unit.id === id ? { ...unit, [field]: value } : unit
    ));
  };

  const setBaseUnit = (id: string) => {
    setProductUnits(productUnits.map(unit => ({
      ...unit,
      is_base_unit: unit.id === id
    })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Near Expiry':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProductStatus = (product: InventoryManagementRow) => {
    // Get both stock and expiry statuses
    let stockStatus = product.stock_status;
    let expiryStatus = null;
    
    // Check expiry status
    if (product.expiration_date) {
      const today = new Date();
      const expiryDate = new Date(product.expiration_date);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        expiryStatus = 'Expired';
      } else if (daysUntilExpiry <= 30) {
        expiryStatus = 'Near Expiry';
      }
    }
    
    return { stockStatus, expiryStatus };
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    try {
      // Find the product to get unit and inventory IDs
      const product = products.find(p => p.product_id === id);
      if (!product) throw new Error('Product not found');

      // Delete inventory record first (due to foreign key constraints)
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', product.inventory_id);
      if (inventoryError) throw inventoryError;

      // Delete product unit
      const { error: unitError } = await supabase
        .from('product_units')
        .delete()
        .eq('id', product.primary_unit_id);
      if (unitError) throw unitError;

      // Delete product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (productError) throw productError;

      await refreshProducts({
        searchTerm,
        selectedBranch,
        selectedCategory
      });
    } catch (err: any) {
      console.error('Delete failed', err);
      setLocalError('Failed to delete product');
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      price_per_unit: '',
      stock_quantity: '',
      reorder_level: '',
      supplier_id: '',
      branch_id: '',
      description: '',
      unit_name: '',
      unit_label: '',
      conversion_factor: '1',
      min_sellable_quantity: '1',
      image_url: '',
      brand: '',
      enable_multi_unit: false,
      batch_no: '',
      expiration_date: ''
    });
    setProductUnits([{
      id: '1',
      unit_name: '',
      unit_label: '',
      conversion_factor: '1',
      price_per_unit: '',
      min_sellable_quantity: '1',
      is_base_unit: true
    }]);
    setImageFile(null);
    setImagePreview(null);
    setEditingProductId(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = async (product: InventoryManagementRow) => {
    try {
      // Fetch all units for this product
      const { data: units, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', product.product_id)
        .order('is_base_unit', { ascending: false });

      if (error) throw error;

      // Check if product has multiple units
      const hasMultipleUnits = units && units.length > 1;

      // Set form data
      setFormData({
        name: product.product_name || '',
        category_id: product.category_id || '',
        sku: product.sku || '',
        price_per_unit: String(product.price_per_unit ?? ''),
        stock_quantity: String(product.quantity_available ?? ''),
        reorder_level: String(product.reorder_level ?? ''),
        supplier_id: product.supplier_id || '',
        branch_id: product.branch_id || '',
        description: product.description || '',
        unit_name: product.unit_name || '',
        unit_label: product.unit_label || '',
        conversion_factor: String(product.conversion_factor ?? '1'),
        min_sellable_quantity: String(product.min_sellable_quantity ?? '1'),
        image_url: product.image_url || '',
        barcode: product.barcode || '',
        brand: product.brand || '',
        enable_multi_unit: hasMultipleUnits,
        batch_no: product.batch_no || '',
        expiration_date: product.expiration_date || ''
      });

      // If product has multiple units, load them into productUnits state
      if (hasMultipleUnits && units) {
        setProductUnits(units.map(unit => ({
          id: unit.id,
          unit_name: unit.unit_name,
          unit_label: unit.unit_label,
          conversion_factor: String(unit.conversion_factor),
          price_per_unit: String(unit.price_per_unit),
          min_sellable_quantity: String(unit.min_sellable_quantity),
          is_base_unit: unit.is_base_unit
        })));
      } else {
        // Reset to single unit
        setProductUnits([{
          id: '1',
          unit_name: product.unit_name || '',
          unit_label: product.unit_label || '',
          conversion_factor: '1',
          price_per_unit: String(product.price_per_unit || ''),
          min_sellable_quantity: '1',
          is_base_unit: true
        }]);
      }

      setImageFile(null);
      setImagePreview(product.image_url || null);
      setEditingProductId(product.product_id);
      setModalMode('edit');
      setIsModalOpen(true);
   

    } catch (error) {
      console.error('Error fetching product units:', error);
      setLocalError('Failed to load product details');
    }
  };

  // Combine data error and local error for display
  const displayError = localError || dataError;
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

      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
          <p className="text-red-800 font-medium">{displayError}</p>
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
                  Batch No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isLoadingProducts ? [] : products).map((product) => {
                return (
              <tr key={product.inventory_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                    <div className="text-sm text-gray-500">{product.branch_name || '—'}</div>
                    {product.brand && (
                      <div className="text-xs text-gray-400">Brand: {product.brand}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{product.quantity_available}</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₱{Number(product.price_per_unit || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.batch_no || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {product.expiration_date ? (
                    <span className={(() => {
                      const today = new Date();
                      const expiryDate = new Date(product.expiration_date);
                      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (daysUntilExpiry < 0) {
                        return 'text-red-600 font-semibold';
                      } else if (daysUntilExpiry <= 30) {
                        return 'text-yellow-600 font-semibold';
                      }
                      return 'text-gray-900';
                    })()}>
                      {new Date(product.expiration_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {(() => {
                      const { stockStatus, expiryStatus } = getProductStatus(product);
                      return (
                        <>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(stockStatus)}`}>
                            {stockStatus}
                          </span>
                          {expiryStatus && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expiryStatus)} ml-1`}>
                              {expiryStatus}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{product.unit_name}</div>
                    <div className="text-xs text-gray-500">{product.unit_label} • {product.conversion_factor}x</div>
                    {product.units && product.units.length > 1 && (
                      <div className="text-xs text-blue-600">+{product.units.length - 1} more units</div>
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
                    <button onClick={() => handleDelete(product.product_id)} className="text-red-600 hover:text-red-900">
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
                    <label htmlFor="productBrand" className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      id="productBrand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({...prev, brand: e.target.value}))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Brand (Optional)</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!formData.enable_multi_unit && (
                    <>
                      <div>
                        <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-2">
                          Price per Unit (₱) *
                        </label>
                        <input
                          type="number"
                          id="productPrice"
                          value={formData.price_per_unit}
                          onChange={(e) => setFormData(prev => ({...prev, price_per_unit: e.target.value}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="unitName" className="block text-sm font-medium text-gray-700 mb-2">
                          Unit Name *
                        </label>
                        <input
                          type="text"
                          id="unitName"
                          value={formData.unit_name}
                          onChange={(e) => setFormData(prev => ({...prev, unit_name: e.target.value}))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="e.g., Kilogram, Liter, Piece"
                          required
                        />
                      </div>
                    </>
                  )}

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

                  <div>
                    <label
                      htmlFor="batchNo"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Batch Number
                    </label>
                    <input
                      type="text"
                      id="batchNo"
                      value={formData.batch_no}
                      onChange={(e) => setFormData((prev) => ({ ...prev, batch_no: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., BN-2025-001"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="expirationDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      id="expirationDate"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expiration_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="col-span-full">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="enableMultiUnit"
                        checked={formData.enable_multi_unit}
                        onChange={(e) => setFormData((prev) => ({ ...prev, enable_multi_unit: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="enableMultiUnit" className="text-sm font-medium text-gray-700">
                        Enable Multi Unit
                      </label>
                      <span className="text-xs text-gray-500">
                        (Allow this product to be sold in different units with different prices)
                      </span>
                    </div>
                  </div>


                  {/* Form Error Display */}
                  {localError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{localError}</p>
                    </div>
                  )}
                </div>

                {/* Conditional Unit Fields - Single or Multi Unit */}
                {!formData.enable_multi_unit ? (
                  // Single Unit Mode - Original fields
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="unitLabel" className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Label
                      </label>
                      <input
                        type="text"
                        id="unitLabel"
                        value={formData.unit_label}
                        onChange={(e) => setFormData(prev => ({...prev, unit_label: e.target.value}))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., kg, L, pcs"
                      />
                    </div>

                    <div>
                      <label htmlFor="conversionFactor" className="block text-sm font-medium text-gray-700 mb-2">
                        Conversion Factor
                      </label>
                      <input
                        type="number"
                        id="conversionFactor"
                        value={formData.conversion_factor}
                        onChange={(e) => setFormData(prev => ({...prev, conversion_factor: e.target.value}))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1.0"
                        step="0.0001"
                        min="0.0001"
                      />
                    </div>

                    <div>
                      <label htmlFor="minSellableQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                        Min Sellable Quantity
                      </label>
                      <input
                        type="number"
                        id="minSellableQuantity"
                        value={formData.min_sellable_quantity}
                        onChange={(e) => setFormData(prev => ({...prev, min_sellable_quantity: e.target.value}))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="1"
                        step="0.001"
                        min="0.001"
                      />
                    </div>
                  </div>
                ) : (
                  // Multi-Unit Mode - Dynamic unit manager
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Product Units</h3>
                      <button
                        type="button"
                        onClick={addProductUnit}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Unit</span>
                      </button>
                    </div>

                    {productUnits.map((unit, index) => (
                      <div key={unit.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-700">
                              Unit {index + 1}
                            </span>
                            {unit.is_base_unit && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Base Unit
                              </span>
                            )}
                          </div>
                          {productUnits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProductUnit(unit.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove unit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit Name *
                            </label>
                            <input
                              type="text"
                              value={unit.unit_name}
                              onChange={(e) => updateProductUnit(unit.id, 'unit_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Box, Case"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unit Label *
                            </label>
                            <input
                              type="text"
                              value={unit.unit_label}
                              onChange={(e) => updateProductUnit(unit.id, 'unit_label', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., box, case"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Conversion *
                            </label>
                            <input
                              type="number"
                              value={unit.conversion_factor}
                              onChange={(e) => updateProductUnit(unit.id, 'conversion_factor', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1.0"
                              step="0.0001"
                              min="0.0001"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price (₱) *
                            </label>
                            <input
                              type="number"
                              value={unit.price_per_unit}
                              onChange={(e) => updateProductUnit(unit.id, 'price_per_unit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Qty *
                            </label>
                            <input
                              type="number"
                              value={unit.min_sellable_quantity}
                              onChange={(e) => updateProductUnit(unit.id, 'min_sellable_quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="1"
                              step="0.001"
                              min="0.001"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="baseUnit"
                              checked={unit.is_base_unit}
                              onChange={() => setBaseUnit(unit.id)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Set as base unit</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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