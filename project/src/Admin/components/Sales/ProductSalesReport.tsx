import React, { useState } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Package, BarChart3, Eye, Calendar } from 'lucide-react';

const ProductSalesReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');

  const productSalesData = [
    {
      id: 1,
      name: 'Veterinary Antibiotics Premium',
      category: 'Medicines',
      sku: 'VET-ANT-001',
      unitsSold: 456,
      revenue: 285400,
      profit: 128430,
      margin: 45.0,
      growth: 22.1,
      isPositive: true,
      stock: 89,
      avgPrice: 625.88
    },
    {
      id: 2,
      name: 'Organic Fertilizer Premium Grade',
      category: 'Agriculture',
      sku: 'AGR-FER-002',
      unitsSold: 324,
      revenue: 198750,
      profit: 75525,
      margin: 38.0,
      growth: 18.5,
      isPositive: true,
      stock: 156,
      avgPrice: 613.43
    },
    {
      id: 3,
      name: 'Fresh Mango Export Grade A',
      category: 'Fruits',
      sku: 'FRT-MNG-003',
      unitsSold: 289,
      revenue: 167200,
      profit: 86944,
      margin: 52.0,
      growth: 15.3,
      isPositive: true,
      stock: 45,
      avgPrice: 578.55
    },
    {
      id: 4,
      name: 'Professional Pruning Tools Set',
      category: 'Tools',
      sku: 'TLS-PRN-004',
      unitsSold: 198,
      revenue: 134890,
      profit: 56654,
      margin: 42.0,
      growth: 12.7,
      isPositive: true,
      stock: 23,
      avgPrice: 681.26
    },
    {
      id: 5,
      name: 'Animal Vitamin Complex B12',
      category: 'Medicines',
      sku: 'VET-VIT-005',
      unitsSold: 234,
      revenue: 98650,
      profit: 47352,
      margin: 48.0,
      growth: 9.8,
      isPositive: true,
      stock: 67,
      avgPrice: 421.58
    },
    {
      id: 6,
      name: 'Organic Tomato Seeds Premium',
      category: 'Agriculture',
      sku: 'AGR-SED-006',
      unitsSold: 567,
      revenue: 85050,
      profit: 29767,
      margin: 35.0,
      growth: -3.2,
      isPositive: false,
      stock: 234,
      avgPrice: 150.00
    }
  ];

  const categoryPerformance = [
    { category: 'Medicines', revenue: 384050, units: 690, growth: 18.2, color: 'bg-red-500' },
    { category: 'Agriculture', revenue: 283800, units: 891, growth: 12.8, color: 'bg-green-500' },
    { category: 'Fruits', revenue: 167200, units: 289, growth: 15.3, color: 'bg-orange-500' },
    { category: 'Tools', revenue: 134890, units: 198, growth: 12.7, color: 'bg-blue-500' }
  ];

  const topPerformers = productSalesData
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalRevenue = productSalesData.reduce((sum, product) => sum + product.revenue, 0);
  const totalUnits = productSalesData.reduce((sum, product) => sum + product.unitsSold, 0);
  const avgMargin = productSalesData.reduce((sum, product) => sum + product.margin, 0) / productSalesData.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Sales Report</h2>
          <p className="text-gray-600 mt-1">Detailed analysis of product performance and sales metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{(totalRevenue / 1000).toFixed(0)}K</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Margin</p>
              <p className="text-2xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Products Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{productSalesData.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Performance by Category</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryPerformance.map((category, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{category.category}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Revenue</span>
                  <span className="text-sm font-bold text-gray-900">₱{(category.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Units</span>
                  <span className="text-sm text-gray-700">{category.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Growth</span>
                  <span className="text-sm text-green-600">+{category.growth}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="medicines">Medicines</option>
            <option value="agriculture">Agriculture</option>
            <option value="fruits">Fruits</option>
            <option value="tools">Tools & Equipment</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Product Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productSalesData.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.unitsSold.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₱{product.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{product.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.margin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {product.isPositive ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-sm ${product.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {product.isPositive ? '+' : ''}{product.growth}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${product.stock < 50 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Performing Products</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topPerformers.map((product, index) => (
            <div key={product.id} className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold mx-auto mb-2">
                #{index + 1}
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">{product.name}</h4>
              <p className="text-lg font-bold text-gray-900">₱{(product.revenue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">{product.unitsSold} units</p>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+{product.growth}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSalesReport;