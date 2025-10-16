import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Image,
  X,
  Save,
  Upload
} from 'lucide-react';
import CampaignManagement from './CampaignManagement';
import FacebookIntegration from './FacebookIntegration';

interface CampaignManagementSectionProps {
  activeSection?: string;
}

const mockData = {
  discounts: [
    {
      id: 1,
      name: "10% Off All Fertilizers",
      type: "percentage",
      value: 10,
      status: "active",
      usageCount: 45,
      usageLimit: 100,
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      appliesTo: "category",
      target: "Fertilizers",
      branches: ["All Branches"]
    },
    {
      id: 2,
      name: "₱50 Off Orders Above ₱1000",
      type: "fixed",
      value: 50,
      status: "active",
      usageCount: 23,
      usageLimit: 50,
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      appliesTo: "order",
      target: "₱1000+",
      branches: ["Poblacion Branch", "Downtown Branch"]
    },
    {
      id: 3,
      name: "Buy 5 Get 1 Free - Seeds",
      type: "buy_x_get_y",
      value: "5:1",
      status: "active",
      usageCount: 12,
      usageLimit: 30,
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      appliesTo: "product",
      target: "Premium Seeds",
      branches: ["All Branches"]
    }
  ],
  banners: [
    {
      id: 1,
      title: "Summer Sale 2025",
      subtitle: "Up to 30% off on all fertilizers",
      status: "active",
      priority: 1,
      linkTo: "/campaigns/summer-sale-2025"
    },
    {
      id: 2,
      title: "New Products Available",
      subtitle: "Check out our latest farming solutions",
      status: "active",
      priority: 2,
      linkTo: "/products/new"
    }
  ]
};

interface DiscountFormData {
  name: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number | string;
  usageLimit: number;
  startDate: string;
  endDate: string;
  appliesTo: 'category' | 'product' | 'order';
  target: string;
  branches: string[];
  status: 'active' | 'inactive';
}

interface BannerFormData {
  title: string;
  subtitle: string;
  linkTo: string;
  priority: number;
  status: 'active' | 'inactive';
  image?: File;
}

