import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Save, Tag, 
  AlertCircle, CheckCircle, Upload, Image as ImageIcon, FolderTree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Brand {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    image_url: ''
  });

  useEffect(() => {
    loadBrands();
    loadCategories();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setBrands(data || []);
    } catch (err: any) {
      console.error('Error loading brands:', err);
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBrandCategories = async (brandId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('brand_categories')
        .select('category_id')
        .eq('brand_id', brandId);

      if (fetchError) throw fetchError;
      const categoryIds = (data || []).map(item => item.category_id);
      setSelectedCategoryIds(categoryIds);
    } catch (err: any) {
      console.error('Error loading brand categories:', err);
      setError(err.message || 'Failed to load brand categories');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setUploading(true);
      setError(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `brands/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let brandId: string;

      if (editingBrand) {
        // Update existing brand
        brandId = editingBrand.id;
        const { error: updateError } = await supabase
          .from('brands')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', brandId);

        if (updateError) throw updateError;

        // Delete existing brand_categories
        const { error: deleteError } = await supabase
          .from('brand_categories')
          .delete()
          .eq('brand_id', brandId);

        if (deleteError) throw deleteError;

        // Insert new brand_categories
        if (selectedCategoryIds.length > 0) {
          const brandCategories = selectedCategoryIds.map(categoryId => ({
            brand_id: brandId,
            category_id: categoryId
          }));

          const { error: insertError } = await supabase
            .from('brand_categories')
            .insert(brandCategories);

          if (insertError) throw insertError;
        }

        setSuccess('Brand updated successfully!');
      } else {
        // Create new brand
        const { data: insertedData, error: insertError } = await supabase
          .from('brands')
          .insert([formData])
          .select();

        if (insertError) throw insertError;
        
        if (!insertedData || insertedData.length === 0) {
          throw new Error('Failed to create brand');
        }

        brandId = insertedData[0].id;

        // Insert brand_categories
        if (selectedCategoryIds.length > 0) {
          const brandCategories = selectedCategoryIds.map(categoryId => ({
            brand_id: brandId,
            category_id: categoryId
          }));

          const { error: categoryInsertError } = await supabase
            .from('brand_categories')
            .insert(brandCategories);

          if (categoryInsertError) throw categoryInsertError;
        }

        setSuccess('Brand created successfully!');
      }

      setShowModal(false);
      setEditingBrand(null);
      resetForm();
      await loadBrands();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving brand:', err);
      setError(err.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      image_url: brand.image_url || ''
    });
    await loadBrandCategories(brand.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;

    try {
      setLoading(true);

      // Delete image from storage if exists
      if (imageUrl) {
        const path = imageUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('product-images').remove([path]);
      }

      // Delete brand from database
      const { error: deleteError } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Brand deleted successfully!');
      await loadBrands();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      setError(err.message || 'Failed to delete brand');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image_url: ''
    });
    setSelectedCategoryIds([]);
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Organize categories: parents first, then children indented
  const organizedCategories = () => {
    const parents = categories.filter(cat => !cat.parent_id);
    const children = categories.filter(cat => cat.parent_id);
    
    const result: Category[] = [];
    parents.forEach(parent => {
      result.push(parent);
      // Add children of this parent
      children
        .filter(child => child.parent_id === parent.id)
        .forEach(child => result.push(child));
    });
    // Add any remaining children (orphaned)
    children
      .filter(child => !parents.find(p => p.id === child.parent_id))
      .forEach(child => result.push(child));
    
    return result;
  };

  if (loading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="brands-page space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600">Manage product brands</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBrand(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Brands</p>
            <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Tag className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredBrands.map((brand) => (
          <div key={brand.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
              {brand.image_url ? (
                <img
                  src={brand.image_url}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 text-center truncate mb-3">
                {brand.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(brand)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 text-sm rounded-md hover:bg-blue-100 flex items-center justify-center"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(brand.id, brand.image_url)}
                  className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Brands Found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first brand.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBrand(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nike, Adidas, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Logo
                </label>
                
                {/* Image Preview */}
                {formData.image_url && (
                  <div className="mb-4 relative">
                    <img
                      src={formData.image_url}
                      alt="Brand preview"
                      className="w-full h-48 object-contain bg-gray-100 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 2MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No categories available
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {organizedCategories().map((category) => {
                        const isSelected = selectedCategoryIds.includes(category.id);
                        const isChild = !!category.parent_id;
                        return (
                          <label
                            key={category.id}
                            className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded ${
                              isChild ? 'ml-4' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                                } else {
                                  setSelectedCategoryIds(
                                    selectedCategoryIds.filter(id => id !== category.id)
                                  );
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 flex items-center">
                              {isChild && (
                                <FolderTree className="w-3 h-3 mr-1 text-gray-400" />
                              )}
                              {category.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select one or more categories for this brand
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingBrand ? 'Update Brand' : 'Create Brand'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands;