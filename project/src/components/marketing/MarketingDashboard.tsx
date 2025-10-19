//MarketingDashboard.tsx

import React from 'react';
import { 
  TrendingUp, 
  Target,
  Users,
  ImageIcon,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

// Type definitions
interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  priority: string;
  views: number;
}

// Mock data for marketing overview dashboard
const mockData = {
  campaigns: [
    {
      id: 1,
      name: "Farmers' Workshop 2025",
      description: "Free workshop on modern farming techniques and sustainable agriculture practices",
      status: "active",
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      eventType: "workshop",
      location: "Main Store - Poblacion Branch",
      maxAttendees: 50,
      currentAttendees: 32,
      branches: ["Poblacion Branch"],
      image: "/api/placeholder/300/150",
      metrics: {
        views: 1250,
        clicks: 340,
        registrations: 32
      }
    },
    {
      id: 2,
      name: "New Product Launch Event",
      description: "Come see our latest agricultural equipment and tools demonstration",
      status: "ended",
      startDate: "2024-12-20",
      endDate: "2025-01-10",
      eventType: "launch",
      location: "All Branches",
      maxAttendees: 100,
      currentAttendees: 78,
      branches: ["All Branches"],
      image: "/api/placeholder/300/150",
      metrics: {
        views: 2100,
        clicks: 450,
        registrations: 78
      }
    },
    {
      id: 3,
      name: "Community Giveaway Event",
      description: "Free seeds and farming supplies giveaway for local farmers",
      status: "upcoming",
      startDate: "2025-02-01",
      endDate: "2025-02-28",
      eventType: "giveaway",
      location: "Poblacion Branch",
      maxAttendees: 200,
      currentAttendees: 0,
      branches: ["Poblacion Branch"],
      image: "/api/placeholder/300/150",
      metrics: {
        views: 0,
        clicks: 0,
        registrations: 0
      }
    }
  ],
  analytics: {
    totalCampaigns: 3,
    activeCampaigns: 1,
    totalPromotions: 3,
    totalViews: 1250,
    totalClicks: 340,
    totalRegistrations: 110,
    topPerformingCampaign: "Farmers' Workshop 2025",
    topPerformingPromotion: "New Fertilizer Arrival",
    customerEngagement: 78.5,
    socialMediaReach: 12500,
    pwaNotifications: 2450,
    facebookPosts: 12,
    conversionRate: 27.2
  },
  featuredProducts: [
    {
      id: 1,
      name: "Premium Fertilizer",
      sku: "FERT-001",
      type: "featured",
      priority: "High",
      views: 156
    },
    {
      id: 2,
      name: "Seed Pack Mix",
      sku: "SEED-002",
      type: "new_arrival",
      priority: "Medium",
      views: 89
    },
    {
      id: 3,
      name: "Garden Tools Set",
      sku: "TOOL-003",
      type: "best_seller",
      priority: "High",
      views: 234
    }
  ]
};

const MarketingDashboard: React.FC = () => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promotions & Engagement Overview</h1>
        <p className="text-gray-600">Monitor your marketing performance and engagement metrics</p>
      </div>

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
              <p className="text-sm font-medium text-gray-600">Total Promotions</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.totalPromotions}</p>
              <p className="text-sm text-gray-500">Currently active</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{mockData.analytics.totalRegistrations}</p>
              <p className="text-sm text-gray-500">From campaigns</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
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
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                    <p className="text-sm font-medium text-gray-900">{campaign.metrics?.views || 0}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{campaign.currentAttendees}</p>
                    <p className="text-xs text-gray-500">Attendees</p>
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
            {mockData.featuredProducts.map((product: Product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{product.views || 0}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;