const CampaignManagementSection: React.FC<CampaignManagementSectionProps> = ({ activeSection = 'campaign-management' }) => {
  const [activeTab, setActiveTab] = useState('campaigns-list');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [discountFormData, setDiscountFormData] = useState<DiscountFormData>({
    name: '',
    type: 'percentage',
    value: 0,
    usageLimit: 100,
    startDate: '',
    endDate: '',
    appliesTo: 'category',
    target: '',
    branches: [],
    status: 'active'
  });
  const [bannerFormData, setBannerFormData] = useState<BannerFormData>({
    title: '',
    subtitle: '',
    linkTo: '',
    priority: 1,
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeSection === 'campaigns-list' || activeSection === 'discounts' || 
        activeSection === 'banners-ads' || activeSection === 'social-media') {
      setActiveTab(activeSection);
    }
  }, [activeSection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Discount form handling
  const openDiscountModal = () => {
    setShowDiscountModal(true);
    setDiscountFormData({
      name: '',
      type: 'percentage',
      value: 0,
      usageLimit: 100,
      startDate: '',
      endDate: '',
      appliesTo: 'category',
      target: '',
      branches: [],
      status: 'active'
    });
    setFormErrors({});
  };

  const closeDiscountModal = () => {
    setShowDiscountModal(false);
    setEditingDiscount(null);
    setDiscountFormData({
      name: '',
      type: 'percentage',
      value: 0,
      usageLimit: 100,
      startDate: '',
      endDate: '',
      appliesTo: 'category',
      target: '',
      branches: [],
      status: 'active'
    });
    setFormErrors({});
  };

  const openEditDiscountModal = (discount: any) => {
    setEditingDiscount(discount);
    setShowDiscountModal(true);
    setDiscountFormData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      usageLimit: discount.usageLimit,
      startDate: discount.startDate,
      endDate: discount.endDate,
      appliesTo: discount.appliesTo,
      target: discount.target,
      branches: discount.branches,
      status: discount.status
    });
    setFormErrors({});
  };

  const handleDiscountInputChange = (field: keyof DiscountFormData, value: any) => {
    setDiscountFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDiscountBranchToggle = (branch: string) => {
    setDiscountFormData(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch]
    }));
  };

  const validateDiscountForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!discountFormData.name.trim()) {
      errors.name = 'Discount name is required';
    }
    if (!discountFormData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!discountFormData.endDate) {
      errors.endDate = 'End date is required';
    }
    if (discountFormData.startDate && discountFormData.endDate && new Date(discountFormData.startDate) >= new Date(discountFormData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    if (discountFormData.usageLimit <= 0) {
      errors.usageLimit = 'Usage limit must be greater than 0';
    }
    if (!discountFormData.target.trim()) {
      errors.target = 'Target is required';
    }
    if (discountFormData.branches.length === 0) {
      errors.branches = 'Please select at least one branch';
    }
    if (discountFormData.type === 'buy_x_get_y') {
      if (typeof discountFormData.value !== 'string' || !discountFormData.value.includes(':')) {
        errors.value = 'Value must be in format "X:Y" (e.g., "5:1")';
      }
    } else {
      if (typeof discountFormData.value !== 'number' || discountFormData.value <= 0) {
        errors.value = 'Value must be greater than 0';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDiscountForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newDiscount = {
        id: editingDiscount ? editingDiscount.id : Date.now(),
        name: discountFormData.name,
        type: discountFormData.type,
        value: discountFormData.value,
        status: discountFormData.status,
        usageCount: editingDiscount ? editingDiscount.usageCount : 0,
        usageLimit: discountFormData.usageLimit,
        startDate: discountFormData.startDate,
        endDate: discountFormData.endDate,
        appliesTo: discountFormData.appliesTo,
        target: discountFormData.target,
        branches: discountFormData.branches
      };

      console.log('Discount created/updated:', newDiscount);
      closeDiscountModal();
      
    } catch (err) {
      console.error('Error saving discount:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Banner form handling
  const openBannerModal = () => {
    setShowBannerModal(true);
    setBannerFormData({
      title: '',
      subtitle: '',
      linkTo: '',
      priority: 1,
      status: 'active'
    });
    setFormErrors({});
  };

  const closeBannerModal = () => {
    setShowBannerModal(false);
    setEditingBanner(null);
    setBannerFormData({
      title: '',
      subtitle: '',
      linkTo: '',
      priority: 1,
      status: 'active'
    });
    setFormErrors({});
  };

  const openEditBannerModal = (banner: any) => {
    setEditingBanner(banner);
    setShowBannerModal(true);
    setBannerFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      linkTo: banner.linkTo,
      priority: banner.priority,
      status: banner.status
    });
    setFormErrors({});
  };

  const handleBannerInputChange = (field: keyof BannerFormData, value: any) => {
    setBannerFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateBannerForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!bannerFormData.title.trim()) {
      errors.title = 'Banner title is required';
    }
    if (!bannerFormData.subtitle.trim()) {
      errors.subtitle = 'Banner subtitle is required';
    }
    if (!bannerFormData.linkTo.trim()) {
      errors.linkTo = 'Link is required';
    }
    if (bannerFormData.priority <= 0) {
      errors.priority = 'Priority must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBannerForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBanner = {
        id: editingBanner ? editingBanner.id : Date.now(),
        title: bannerFormData.title,
        subtitle: bannerFormData.subtitle,
        linkTo: bannerFormData.linkTo,
        priority: bannerFormData.priority,
        status: bannerFormData.status
      };

      console.log('Banner created/updated:', newBanner);
      closeBannerModal();
      
    } catch (err) {
      console.error('Error saving banner:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableBranches = [
    'All Branches',
    'Poblacion Branch',
    'Downtown Branch',
    'Mall Branch',
    'Airport Branch'
  ];

  const renderDiscounts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Discount Management</h2>
        <button 
          onClick={openDiscountModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Discount</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockData.discounts.map((discount) => (
          <div key={discount.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{discount.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                {discount.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type</span>
                <span className="font-medium">{discount.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Value</span>
                <span className="font-medium">
                  {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(Number(discount.value))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Usage</span>
                <span className="font-medium">{discount.usageCount} / {discount.usageLimit}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Applies to</span>
                <span className="font-medium">{discount.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${(discount.usageCount / discount.usageLimit) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <button 
                onClick={() => openEditDiscountModal(discount)}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBannersAds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Banners & Ads Management</h2>
        <button 
          onClick={openBannerModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockData.banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <Image className="w-16 h-16 text-gray-400" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(banner.status)}`}>
                  {banner.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{banner.subtitle}</p>
              
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-600">Priority</span>
                <span className="font-medium">{banner.priority}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button 
                  onClick={() => openEditBannerModal(banner)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
        <p className="text-gray-600">Comprehensive campaign management with discounts, banners, and social media</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveTab('campaigns-list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns-list' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Campaigns
            </button>
            <button 
              onClick={() => setActiveTab('discounts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'discounts' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Discounts
            </button>
            <button 
              onClick={() => setActiveTab('banners-ads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'banners-ads' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Banners & Ads
            </button>
            <button 
              onClick={() => setActiveTab('social-media')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'social-media' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Social Media
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'campaigns-list' && <CampaignManagement />}
        {activeTab === 'discounts' && renderDiscounts()}
        {activeTab === 'banners-ads' && renderBannersAds()}
        {activeTab === 'social-media' && <FacebookIntegration />}
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
              </h2>
              <button
                onClick={closeDiscountModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleDiscountSubmit} className="p-6">
              <div className="space-y-6">
                {/* Discount Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Name *
                  </label>
                  <input
                    type="text"
                    value={discountFormData.name}
                    onChange={(e) => handleDiscountInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter discount name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Discount Type and Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={discountFormData.type}
                      onChange={(e) => handleDiscountInputChange('type', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="buy_x_get_y">Buy X Get Y</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value *
                    </label>
                    {discountFormData.type === 'buy_x_get_y' ? (
                      <input
                        type="text"
                        value={discountFormData.value as string}
                        onChange={(e) => handleDiscountInputChange('value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="5:1"
                      />
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountFormData.value as number}
                        onChange={(e) => handleDiscountInputChange('value', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    )}
                    {formErrors.value && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.value}</p>
                    )}
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={discountFormData.usageLimit}
                    onChange={(e) => handleDiscountInputChange('usageLimit', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="100"
                  />
                  {formErrors.usageLimit && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.usageLimit}</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={discountFormData.startDate}
                      onChange={(e) => handleDiscountInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {formErrors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={discountFormData.endDate}
                      onChange={(e) => handleDiscountInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {formErrors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Applies To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applies To *
                    </label>
                    <select
                      value={discountFormData.appliesTo}
                      onChange={(e) => handleDiscountInputChange('appliesTo', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="category">Category</option>
                      <option value="product">Product</option>
                      <option value="order">Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target *
                    </label>
                    <input
                      type="text"
                      value={discountFormData.target}
                      onChange={(e) => handleDiscountInputChange('target', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Fertilizers, ₱1000+"
                    />
                    {formErrors.target && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.target}</p>
                    )}
                  </div>
                </div>

                {/* Branches */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branches *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableBranches.map((branch) => (
                      <label key={branch} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={discountFormData.branches.includes(branch)}
                          onChange={() => handleDiscountBranchToggle(branch)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{branch}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.branches && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.branches}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={discountFormData.status}
                    onChange={(e) => handleDiscountInputChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeDiscountModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingDiscount ? 'Update Discount' : 'Create Discount'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <button
                onClick={closeBannerModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBannerSubmit} className="p-6">
              <div className="space-y-6">
                {/* Banner Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    value={bannerFormData.title}
                    onChange={(e) => handleBannerInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter banner title"
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                {/* Banner Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Subtitle *
                  </label>
                  <input
                    type="text"
                    value={bannerFormData.subtitle}
                    onChange={(e) => handleBannerInputChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter banner subtitle"
                  />
                  {formErrors.subtitle && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.subtitle}</p>
                  )}
                </div>

                {/* Link To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link To *
                  </label>
                  <input
                    type="text"
                    value={bannerFormData.linkTo}
                    onChange={(e) => handleBannerInputChange('linkTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., /campaigns/summer-sale"
                  />
                  {formErrors.linkTo && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.linkTo}</p>
                  )}
                </div>

                {/* Priority and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bannerFormData.priority}
                      onChange={(e) => handleBannerInputChange('priority', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="1"
                    />
                    {formErrors.priority && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.priority}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={bannerFormData.status}
                      onChange={(e) => handleBannerInputChange('status', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Upload banner image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBannerInputChange('image', e.target.files?.[0])}
                      className="hidden"
                      id="banner-image"
                    />
                    <label
                      htmlFor="banner-image"
                      className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeBannerModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingBanner ? 'Update Banner' : 'Create Banner'}</span>
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

export default CampaignManagementSection;