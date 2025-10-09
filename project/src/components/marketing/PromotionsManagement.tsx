import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  Facebook,
  Package,
  Percent,
  DollarSign,
  AlertCircle
} from 'lucide-react';

// Mock data for promotions
const mockPromotions = [
  {
    id: '1',
    title: 'Summer Sale 2025',
    description: 'Biggest summer promotion with up to 30% off on all fertilizers and agricultural supplies',
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    discountType: 'percent',
    discountValue: 30,
    products: ['FERT-001', 'FERT-002', 'FERT-003'],
    categories: ['Fertilizers', 'Seeds'],
    showOnPWA: true,
    showOnFacebook: false,
    status: 'active',
    createdBy: 'John Doe',
    createdAt: '2025-01-10T10:00:00Z',
    totalUses: 45,
    maxUses: 100
  },
  {
    id: '2',
    title: 'New Year Special',
    description: 'Start the year right with special offers on premium seeds and organic products',
    startDate: '2024-12-20',
    endDate: '2025-01-10',
    discountType: 'flat',
    discountValue: 50,
    products: ['SEED-001', 'SEED-002'],
    categories: ['Seeds', 'Organic'],
    showOnPWA: true,
    showOnFacebook: true,
    status: 'expired',
    createdBy: 'Jane Smith',
    createdAt: '2024-12-15T14:30:00Z',
    totalUses: 23,
    maxUses: 50
  },
  {
    id: '3',
    title: 'Valentine\'s Day Promotion',
    description: 'Spread love with our special Valentine\'s offers on gardening tools and accessories',
    startDate: '2025-02-10',
    endDate: '2025-02-17',
    discountType: 'percent',
    discountValue: 15,
    products: ['TOOL-001', 'TOOL-002'],
    categories: ['Tools', 'Accessories'],
    showOnPWA: true,
    showOnFacebook: true,
    status: 'upcoming',
    createdBy: 'Mike Johnson',
    createdAt: '2025-01-25T09:15:00Z',
    totalUses: 0,
    maxUses: 75
  },
  {
    id: '4',
    title: 'Farmer\'s Choice',
    description: 'Exclusive deals for our loyal farming customers on bulk orders',
    startDate: '2025-02-01',
    endDate: '2025-02-28',
    discountType: 'flat',
    discountValue: 100,
    products: ['BULK-001', 'BULK-002'],
    categories: ['Bulk Orders'],
    showOnPWA: true,
    showOnFacebook: false,
    status: 'upcoming',
    createdBy: 'Sarah Wilson',
    createdAt: '2025-01-20T16:45:00Z',
    totalUses: 0,
    maxUses: 25
  }
];

// Mock products and categories for selection
const mockProducts = [
  { id: 'FERT-001', name: 'Ammonium Sulfate 21-0-0', category: 'Fertilizers' },
  { id: 'FERT-002', name: 'Ammonium Phosphate 16-20-0', category: 'Fertilizers' },
  { id: 'FERT-003', name: 'Calcium Nitrate 15-5-0', category: 'Fertilizers' },
  { id: 'SEED-001', name: 'Premium Seeds Mix', category: 'Seeds' },
  { id: 'SEED-002', name: 'Organic Vegetable Seeds', category: 'Seeds' },
  { id: 'TOOL-001', name: 'Garden Spade Set', category: 'Tools' },
  { id: 'TOOL-002', name: 'Pruning Shears', category: 'Tools' },
  { id: 'BULK-001', name: 'Bulk Fertilizer 50kg', category: 'Bulk Orders' },
  { id: 'BULK-002', name: 'Bulk Seeds 25kg', category: 'Bulk Orders' }
];

const mockCategories = [
  'Fertilizers',
  'Seeds', 
  'Tools',
  'Accessories',
  'Organic',
  'Bulk Orders'
];

const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState(mockPromotions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [viewingPromotion, setViewingPromotion] = useState(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    discountType: 'percent',
    discountValue: '',
    products: [],
    categories: [],
    showOnPWA: true,
    showOnFacebook: false,
    maxUses: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promotion.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePromotion = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      discountType: 'percent',
      discountValue: '',
      products: [],
      categories: [],
      showOnPWA: true,
      showOnFacebook: false,
      maxUses: ''
    });
    setEditingPromotion(null);
    setShowCreateModal(true);
  };

  const handleEditPromotion = (promotion: any) => {
    setFormData({
      title: promotion.title,
      description: promotion.description,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString(),
      products: promotion.products,
      categories: promotion.categories,
      showOnPWA: promotion.showOnPWA,
      showOnFacebook: promotion.showOnFacebook,
      maxUses: promotion.maxUses.toString()
    });
    setEditingPromotion(promotion);
    setShowCreateModal(true);
  };

  const handleSavePromotion = () => {
    // Here you would typically save to backend
    const newPromotion = {
      id: editingPromotion ? editingPromotion.id : Date.now().toString(),
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      maxUses: parseInt(formData.maxUses),
      status: 'upcoming', // Will be updated by backend logic
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      totalUses: 0
    };

    if (editingPromotion) {
      setPromotions(promotions.map(p => p.id === editingPromotion.id ? newPromotion : p));
    } else {
      setPromotions([...promotions, newPromotion]);
    }

    setShowCreateModal(false);
    setEditingPromotion(null);
  };

  const handleDeletePromotion = (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      setPromotions(promotions.filter(p => p.id !== id));
    }
  };

  const renderCreateEditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter promotion title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter promotion description"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Fixed Amount (₱)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
              <div className="relative">
                {formData.discountType === 'percent' ? (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                ) : (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                  className={`w-full ${formData.discountType === 'percent' ? 'pr-10' : 'pl-10'} px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                  placeholder={formData.discountType === 'percent' ? '30' : '50'}
                />
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Products</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {mockProducts.map((product) => (
                <label key={product.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.products.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, products: [...formData.products, product.id]});
                      } else {
                        setFormData({...formData, products: formData.products.filter(p => p !== product.id)});
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{product.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Categories</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mockCategories.map((category) => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, categories: [...formData.categories, category]});
                      } else {
                        setFormData({...formData, categories: formData.categories.filter(c => c !== category)});
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Display Channels</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showOnPWA}
                  onChange={(e) => setFormData({...formData, showOnPWA: e.target.checked})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Show on PWA (Progressive Web App)</span>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showOnFacebook}
                  onChange={(e) => setFormData({...formData, showOnFacebook: e.target.checked})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center space-x-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Show on Facebook (Future Phase)</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePromotion}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderViewModal = () => {
    if (!viewingPromotion) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{viewingPromotion.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingPromotion.status)}`}>
                {viewingPromotion.status}
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{viewingPromotion.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                <p className="text-gray-600">{formatDate(viewingPromotion.startDate)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">End Date</h4>
                <p className="text-gray-600">{formatDate(viewingPromotion.endDate)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Discount</h4>
                <p className="text-gray-600">
                  {viewingPromotion.discountType === 'percent' 
                    ? `${viewingPromotion.discountValue}%` 
                    : formatCurrency(viewingPromotion.discountValue)
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Usage</h4>
                <p className="text-gray-600">
                  {viewingPromotion.totalUses} / {viewingPromotion.maxUses || '∞'}
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Channels</h4>
              <div className="flex space-x-4">
                {viewingPromotion.showOnPWA && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">PWA</span>
                  </div>
                )}
                {viewingPromotion.showOnFacebook && (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Facebook className="w-4 h-4" />
                    <span className="text-sm">Facebook</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Products & Categories</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Products: </span>
                  <span className="text-sm text-gray-600">
                    {viewingPromotion.products.map(id => 
                      mockProducts.find(p => p.id === id)?.name
                    ).join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Categories: </span>
                  <span className="text-sm text-gray-600">{viewingPromotion.categories.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={() => setViewingPromotion(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promotions Management</h2>
          <p className="text-gray-600">Create and manage product promotions for PWA and social media</p>
        </div>
        <button 
          onClick={handleCreatePromotion}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{promotion.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{promotion.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created by {promotion.createdBy} • {formatDate(promotion.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(promotion.startDate)}</div>
                    <div className="text-sm text-gray-500">to {formatDate(promotion.endDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(promotion.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(promotion.status)}`}>
                        {promotion.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {promotion.showOnPWA && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Smartphone className="w-4 h-4" />
                          <span className="text-xs">PWA</span>
                        </div>
                      )}
                      {promotion.showOnFacebook && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Facebook className="w-4 h-4" />
                          <span className="text-xs">FB</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {promotion.totalUses} / {promotion.maxUses || '∞'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-emerald-500 h-1 rounded-full" 
                        style={{ 
                          width: `${promotion.maxUses ? (promotion.totalUses / promotion.maxUses) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setViewingPromotion(promotion)}
                        className="text-emerald-600 hover:text-emerald-900" 
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPromotion(promotion)}
                        className="text-blue-600 hover:text-blue-900" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePromotion(promotion.id)}
                        className="text-red-600 hover:text-red-900" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredPromotions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No promotions found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new promotion.</p>
          <button 
            onClick={handleCreatePromotion}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promotion</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && renderCreateEditModal()}
      {viewingPromotion && renderViewModal()}
    </div>
  );
};

export default PromotionsManagement;
