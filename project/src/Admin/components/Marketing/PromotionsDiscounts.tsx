import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Percent, Tag, Users, TrendingUp, Gift, Clock, Target, Filter, Download } from 'lucide-react';

const PromotionsDiscounts: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('active');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const promotions = [
    {
      id: 1,
      name: 'Summer Veterinary Sale',
      type: 'Percentage Discount',
      discount: '25%',
      category: 'Medicines',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      status: 'Active',
      usage: 156,
      limit: 500,
      revenue: 89500,
      description: '25% off all veterinary medicines and supplies'
    },
    {
      id: 2,
      name: 'Buy 2 Get 1 Free - Fertilizers',
      type: 'BOGO Offer',
      discount: 'Buy 2 Get 1',
      category: 'Agriculture',
      startDate: '2024-01-10',
      endDate: '2024-01-31',
      status: 'Active',
      usage: 89,
      limit: 200,
      revenue: 67800,
      description: 'Buy 2 bags of fertilizer, get 1 free'
    },
    {
      id: 3,
      name: 'New Customer Welcome',
      type: 'Fixed Amount',
      discount: '₱500',
      category: 'All Products',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'Active',
      usage: 234,
      limit: 1000,
      revenue: 45600,
      description: '₱500 off first purchase for new customers'
    },
    {
      id: 4,
      name: 'Holiday Fruit Special',
      type: 'Percentage Discount',
      discount: '15%',
      category: 'Fruits',
      startDate: '2023-12-20',
      endDate: '2024-01-05',
      status: 'Expired',
      usage: 78,
      limit: 150,
      revenue: 23400,
      description: '15% off all fresh fruits during holidays'
    },
    {
      id: 5,
      name: 'Tools & Equipment Bundle',
      type: 'Bundle Discount',
      discount: '30%',
      category: 'Tools',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      status: 'Scheduled',
      usage: 0,
      limit: 100,
      revenue: 0,
      description: '30% off when buying 3 or more tools'
    }
  ];

  const discountTypes = [
    { type: 'Percentage Discount', count: 12, revenue: 234500, color: 'bg-blue-500' },
    { type: 'Fixed Amount', count: 8, revenue: 156800, color: 'bg-green-500' },
    { type: 'BOGO Offer', count: 5, revenue: 89300, color: 'bg-purple-500' },
    { type: 'Bundle Discount', count: 3, revenue: 67200, color: 'bg-orange-500' }
  ];

  const performanceMetrics = [
    {
      title: 'Active Promotions',
      value: '12',
      change: '+3 this month',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: Tag
    },
    {
      title: 'Total Revenue Generated',
      value: '₱547K',
      change: '+18.5% vs last month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: TrendingUp
    },
    {
      title: 'Customers Reached',
      value: '2,847',
      change: '+12.3% engagement',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Users
    },
    {
      title: 'Average Discount',
      value: '22.5%',
      change: 'Optimal range',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Percent
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Expired': return 'bg-gray-100 text-gray-800';
      case 'Paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Percentage Discount': return 'bg-blue-100 text-blue-800';
      case 'Fixed Amount': return 'bg-green-100 text-green-800';
      case 'BOGO Offer': return 'bg-purple-100 text-purple-800';
      case 'Bundle Discount': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPromotions = promotions.filter(promo => {
    if (selectedTab === 'all') return true;
    return promo.status.toLowerCase() === selectedTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Promotions & Discounts</h2>
          <p className="text-gray-600 mt-1">Manage promotional campaigns and discount offers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Promotion</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{metric.title}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discount Types Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Discount Types Performance</h3>
          <Gift className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {discountTypes.map((type, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${type.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{type.count}</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">{type.type}</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Revenue:</span>
                  <span className="font-medium">₱{(type.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Active:</span>
                  <span>{type.count} campaigns</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['all', 'active', 'scheduled', 'expired'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTab === tab
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="medicines">Medicines</option>
              <option value="agriculture">Agriculture</option>
              <option value="fruits">Fruits</option>
              <option value="tools">Tools</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Promotions ({filteredPromotions.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                      <div className="text-sm text-gray-500">{promotion.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(promotion.type)}`}>
                      {promotion.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Percent className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">{promotion.discount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{promotion.startDate}</div>
                      <div className="text-gray-500">to {promotion.endDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span>{promotion.usage}</span>
                          <span className="text-gray-500">/{promotion.limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(promotion.usage / promotion.limit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{promotion.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion.status)}`}>
                      {promotion.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition-colors">
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Tag className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Seasonal Campaign</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Customer Segment</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Gift className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Bundle Offer</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">A/B Test Campaign</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionsDiscounts;