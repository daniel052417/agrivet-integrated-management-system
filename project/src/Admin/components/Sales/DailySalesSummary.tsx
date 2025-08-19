import React, { useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Users, Clock, Package, Eye } from 'lucide-react';

const DailySalesSummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');

  const dailyMetrics = [
    {
      title: 'Total Sales',
      value: '₱47,265',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'bg-green-600'
    },
    {
      title: 'Total Orders',
      value: '23',
      change: '+8.7%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'bg-blue-600'
    },
    {
      title: 'Customers Served',
      value: '19',
      change: '+15.2%',
      isPositive: true,
      icon: Users,
      color: 'bg-purple-600'
    },
    {
      title: 'Average Order',
      value: '₱2,055',
      change: '+3.8%',
      isPositive: true,
      icon: Package,
      color: 'bg-orange-600'
    }
  ];

  const hourlyBreakdown = [
    { hour: '08:00', sales: 2450, orders: 2, customers: 2 },
    { hour: '09:00', sales: 4200, orders: 3, customers: 3 },
    { hour: '10:00', sales: 6800, orders: 4, customers: 3 },
    { hour: '11:00', sales: 5600, orders: 3, customers: 3 },
    { hour: '12:00', sales: 3200, orders: 2, customers: 2 },
    { hour: '13:00', sales: 7800, orders: 4, customers: 4 },
    { hour: '14:00', sales: 8900, orders: 3, customers: 2 },
    { hour: '15:00', sales: 4500, orders: 2, customers: 2 },
    { hour: '16:00', sales: 3815, orders: 1, customers: 1 }
  ];

  const topSellingToday = [
    { product: 'Veterinary Antibiotics', quantity: 12, revenue: '₱8,400', percentage: 17.8 },
    { product: 'Organic Fertilizer Premium', quantity: 8, revenue: '₱6,200', percentage: 13.1 },
    { product: 'Fresh Mango Export Grade', quantity: 15, revenue: '₱5,850', percentage: 12.4 },
    { product: 'Professional Pruning Tools', quantity: 3, revenue: '₱4,200', percentage: 8.9 },
    { product: 'Animal Vitamin Complex', quantity: 9, revenue: '₱3,600', percentage: 7.6 }
  ];

  const todaysTransactions = [
    {
      time: '15:45',
      customer: 'Maria Santos',
      items: ['Veterinary Syringe', 'Antibiotics'],
      total: 2450,
      payment: 'Cash',
      staff: 'Juan Dela Cruz'
    },
    {
      time: '14:20',
      customer: 'Pedro Martinez',
      items: ['Organic Fertilizer', 'Seeds'],
      total: 1850,
      payment: 'Card',
      staff: 'Ana Rodriguez'
    },
    {
      time: '13:15',
      customer: 'Carmen Lopez',
      items: ['Fresh Mangoes', 'Pruning Tools'],
      total: 3200,
      payment: 'Transfer',
      staff: 'Maria Santos'
    },
    {
      time: '11:30',
      customer: 'Roberto Garcia',
      items: ['Animal Feed'],
      total: 890,
      payment: 'Cash',
      staff: 'Juan Dela Cruz'
    }
  ];

  const paymentMethods = [
    { method: 'Cash', amount: '₱28,450', percentage: 60.2, color: 'bg-green-500' },
    { method: 'Credit Card', amount: '₱12,650', percentage: 26.8, color: 'bg-blue-500' },
    { method: 'Bank Transfer', amount: '₱6,165', percentage: 13.0, color: 'bg-purple-500' }
  ];

  const maxHourlySales = Math.max(...hourlyBreakdown.map(h => h.sales));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Sales Summary</h2>
          <p className="text-gray-600 mt-1">Detailed breakdown of today's sales performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Compare Dates</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dailyMetrics.map((metric, index) => {
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
                <p className="text-gray-400 text-xs mt-1">vs yesterday</p>
              </div>
              <div className={`w-full h-1 ${metric.color} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
            </div>
          );
        })}
      </div>

      {/* Hourly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Hourly Sales Breakdown</h3>
          <div className="text-sm text-gray-600">Peak: 14:00 (₱8,900)</div>
        </div>

        <div className="space-y-3">
          {hourlyBreakdown.map((hour, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {hour.hour}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">₱{hour.sales.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">{hour.orders} orders • {hour.customers} customers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(hour.sales / maxHourlySales) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Selling Products and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Selling Products Today</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topSellingToday.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.product}</p>
                    <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.revenue}</p>
                  <p className="text-xs text-gray-500">{product.percentage}% of sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {paymentMethods.map((payment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${payment.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{payment.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{payment.amount}</span>
                    <span className="text-xs text-gray-500 ml-2">({payment.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${payment.color}`}
                    style={{ width: `${payment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">₱47,265</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Today's Transactions</h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            {todaysTransactions.length} transactions
          </span>
        </div>

        <div className="space-y-4">
          {todaysTransactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{transaction.time}</div>
                  <div className="text-xs text-gray-500">Time</div>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-sm font-medium text-gray-900">{transaction.customer}</p>
                  <p className="text-xs text-gray-500">{transaction.items.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₱{transaction.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{transaction.payment} • {transaction.staff}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Daily Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">+12.5%</p>
            <p className="text-sm text-gray-600">vs Yesterday</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">14:00</p>
            <p className="text-sm text-gray-600">Peak Hour</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">82.6%</p>
            <p className="text-sm text-gray-600">Customer Return Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesSummary;