import React, { useState } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, BarChart3, PieChart, Download, Calendar, Filter, Eye, FileText, Warehouse, Archive } from 'lucide-react';

const InventoryReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportTypes = [
    {
      title: 'Stock Level Report',
      description: 'Current inventory levels across all categories',
      icon: Package,
      color: 'bg-blue-600',
      lastGenerated: '2024-01-15',
      frequency: 'Daily',
      status: 'Available'
    },
    {
      title: 'Low Stock Alert Report',
      description: 'Items below minimum stock threshold',
      icon: AlertTriangle,
      color: 'bg-orange-600',
      lastGenerated: '2024-01-15',
      frequency: 'Real-time',
      status: 'Available'
    },
    {
      title: 'Inventory Valuation Report',
      description: 'Total value of inventory by category',
      icon: BarChart3,
      color: 'bg-green-600',
      lastGenerated: '2024-01-14',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Stock Movement Report',
      description: 'Inventory in/out movements and trends',
      icon: TrendingUp,
      color: 'bg-purple-600',
      lastGenerated: '2024-01-13',
      frequency: 'Weekly',
      status: 'Available'
    },
    {
      title: 'Supplier Performance Report',
      description: 'Delivery times and quality metrics',
      icon: Warehouse,
      color: 'bg-indigo-600',
      lastGenerated: '2024-01-12',
      frequency: 'Monthly',
      status: 'Available'
    },
    {
      title: 'Dead Stock Analysis',
      description: 'Items with no movement for extended periods',
      icon: Archive,
      color: 'bg-red-600',
      lastGenerated: '2024-01-10',
      frequency: 'Monthly',
      status: 'Available'
    }
  ];

  const inventoryMetrics = [
    {
      title: 'Total Inventory Value',
      value: '₱2,847,650',
      change: '+12.3%',
      isPositive: true,
      period: 'Current Stock'
    },
    {
      title: 'Stock Turnover Rate',
      value: '4.2x',
      change: '+0.8x',
      isPositive: true,
      period: 'Annual Rate'
    },
    {
      title: 'Low Stock Items',
      value: '23',
      change: '-15.2%',
      isPositive: true,
      period: 'Need Restock'
    },
    {
      title: 'Out of Stock',
      value: '8',
      change: '-25.0%',
      isPositive: true,
      period: 'Zero Inventory'
    }
  ];

  const categoryAnalysis = [
    {
      category: 'Veterinary Medicines',
      currentStock: 1245,
      value: '₱1,485,200',
      turnover: 5.2,
      trend: '+8.5%',
      status: 'Healthy',
      color: 'bg-red-500'
    },
    {
      category: 'Agricultural Products',
      currentStock: 892,
      value: '₱824,150',
      turnover: 3.8,
      trend: '+12.1%',
      status: 'Healthy',
      color: 'bg-green-500'
    },
    {
      category: 'Fresh Fruits',
      currentStock: 456,
      value: '₱318,750',
      turnover: 8.1,
      trend: '+5.3%',
      status: 'High Turnover',
      color: 'bg-orange-500'
    },
    {
      category: 'Tools & Equipment',
      currentStock: 254,
      value: '₱195,890',
      turnover: 2.1,
      trend: '-2.8%',
      status: 'Slow Moving',
      color: 'bg-blue-500'
    },
    {
      category: 'Animal Feed',
      currentStock: 400,
      value: '₱123,660',
      turnover: 6.5,
      trend: '+15.7%',
      status: 'Excellent',
      color: 'bg-yellow-500'
    }
  ];

  const recentReports = [
    {
      name: 'Monthly Inventory Valuation - January 2024',
      type: 'Valuation',
      generatedDate: '2024-01-15',
      size: '2.4 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Low Stock Alert Report',
      type: 'Alert',
      generatedDate: '2024-01-15',
      size: '856 KB',
      format: 'Excel',
      status: 'Completed'
    },
    {
      name: 'Supplier Performance Q4 2023',
      type: 'Performance',
      generatedDate: '2024-01-14',
      size: '1.8 MB',
      format: 'PDF',
      status: 'Completed'
    },
    {
      name: 'Stock Movement Analysis',
      type: 'Movement',
      generatedDate: '2024-01-13',
      size: '3.2 MB',
      format: 'Excel',
      status: 'Completed'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-100 text-green-800';
      case 'High Turnover': return 'bg-blue-100 text-blue-800';
      case 'Slow Moving': return 'bg-orange-100 text-orange-800';
      case 'Excellent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive inventory analysis and reporting</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Schedule Report</span>
          </button>
        </div>
      </div>

      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {inventoryMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="flex items-center space-x-1">
                {metric.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
              <p className="text-gray-500 text-xs mt-1">{metric.period}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Available Reports</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${report.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {report.status}
                  </span>
                </div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h4>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="font-medium">{report.frequency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Generated:</span>
                    <span className="font-medium">{report.lastGenerated}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Generate</span>
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Category Analysis</h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turnover Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoryAnalysis.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{category.currentStock.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{category.value}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{category.turnover}x</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${category.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {category.trend}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(category.status)}`}>
                      {category.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Reports</h3>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentReports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{report.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.generatedDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.size}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.format}</td>
                  <td className="px-4 py-3">
                    <button className="text-green-600 hover:text-green-700 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;