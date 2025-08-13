import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter, Plus, Eye, Edit, BarChart3, PieChart, Warehouse } from 'lucide-react';

const InventorySummaryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const inventoryMetrics = [
    {
      title: 'Total Inventory Value',
      value: '₱2,847,650',
      change: '+12.3%',
      isPositive: true,
      period: 'Current Stock',
      color: 'bg-blue-600'
    },
    {
      title: 'Total Products',
      value: '3,247',
      change: '+8.7%',
      isPositive: true,
      period: 'Active Items',
      color: 'bg-green-600'
    },
    {
      title: 'Low Stock Items',
      value: '23',
      change: '-15.2%',
      isPositive: true,
      period: 'Need Restock',
      color: 'bg-orange-600'
    },
    {
      title: 'Out of Stock',
      value: '8',
      change: '-25.0%',
      isPositive: true,
      period: 'Urgent Action',
      color: 'bg-red-600'
    }
  ];

  const categoryBreakdown = [
    {
      category: 'Veterinary Medicines',
      totalItems: 1245,
      totalValue: '₱1,485,200',
      inStock: 1198,
      lowStock: 12,
      outOfStock: 3,
      avgValue: '₱1,193',
      color: 'bg-red-500',
      trend: '+5.2%'
    },
    {
      category: 'Agricultural Products',
      totalItems: 892,
      totalValue: '₱824,150',
      inStock: 856,
      lowStock: 8,
      outOfStock: 2,
      avgValue: '₱924',
      color: 'bg-green-500',
      trend: '+8.1%'
    },
    {
      category: 'Fresh Fruits',
      totalItems: 456,
      totalValue: '₱318,750',
      inStock: 445,
      lowStock: 2,
      outOfStock: 1,
      avgValue: '₱699',
      color: 'bg-orange-500',
      trend: '-2.3%'
    },
    {
      category: 'Tools & Equipment',
      totalItems: 254,
      totalValue: '₱195,890',
      inStock: 251,
      lowStock: 1,
      outOfStock: 2,
      avgValue: '₱771',
      color: 'bg-blue-500',
      trend: '+12.5%'
    },
    {
      category: 'Animal Feed',
      totalItems: 400,
      totalValue: '₱123,660',
      inStock: 398,
      lowStock: 0,
      outOfStock: 0,
      avgValue: '₱309',
      color: 'bg-yellow-500',
      trend: '+6.8%'
    }
  ];

  const lowStockItems = [
    { name: 'Veterinary Syringes 10ml', category: 'Medicines', current: 12, minimum: 50, supplier: 'MedVet Supplies', lastOrder: '2024-01-10', urgency: 'high' },
    { name: 'Organic Fertilizer Premium', category: 'Agriculture', current: 8, minimum: 25, supplier: 'Green Valley', lastOrder: '2024-01-08', urgency: 'high' },
    { name: 'Animal Feed Pellets', category: 'Feed', current: 15, minimum: 40, supplier: 'Feed Corp', lastOrder: '2024-01-12', urgency: 'medium' },
    { name: 'Pruning Shears Professional', category: 'Tools', current: 3, minimum: 15, supplier: 'Garden Tools Inc', lastOrder: '2024-01-05', urgency: 'high' },
    { name: 'Vitamin B Complex', category: 'Medicines', current: 18, minimum: 30, supplier: 'VetCare Products', lastOrder: '2024-01-14', urgency: 'medium' }
  ];

  const topValueItems = [
    { name: 'Advanced Veterinary Scanner', value: '₱125,000', quantity: 2, category: 'Equipment' },
    { name: 'Premium Antibiotics Set', value: '₱89,500', quantity: 45, category: 'Medicines' },
    { name: 'Professional Greenhouse Kit', value: '₱67,800', quantity: 8, category: 'Agriculture' },
    { name: 'Surgical Instruments Set', value: '₱54,200', quantity: 12, category: 'Equipment' },
    { name: 'Organic Seed Collection', value: '₱43,600', quantity: 156, category: 'Agriculture' }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Summary</h2>
          <p className="text-gray-600 mt-1">Complete overview of stock levels, values, and inventory health</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Inventory Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Package className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex items-center space-x-1">
                {metric.isPositive ? (
                  <TrendingUp className={`w-4 h-4 ${metric.color.replace('bg-', 'text-')}`} />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-semibold ${metric.isPositive ? metric.color.replace('bg-', 'text-') : 'text-red-500'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
              <p className="text-gray-400 text-xs mt-1">{metric.period}</p>
            </div>
            <div className={`w-full h-1 ${metric.color} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Inventory by Category</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categoryBreakdown.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{category.totalItems}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{category.totalValue}</td>
                  <td className="px-4 py-4 text-sm text-green-600">{category.inStock}</td>
                  <td className="px-4 py-4 text-sm text-orange-600">{category.lowStock}</td>
                  <td className="px-4 py-4 text-sm text-red-600">{category.outOfStock}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{category.avgValue}</td>
                  <td className="px-4 py-4">
                    <span className={`text-sm ${category.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {category.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts and Top Value Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
            </div>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              {lowStockItems.length} items
            </span>
          </div>

          <div className="space-y-4">
            {lowStockItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.category} • {item.supplier}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                    {item.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Current: <strong className="text-red-600">{item.current}</strong></span>
                    <span>Min: <strong>{item.minimum}</strong></span>
                    <span>Last Order: {item.lastOrder}</span>
                  </div>
                  <button className="text-green-600 hover:text-green-800 text-xs font-medium">
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Value Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Highest Value Items</h3>
            </div>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topValueItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Health Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Inventory Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">92.8%</p>
            <p className="text-sm text-gray-600">Stock Availability</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">₱2.8M</p>
            <p className="text-sm text-gray-600">Total Inventory Value</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">23</p>
            <p className="text-sm text-gray-600">Items Need Restock</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">+8.5%</p>
            <p className="text-sm text-gray-600">Value Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryPage;