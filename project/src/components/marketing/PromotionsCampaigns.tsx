import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Percent, 
  Target,
  DollarSign,
  Plus,
  Eye,
  Edit,
  X,
  Save
} from 'lucide-react';
import InsightsAnalytics from './InsightsAnalytics';
import PromotionsManagement from './PromotionsManagement';

interface PromotionsCampaignsProps {
  activeSection?: string;
}

const mockData = {
  campaigns: [
    {
      id: 1,
      name: "Summer Sale 2025",
      description: "Biggest summer promotion with up to 30% off on fertilizers",
      status: "active",
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      totalDiscount: 15420,
      totalSales: 125000,
      targetSales: 100000,
      branches: ["Poblacion Branch", "Downtown Branch"]
    },
    {
      id: 2,
      name: "New Year Promotion",
      description: "Start the year right with special offers on all products",
      status: "ended",
      startDate: "2024-12-20",
      endDate: "2025-01-10",
      totalDiscount: 8750,
      totalSales: 89000,
      targetSales: 75000,
      branches: ["All Branches"]
    },
    {
      id: 3,
      name: "Farmer's Choice",
      description: "Exclusive deals for our loyal farming customers",
      status: "upcoming",
      startDate: "2025-02-01",
      endDate: "2025-02-28",
      totalDiscount: 0,
      totalSales: 0,
      targetSales: 150000,
      branches: ["Poblacion Branch"]
    }
  ],
  analytics: {
    totalCampaigns: 3,
    activeCampaigns: 1,
    totalDiscounts: 3,
    totalSales: 214000,
    conversionRate: 12.5
  }
};

interface CampaignFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetSales: number;
  branches: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  status: 'draft' | 'active' | 'upcoming' | 'ended';
}

const PromotionsCampaigns: React.FC<PromotionsCampaignsProps> = ({ activeSection = 'promotions-campaigns' }) => {
  const [activeTab, setActiveTab] = useState('all-campaigns');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    targetSales: 0,
    branches: [],
    discountType: 'percentage',
    discountValue: 0,
    status: 'draft'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeSection === 'all-campaigns' || activeSection === 'active-promotions' || 
        activeSection === 'upcoming-campaigns' || activeSection === 'campaign-analytics') {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Form handling functions
  const openCreateModal = () => {
    setShowCreateModal(true);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      targetSales: 0,
      branches: [],
      discountType: 'percentage',
      discountValue: 0,
      status: 'draft'
    });
    setFormErrors({});
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      targetSales: 0,
      branches: [],
      discountType: 'percentage',
      discountValue: 0,
      status: 'draft'
    });
    setFormErrors({});
  };

  const openEditModal = (campaign: any) => {
    setShowEditModal(true);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      targetSales: campaign.targetSales,
      branches: campaign.branches,
      discountType: 'percentage',
      discountValue: 0,
      status: campaign.status
    });
    setFormErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      targetSales: 0,
      branches: [],
      discountType: 'percentage',
      discountValue: 0,
      status: 'draft'
    });
    setFormErrors({});
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBranchToggle = (branch: string) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch]
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
    if (formData.targetSales <= 0) {
      errors.targetSales = 'Target sales must be greater than 0';
    }
    if (formData.branches.length === 0) {
      errors.branches = 'Please select at least one branch';
    }
    if (formData.discountValue <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newCampaign = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDiscount: 0,
        totalSales: 0,
        targetSales: formData.targetSales,
        branches: formData.branches
      };

      // In a real app, you would update the campaigns state here
      console.log('Campaign created/updated:', newCampaign);
      
      // Close modal
      if (showCreateModal) {
        closeCreateModal();
      } else {
        closeEditModal();
      }
      
    } catch (err) {
      console.error('Error saving campaign:', err);
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

  const renderAllCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Campaigns</h2>
        <button 
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockData.campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-blue-500 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm opacity-90">{campaign.description}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Branches</span>
                  <span className="font-medium">{campaign.branches.length} branch{campaign.branches.length > 1 ? 'es' : ''}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sales Progress</span>
                    <span className="font-medium">{formatCurrency(campaign.totalSales)} / {formatCurrency(campaign.targetSales)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((campaign.totalSales / campaign.targetSales) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Discount</span>
                  <span className="font-medium text-red-600">{formatCurrency(campaign.totalDiscount)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button 
                  onClick={() => openEditModal(campaign)}
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

  const renderUpcomingCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Campaigns</h2>
        <button 
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockData.campaigns.filter(campaign => campaign.status === 'upcoming').map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                <p className="text-sm opacity-90">{campaign.description}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Starts</span>
                  <span className="font-medium">{formatDate(campaign.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ends</span>
                  <span className="font-medium">{formatDate(campaign.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target Sales</span>
                  <span className="font-medium">{formatCurrency(campaign.targetSales)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
                <button 
                  onClick={() => openEditModal(campaign)}
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
        <h1 className="text-2xl font-bold text-gray-900">Promotions & Campaigns</h1>
        <p className="text-gray-600">Manage all promotional activities and marketing campaigns</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Promotions</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.totalDiscounts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Percent className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.activeCampaigns}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockData.analytics.totalSales)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button 
              onClick={() => setActiveTab('all-campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all-campaigns' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Campaigns
            </button>
            <button 
              onClick={() => setActiveTab('active-promotions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active-promotions' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Promotions
            </button>
            <button 
              onClick={() => setActiveTab('upcoming-campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming-campaigns' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setActiveTab('campaign-analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaign-analytics' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'all-campaigns' && renderAllCampaigns()}
        {activeTab === 'active-promotions' && <PromotionsManagement />}
        {activeTab === 'upcoming-campaigns' && renderUpcomingCampaigns()}
        {activeTab === 'campaign-analytics' && <InsightsAnalytics />}
      </div>

      {/* Create/Edit Campaign Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateModal ? 'Create New Campaign' : 'Edit Campaign'}
              </h2>
              <button
                onClick={showCreateModal ? closeCreateModal : closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter campaign name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter campaign description"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
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
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
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
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {formErrors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Target Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Sales (₱) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.targetSales}
                    onChange={(e) => handleInputChange('targetSales', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                  {formErrors.targetSales && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.targetSales}</p>
                  )}
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
                          checked={formData.branches.includes(branch)}
                          onChange={() => handleBranchToggle(branch)}
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
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={showCreateModal ? closeCreateModal : closeEditModal}
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
                      <span>{showCreateModal ? 'Create Campaign' : 'Update Campaign'}</span>
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

export default PromotionsCampaigns;