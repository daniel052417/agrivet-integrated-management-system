import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download, Eye, BarChart3, PieChart, Target } from 'lucide-react';

const SalesValue: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const salesMetrics = [
    {
      title: 'Total Sales Value',
      value: '₱1,247,850',
      change: '+18.5%',
      isPositive: true,
      period: 'This Month',
      color: 'bg-green-600',
      icon: 'sales'
    },
    {
      title: 'Average Order Value',
      value: '₱2,450',
      change: '+12.3%',
      isPositive: true,
      period: 'This Month',
      color: 'bg-blue-600',
      icon: 'order'
    },
    {
      title: 'Daily Sales Average',
      value: '₱41,595',
      change: '+8.7%',
      isPositive: true,
      period: 'Last 30 Days',
      color: 'bg-purple-600',
      icon: 'daily'
    },
    {
      title: 'Sales Target Achievement',
      value: '87.5%',
      change: '+5.2%',
      isPositive: true,
      period: 'Monthly Target',
      color: 'bg-orange-600',
      icon: 'target'
    }
  ];

  const salesByCategory = [
    { category: 'Veterinary Medicines', value: '₱485,200', percentage: 38.9, growth: '+22.1%', color: 'bg-red-500' },
    { category: 'Agricultural Products', value: '₱324,150', percentage: 26.0, growth: '+15.8%', color: 'bg-green-500' },
    { category: 'Fresh Fruits', value: '₱218,750', percentage: 17.5, growth: '+8.3%', color: 'bg-orange-500' },
    { category: 'Tools & Equipment', value: '₱156,890', percentage: 12.6, growth: '+18.9%', color: 'bg-blue-500' },
    { category: 'Animal Feed', value: '₱62,860', percentage: 5.0, growth: '+12.4%', color: 'bg-yellow-500' }
  ];

  const monthlyTrends = [
    { month: 'Jan', sales: 980000, target: 1000000, orders: 245 },
    { month: 'Feb', sales: 1120000, target: 1100000, orders: 289 },
    { month: 'Mar', sales: 1050000, target: 1150000, orders: 267 },
    { month: 'Apr', sales: 1280000, target: 1200000, orders: 312 },
    { month: 'May', sales: 1350000, target: 1250000, orders: 334 },
    { month: 'Jun', sales: 1247850, target: 1300000, orders: 298 }
  ];

  const topProducts = [
    { name: 'Veterinary Antibiotics', sales: '₱125,400', units: 234, margin: '45%' },
    { name: 'Organic Fertilizer Premium', sales: '₱98,750', units: 189, margin: '38%' },
    { name: 'Fresh Mango Export Grade', sales: '₱87,200', units: 156, margin: '52%' },
    { name: 'Professional Pruning Tools', sales: '₱76,890', units: 98, margin: '42%' },
    { name: 'Animal Vitamin Complex', sales: '₱65,430', units: 145, margin: '48%' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Value Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive sales performance and revenue analysis</p>
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
            <option value="yearly">Yearly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <DollarSign className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
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

      {/* Sales Trends Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales Trends vs Targets</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Actual Sales</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-600">Target</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {monthlyTrends.map((trend, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{trend.month}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">₱{(trend.sales / 1000).toFixed(0)}K</span>
                  <span className="text-xs text-gray-500">{trend.orders} orders</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full relative"
                      style={{ width: `${(trend.sales / trend.target) * 100}%` }}
                    >
                      <div className="absolute right-0 top-0 w-1 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-sm font-medium ${trend.sales >= trend.target ? 'text-green-600' : 'text-orange-600'}`}>
                  {((trend.sales / trend.target) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by Category and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {salesByCategory.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{category.value}</span>
                    <span className="text-xs text-green-600 ml-2">{category.growth}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${category.color}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{category.percentage}% of total sales</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products by Sales Value */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Products by Sales Value</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.sales}</p>
                  <p className="text-xs text-green-600">{product.margin} margin</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">87.5%</p>
            <p className="text-sm text-gray-600">Target Achievement</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">+18.5%</p>
            <p className="text-sm text-gray-600">Growth Rate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₱2,450</p>
            <p className="text-sm text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesValue;