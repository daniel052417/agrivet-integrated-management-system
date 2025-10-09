import React, { useState } from 'react';
import { 
  TrendingUp, 
  Percent, 
  Target,
  Star, 
  Image as ImageIcon, 
  Users, 
  BarChart3,
  Plus,
  Calendar,
  DollarSign,
  ShoppingCart,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Tag,
  Facebook,
  Gift
} from 'lucide-react';
import PromotionsManagement from './PromotionsManagement';
import InsightsAnalytics from './InsightsAnalytics';
import RewardsNotifications from './RewardsNotifications';
import FacebookIntegration from './FacebookIntegration';

// Mock data for marketing dashboard
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
      branches: ["Poblacion Branch", "Downtown Branch"],
      image: "/api/placeholder/300/150"
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
      branches: ["All Branches"],
      image: "/api/placeholder/300/150"
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
      branches: ["Poblacion Branch"],
      image: "/api/placeholder/300/150"
    }
  ],
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
  featuredProducts: [
    {
      id: 1,
      name: "Ammonium Sulfate 21-0-0",
      sku: "FERT-001",
      type: "featured",
      priority: 1,
      image: "/api/placeholder/200/200",
      originalPrice: 1400,
      salePrice: 980,
      discount: 30,
      salesCount: 45
    },
    {
      id: 2,
      name: "Premium Seeds Mix",
      sku: "SEED-001",
      type: "new_arrival",
      priority: 2,
      image: "/api/placeholder/200/200",
      originalPrice: 250,
      salePrice: 250,
      discount: 0,
      salesCount: 23
    },
    {
      id: 3,
      name: "Organic Compost 50kg",
      sku: "COMP-001",
      type: "best_seller",
      priority: 3,
      image: "/api/placeholder/200/200",
      originalPrice: 800,
      salePrice: 800,
      discount: 0,
      salesCount: 67
    }
  ],
  banners: [
    {
      id: 1,
      title: "Summer Sale 2025",
      subtitle: "Up to 30% off on all fertilizers",
      image: "/api/placeholder/800/300",
      status: "active",
      priority: 1,
      linkTo: "/campaigns/summer-sale-2025"
    },
    {
      id: 2,
      title: "New Products Available",
      subtitle: "Check out our latest farming solutions",
      image: "/api/placeholder/800/300",
      status: "active",
      priority: 2,
      linkTo: "/products/new"
    }
  ],
  loyaltyStats: {
    totalMembers: 1250,
    activeMembers: 890,
    totalPointsIssued: 45600,
    totalPointsRedeemed: 23400,
    averagePointsPerMember: 36.5
  },
  analytics: {
    totalCampaigns: 3,
    activeCampaigns: 1,
    totalDiscounts: 3,
    totalDiscountValue: 24170,
    totalSales: 214000,
    conversionRate: 12.5,
    topPerformingCampaign: "Summer Sale 2025",
    mostUsedDiscount: "10% Off All Fertilizers"
  }
};

const MarketingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'featured': return 'bg-purple-100 text-purple-800';
      case 'new_arrival': return 'bg-green-100 text-green-800';
      case 'best_seller': return 'bg-orange-100 text-orange-800';
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.activeCampaigns}</p>
              <p className="text-sm text-gray-500">of {mockData.analytics.totalCampaigns} total</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Discounts</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.totalDiscounts}</p>
              <p className="text-sm text-gray-500">Currently active</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Percent className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockData.analytics.totalSales)}</p>
              <p className="text-sm text-gray-500">From campaigns</p>
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
              <p className="text-sm text-gray-500">View to purchase</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
            <button className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">New Campaign</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockData.campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600">{campaign.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(campaign.totalSales)}</p>
                    <p className="text-xs text-gray-500">Sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(campaign.totalDiscount)}</p>
                    <p className="text-xs text-gray-500">Discount</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Featured Products</h3>
            <button className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Product</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockData.featuredProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(product.type)}`}>
                        {product.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">Priority: {product.priority}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    {product.discount > 0 ? (
                      <>
                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(product.salePrice)}</span>
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(product.originalPrice)}</span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">-{product.discount}%</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(product.originalPrice)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{product.salesCount}</p>
                    <p className="text-xs text-gray-500">Sales</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Management</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
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
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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

  const renderDiscounts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Discount Management</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Create Discount</span>
              </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockData.discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                      <div className="text-sm text-gray-500">Applies to: {discount.target}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {discount.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discount.type === 'percentage' ? `${discount.value}%` : 
                     discount.type === 'fixed' ? formatCurrency(discount.value) : 
                     discount.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{discount.usageCount} / {discount.usageLimit}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-emerald-500 h-1 rounded-full" 
                        style={{ width: `${(discount.usageCount / discount.usageLimit) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-900">
                        <Edit className="w-4 h-4" />
              </button>
                      <button className="text-red-600 hover:text-red-900">
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
    </div>
  );

  const renderFeaturedProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockData.featuredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-400" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(product.type)}`}>
                  {product.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">SKU: {product.sku}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {product.discount > 0 ? (
                    <>
                      <span className="text-xl font-bold text-emerald-600">{formatCurrency(product.salePrice)}</span>
                      <span className="text-sm text-gray-500 line-through">{formatCurrency(product.originalPrice)}</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(product.originalPrice)}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{product.salesCount} sales</div>
                  <div className="text-xs text-gray-500">Priority: {product.priority}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBanners = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Banners & Advertisements</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="space-y-4">
        {mockData.banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200 flex items-center justify-center relative">
              <ImageIcon className="w-16 h-16 text-gray-400" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(banner.status)}`}>
                  {banner.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{banner.title}</h3>
                <p className="text-sm opacity-90">{banner.subtitle}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Priority:</span>
                    <span className="ml-2 font-medium">{banner.priority}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Link:</span>
                    <span className="ml-2 font-medium text-emerald-600">{banner.linkTo}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLoyaltyProgram = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Loyalty Program</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          <span>Manage Program</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.totalMembers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.activeMembers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Issued</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.totalPointsIssued.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.loyaltyStats.totalPointsRedeemed.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Program Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Points per Peso</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Peso per Point</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Marketing Analytics</h2>
        <button className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          <BarChart3 className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Top Performing Campaign</span>
              <span className="font-medium">{mockData.analytics.topPerformingCampaign}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Used Discount</span>
              <span className="font-medium">{mockData.analytics.mostUsedDiscount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Discount Value</span>
              <span className="font-medium text-red-600">{formatCurrency(mockData.analytics.totalDiscountValue)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sales</span>
              <span className="font-medium">{formatCurrency(mockData.analytics.totalSales)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-medium">{mockData.analytics.conversionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Campaigns</span>
              <span className="font-medium">{mockData.analytics.activeCampaigns}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'promotions', name: 'Promotions', icon: Tag },
    { id: 'insights', name: 'Insights & Analytics', icon: TrendingUp },
    { id: 'rewards', name: 'Rewards & Notifications', icon: Gift },
    { id: 'facebook', name: 'Facebook Integration', icon: Facebook },
    { id: 'campaigns', name: 'Campaigns', icon: Target },
    { id: 'discounts', name: 'Discounts', icon: Percent },
    { id: 'featured-products', name: 'Featured Products', icon: Star },
    { id: 'banners', name: 'Banners & Ads', icon: ImageIcon },
    { id: 'loyalty', name: 'Loyalty Program', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
          <p className="text-gray-600">Manage campaigns, discounts, and customer engagement</p>
      </div>
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
          <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
          </button>
              );
            })}
        </nav>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'promotions' && <PromotionsManagement />}
        {activeTab === 'insights' && <InsightsAnalytics />}
        {activeTab === 'rewards' && <RewardsNotifications />}
        {activeTab === 'facebook' && <FacebookIntegration />}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'discounts' && renderDiscounts()}
        {activeTab === 'featured-products' && renderFeaturedProducts()}
        {activeTab === 'banners' && renderBanners()}
        {activeTab === 'loyalty' && renderLoyaltyProgram()}
      </div>
    </div>
  );
};

export default MarketingDashboard;