import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Percent,
  ShoppingCart,
  Clock
} from 'lucide-react';

// Mock data for campaign analytics
const mockAnalytics = {
  overview: {
    totalCampaigns: 8,
    activeCampaigns: 3,
    totalSales: 245000,
    totalDiscounts: 32150,
    conversionRate: 12.5,
    averageOrderValue: 1250,
    totalCustomers: 1250,
    repeatCustomers: 340
  },
  campaigns: [
    {
      id: 1,
      name: "Summer Sale 2025",
      status: "active",
      startDate: "2025-01-15",
      endDate: "2025-02-15",
      metrics: {
        views: 1250,
        clicks: 340,
        conversions: 45,
        sales: 125000,
        discount: 15420,
        conversionRate: 13.2,
        clickThroughRate: 27.2,
        averageOrderValue: 2778
      },
      dailyData: [
        { date: "2025-01-15", views: 120, clicks: 32, conversions: 4, sales: 12500 },
        { date: "2025-01-16", views: 150, clicks: 41, conversions: 6, sales: 15200 },
        { date: "2025-01-17", views: 180, clicks: 48, conversions: 7, sales: 18200 },
        { date: "2025-01-18", views: 200, clicks: 55, conversions: 8, sales: 20100 },
        { date: "2025-01-19", views: 220, clicks: 60, conversions: 9, sales: 22100 },
        { date: "2025-01-20", views: 190, clicks: 52, conversions: 7, sales: 19200 },
        { date: "2025-01-21", views: 210, clicks: 58, conversions: 8, sales: 21200 }
      ]
    },
    {
      id: 2,
      name: "New Year Promotion",
      status: "ended",
      startDate: "2024-12-20",
      endDate: "2025-01-10",
      metrics: {
        views: 980,
        clicks: 245,
        conversions: 32,
        sales: 89000,
        discount: 8750,
        conversionRate: 13.1,
        clickThroughRate: 25.0,
        averageOrderValue: 2781
      },
      dailyData: [
        { date: "2024-12-20", views: 100, clicks: 25, conversions: 3, sales: 9000 },
        { date: "2024-12-21", views: 120, clicks: 30, conversions: 4, sales: 11000 },
        { date: "2024-12-22", views: 140, clicks: 35, conversions: 5, sales: 13000 },
        { date: "2024-12-23", views: 160, clicks: 40, conversions: 6, sales: 15000 },
        { date: "2024-12-24", views: 180, clicks: 45, conversions: 7, sales: 17000 },
        { date: "2024-12-25", views: 200, clicks: 50, conversions: 8, sales: 19000 },
        { date: "2024-12-26", views: 180, clicks: 45, conversions: 7, sales: 17000 }
      ]
    }
  ],
  topProducts: [
    { name: "Ammonium Sulfate 21-0-0", sales: 45000, units: 32, revenue: 45000 },
    { name: "Premium Seeds Mix", sales: 32000, units: 128, revenue: 32000 },
    { name: "Organic Compost 50kg", sales: 28000, units: 35, revenue: 28000 },
    { name: "Fertilizer NPK 14-14-14", sales: 25000, units: 20, revenue: 25000 },
    { name: "Pesticide Spray", sales: 18000, units: 90, revenue: 18000 }
  ],
  customerSegments: [
    { segment: "New Customers", count: 450, percentage: 36, revenue: 125000 },
    { segment: "Returning Customers", count: 340, percentage: 27.2, revenue: 89000 },
    { segment: "VIP Customers", count: 120, percentage: 9.6, revenue: 31000 },
    { segment: "Inactive Customers", count: 340, percentage: 27.2, revenue: 0 }
  ],
  timeSeries: [
    { month: "Jan 2024", sales: 120000, campaigns: 2 },
    { month: "Feb 2024", sales: 135000, campaigns: 3 },
    { month: "Mar 2024", sales: 150000, campaigns: 2 },
    { month: "Apr 2024", sales: 140000, campaigns: 4 },
    { month: "May 2024", sales: 165000, campaigns: 3 },
    { month: "Jun 2024", sales: 180000, campaigns: 5 },
    { month: "Jul 2024", sales: 175000, campaigns: 4 },
    { month: "Aug 2024", sales: 190000, campaigns: 6 },
    { month: "Sep 2024", sales: 200000, campaigns: 5 },
    { month: "Oct 2024", sales: 220000, campaigns: 7 },
    { month: "Nov 2024", sales: 210000, campaigns: 6 },
    { month: "Dec 2024", sales: 245000, campaigns: 8 }
  ]
};

const CampaignAnalytics: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockAnalytics.overview.totalSales)}</p>
              <p className="text-sm text-emerald-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% from last month
              </p>
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
              <p className="text-3xl font-bold text-gray-900">{formatPercentage(mockAnalytics.overview.conversionRate)}</p>
              <p className="text-sm text-emerald-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +2.1% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(mockAnalytics.overview.totalCustomers)}</p>
              <p className="text-sm text-emerald-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.2% from last month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockAnalytics.overview.averageOrderValue)}</p>
              <p className="text-sm text-red-600 flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                -1.2% from last month
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {mockAnalytics.campaigns.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600">
                      {campaign.startDate} - {campaign.endDate}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics.views)}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics.clicks)}</div>
                    <div className="text-sm text-gray-600">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics.conversions)}</div>
                    <div className="text-sm text-gray-600">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.metrics.sales)}</div>
                    <div className="text-sm text-gray-600">Sales</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatPercentage(campaign.metrics.conversionRate)}</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatPercentage(campaign.metrics.clickThroughRate)}</div>
                    <div className="text-sm text-gray-600">Click-through Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(campaign.metrics.averageOrderValue)}</div>
                    <div className="text-sm text-gray-600">Avg Order Value</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockAnalytics.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(product.revenue)}</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
          <div className="space-y-4">
            {mockAnalytics.customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-gray-900">{segment.segment}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatNumber(segment.count)}</div>
                  <div className="text-xs text-gray-600">{formatPercentage(segment.percentage)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Segment</h3>
          <div className="space-y-4">
            {mockAnalytics.customerSegments.map((segment, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{segment.segment}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(segment.revenue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${(segment.revenue / Math.max(...mockAnalytics.customerSegments.map(s => s.revenue))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimeSeries = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Trend (12 Months)</h3>
        <div className="space-y-4">
          {mockAnalytics.timeSeries.map((data, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium text-gray-900">{data.month}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full" 
                      style={{ width: `${(data.sales / Math.max(...mockAnalytics.timeSeries.map(d => d.sales))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{formatCurrency(data.sales)}</div>
                <div className="text-xs text-gray-600">{data.campaigns} campaigns</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Analytics</h2>
          <p className="text-gray-600">Track and analyze marketing campaign performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Campaigns</option>
              {mockAnalytics.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="customers">Customer Insights</option>
              <option value="trends">Time Series</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewType === 'overview' && renderOverview()}
      {viewType === 'customers' && renderCustomerInsights()}
      {viewType === 'trends' && renderTimeSeries()}
    </div>
  );
};

export default CampaignAnalytics;