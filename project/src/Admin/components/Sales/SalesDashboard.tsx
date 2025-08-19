import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Target, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';

const SalesDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const salesMetrics = [
    {
      title: 'Total Sales',
      value: '₱2,847,650',
      change: '+18.5%',
      isPositive: true,
      period: 'This Month',
      icon: DollarSign,
      color: 'bg-green-600'
    },
    {
      title: 'Total Orders',
      value: '1,247',
      change: '+12.3%',
      isPositive: true,
      period: 'This Month',
      icon: ShoppingCart,
      color: 'bg-blue-600'
    },
    {
      title: 'New Customers',
      value: '245',
      change: '+8.7%',
      isPositive: true,
      period: 'This Month',
      icon: Users,
      color: 'bg-purple-600'
    },
    {
      title: 'Sales Target',
      value: '87.5%',
      change: '+5.2%',
      isPositive: true,
      period: 'Achievement',
      icon: Target,
      color: 'bg-orange-600'
    }
  ];

  const salesTrends = [
    { period: 'Week 1', sales: 680000, orders: 298, target: 700000 },
    { period: 'Week 2', sales: 720000, orders: 312, target: 700000 },
    { period: 'Week 3', sales: 650000, orders: 285, target: 700000 },
    { period: 'Week 4', sales: 797650, orders: 352, target: 700000 }
  ];

  const topProducts = [
    { name: 'Veterinary Antibiotics', sales: '₱285,400', units: 456, growth: '+22.1%' },
    { name: 'Organic Fertilizer Premium', sales: '₱198,750', units: 324, growth: '+18.5%' },
    { name: 'Fresh Mango Export Grade', sales: '₱167,200', units: 289, growth: '+15.3%' },
    { name: 'Professional Pruning Tools', sales: '₱134,890', units: 198, growth: '+12.7%' },
    { name: 'Animal Vitamin Complex', sales: '₱98,650', units: 234, growth: '+9.8%' }
  ];

  const salesByChannel = [
    { channel: 'In-Store', percentage: 65, value: '₱1,850,872', color: 'bg-green-500' },
    { channel: 'Online Orders', percentage: 25, value: '₱711,912', color: 'bg-blue-500' },
    { channel: 'Phone Orders', percentage: 10, value: '₱284,866', color: 'bg-purple-500' }
  ];

  const recentTransactions = [
    { id: 'TXN-001', customer: 'Maria Santos', amount: '₱2,450', time: '10 min ago', status: 'completed' },
    { id: 'TXN-002', customer: 'Pedro Martinez', amount: '₱1,850', time: '25 min ago', status: 'completed' },
    { id: 'TXN-003', customer: 'Carmen Lopez', amount: '₱3,200', time: '1 hour ago', status: 'pending' },
    { id: 'TXN-004', customer: 'Roberto Garcia', amount: '₱890', time: '2 hours ago', status: 'completed' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time sales performance and analytics</p>
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
            <Calendar className="w-4 h-4" />
            <span>Custom Range</span>
          </button>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
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
          );
        })}
      </div>

      {/* Sales Trends and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {salesTrends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{trend.period}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">₱{(trend.sales / 1000).toFixed(0)}K</span>
                    <span className="text-xs text-gray-500 ml-2">({trend.orders} orders)</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${trend.sales >= trend.target ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min((trend.sales / trend.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="absolute right-0 top-0 w-1 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Target: ₱{(trend.target / 1000).toFixed(0)}K</span>
                  <span className={trend.sales >= trend.target ? 'text-green-600' : 'text-orange-600'}>
                    {((trend.sales / trend.target) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
            <Activity className="w-5 h-5 text-gray-400" />
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
                  <p className="text-xs text-green-600">{product.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales by Channel and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales by Channel</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {salesByChannel.map((channel, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{channel.value}</span>
                    <span className="text-xs text-gray-500 ml-2">({channel.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${channel.color}`}
                    style={{ width: `${channel.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.id}</p>
                    <p className="text-xs text-gray-500">{transaction.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{transaction.amount}</p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">+18.5%</p>
            <p className="text-sm text-gray-600">Sales Growth</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">87.5%</p>
            <p className="text-sm text-gray-600">Target Achievement</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">245</p>
            <p className="text-sm text-gray-600">New Customers</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">₱2,284</p>
            <p className="text-sm text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;