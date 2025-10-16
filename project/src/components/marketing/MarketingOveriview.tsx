import React from 'react';
import { 
  TrendingUp, 
  Percent, 
  Target,
  DollarSign,
  Plus,
  MoreHorizontal,
  Image
} from 'lucide-react';

// Mock data
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
  featuredProducts: [
    {
      id: 1,
      name: "Ammonium Sulfate 21-0-0",
      sku: "FERT-001",
      type: "featured",
      priority: 1,
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
      originalPrice: 800,
      salePrice: 800,
      discount: 0,
      salesCount: 67
    }
  ],
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

const MarketingOverview: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketing Overview</h1>
        <p className="text-gray-600">Key metrics and recent campaigns at a glance</p>
      </div>

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
                      <Image className="w-6 h-6 text-gray-400" />
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
                      <Image className="w-8 h-8 text-gray-400" />
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
    </div>
  );
};

export default MarketingOverview;