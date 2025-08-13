import React, { useState } from 'react';
import { AlertTriangle, Package, TrendingDown, Clock, Truck, Eye, Edit, Search, Filter, Download, Plus, RefreshCw, ShoppingCart, Phone, Mail, Calendar, BarChart3 } from 'lucide-react';

const LowStockAlerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const lowStockItems = [
    {
      id: 1,
      name: 'Veterinary Syringes 10ml',
      sku: 'VET-SYR-001',
      category: 'Medicines',
      currentStock: 12,
      minimumStock: 50,
      reorderLevel: 75,
      unitPrice: 45.00,
      totalValue: 540.00,
      supplier: 'MedVet Supplies',
      supplierContact: '+63 2 8123 4567',
      supplierEmail: 'orders@medvet.com',
      lastOrderDate: '2024-01-10',
      leadTime: '5-7 days',
      urgency: 'Critical',
      daysUntilEmpty: 3,
      avgDailyUsage: 4
    },
    {
      id: 2,
      name: 'Organic Fertilizer Premium Grade',
      sku: 'AGR-FER-002',
      category: 'Agriculture',
      currentStock: 8,
      minimumStock: 25,
      reorderLevel: 40,
      unitPrice: 125.00,
      totalValue: 1000.00,
      supplier: 'Green Valley Supplies',
      supplierContact: '+63 2 8234 5678',
      supplierEmail: 'sales@greenvalley.com',
      lastOrderDate: '2024-01-08',
      leadTime: '3-5 days',
      urgency: 'Critical',
      daysUntilEmpty: 2,
      avgDailyUsage: 4
    },
    {
      id: 3,
      name: 'Animal Feed Pellets Premium',
      sku: 'FEED-PEL-003',
      category: 'Animal Feed',
      currentStock: 15,
      minimumStock: 40,
      reorderLevel: 60,
      unitPrice: 85.00,
      totalValue: 1275.00,
      supplier: 'Feed Corporation',
      supplierContact: '+63 2 8345 6789',
      supplierEmail: 'orders@feedcorp.com',
      lastOrderDate: '2024-01-12',
      leadTime: '2-4 days',
      urgency: 'High',
      daysUntilEmpty: 5,
      avgDailyUsage: 3
    },
    {
      id: 4,
      name: 'Professional Pruning Shears',
      sku: 'TLS-PRN-004',
      category: 'Tools',
      currentStock: 3,
      minimumStock: 15,
      reorderLevel: 25,
      unitPrice: 350.00,
      totalValue: 1050.00,
      supplier: 'Garden Tools Inc',
      supplierContact: '+63 2 8456 7890',
      supplierEmail: 'sales@gardentools.com',
      lastOrderDate: '2024-01-05',
      leadTime: '7-10 days',
      urgency: 'Critical',
      daysUntilEmpty: 6,
      avgDailyUsage: 0.5
    },
    {
      id: 5,
      name: 'Vitamin B Complex for Animals',
      sku: 'VET-VIT-005',
      category: 'Medicines',
      currentStock: 18,
      minimumStock: 30,
      reorderLevel: 45,
      unitPrice: 180.00,
      totalValue: 3240.00,
      supplier: 'VetCare Products',
      supplierContact: '+63 2 8567 8901',
      supplierEmail: 'orders@vetcare.com',
      lastOrderDate: '2024-01-14',
      leadTime: '4-6 days',
      urgency: 'Medium',
      daysUntilEmpty: 9,
      avgDailyUsage: 2
    },
    {
      id: 6,
      name: 'Organic Tomato Seeds Premium',
      sku: 'AGR-SED-006',
      category: 'Agriculture',
      currentStock: 22,
      minimumStock: 35,
      reorderLevel: 50,
      unitPrice: 25.00,
      totalValue: 550.00,
      supplier: 'Seed Masters Co',
      supplierContact: '+63 2 8678 9012',
      supplierEmail: 'info@seedmasters.com',
      lastOrderDate: '2024-01-11',
      leadTime: '3-5 days',
      urgency: 'Medium',
      daysUntilEmpty: 11,
      avgDailyUsage: 2
    }
  ];

  const alertMetrics = [
    {
      title: 'Critical Alerts',
      value: '3',
      description: 'Immediate action required',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: AlertTriangle
    },
    {
      title: 'High Priority',
      value: '1',
      description: 'Reorder within 3 days',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Clock
    },
    {
      title: 'Medium Priority',
      value: '2',
      description: 'Reorder within 7 days',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: Package
    },
    {
      title: 'Total Value at Risk',
      value: '₱7,655',
      description: 'Value of low stock items',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: TrendingDown
    }
  ];

  const categoryBreakdown = [
    { category: 'Medicines', items: 2, value: '₱3,780', urgency: 'Critical', color: 'bg-red-500' },
    { category: 'Agriculture', items: 2, value: '₱1,550', urgency: 'High', color: 'bg-green-500' },
    { category: 'Animal Feed', items: 1, value: '₱1,275', urgency: 'High', color: 'bg-yellow-500' },
    { category: 'Tools', items: 1, value: '₱1,050', urgency: 'Critical', color: 'bg-blue-500' }
  ];

  const reorderSuggestions = [
    {
      supplier: 'MedVet Supplies',
      items: 2,
      totalValue: '₱3,780',
      contact: '+63 2 8123 4567',
      email: 'orders@medvet.com',
      leadTime: '5-7 days',
      lastOrder: '2024-01-10'
    },
    {
      supplier: 'Green Valley Supplies',
      items: 1,
      totalValue: '₱1,000',
      contact: '+63 2 8234 5678',
      email: 'sales@greenvalley.com',
      leadTime: '3-5 days',
      lastOrder: '2024-01-08'
    },
    {
      supplier: 'Garden Tools Inc',
      items: 1,
      totalValue: '₱1,050',
      contact: '+63 2 8456 7890',
      email: 'sales@gardentools.com',
      leadTime: '7-10 days',
      lastOrder: '2024-01-05'
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Medicines': return 'bg-red-100 text-red-800';
      case 'Agriculture': return 'bg-green-100 text-green-800';
      case 'Animal Feed': return 'bg-yellow-100 text-yellow-800';
      case 'Tools': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || item.urgency.toLowerCase() === selectedUrgency;
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesUrgency && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h2>
          <p className="text-gray-600 mt-1">Monitor and manage inventory items that need immediate attention</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Alerts</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Alert Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {alertMetrics.map((metric, index) => {
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
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown and Reorder Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Alerts by Category</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-xs text-gray-500">{category.items} items • {category.urgency} priority</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{category.value}</p>
                  <p className="text-xs text-gray-500">at risk</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reorder Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Reorder Suggestions</h3>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {reorderSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{suggestion.supplier}</h4>
                    <p className="text-xs text-gray-500">{suggestion.items} items • {suggestion.totalValue}</p>
                  </div>
                  <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Reorder</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{suggestion.contact}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{suggestion.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Lead time: {suggestion.leadTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Last order: {suggestion.lastOrder}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="medicines">Medicines</option>
            <option value="agriculture">Agriculture</option>
            <option value="animal feed">Animal Feed</option>
            <option value="tools">Tools</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Low Stock Items ({filteredItems.length})
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-refresh:</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-xs text-gray-400">₱{item.unitPrice.toFixed(2)} each</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-red-600">{item.currentStock}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{item.minimumStock}</span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            (item.currentStock / item.minimumStock) < 0.3 ? 'bg-red-500' :
                            (item.currentStock / item.minimumStock) < 0.6 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((item.currentStock / item.minimumStock) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {item.minimumStock} • Reorder: {item.reorderLevel}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        item.daysUntilEmpty <= 3 ? 'text-red-600' :
                        item.daysUntilEmpty <= 7 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {item.daysUntilEmpty}
                      </div>
                      <div className="text-xs text-gray-500">days</div>
                      <div className="text-xs text-gray-400">
                        {item.avgDailyUsage}/day avg
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.supplier}</div>
                      <div className="text-xs text-gray-500">{item.supplierContact}</div>
                      <div className="text-xs text-gray-400">Last order: {item.lastOrderDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{item.leadTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                      {item.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                        <ShoppingCart className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 transition-colors">
                        <Edit className="w-4 h-4" />
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
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Reorder All Critical</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Truck className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Contact Suppliers</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Adjust Min Levels</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export Alert Report</span>
          </button>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Alert Activity</h3>
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {[
            { time: '2 hours ago', action: 'Critical alert triggered', item: 'Veterinary Syringes 10ml', type: 'critical' },
            { time: '4 hours ago', action: 'Reorder completed', item: 'Animal Feed Premium', type: 'success' },
            { time: '6 hours ago', action: 'Stock level updated', item: 'Organic Fertilizer', type: 'info' },
            { time: '1 day ago', action: 'Supplier contacted', item: 'Pruning Shears', type: 'info' },
            { time: '2 days ago', action: 'Alert resolved', item: 'Vitamin Complex', type: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'critical' ? 'bg-red-500' :
                activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.item}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlerts;