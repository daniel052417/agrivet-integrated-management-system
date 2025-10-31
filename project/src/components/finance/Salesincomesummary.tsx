import React, { useState } from 'react';
import { TrendingUp, Filter, Calendar, MapPin, CreditCard, Package } from 'lucide-react';

interface SalesData {
  total: number;
  transactions: number;
  averageTicket: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

interface BranchData {
  branch: string;
  sales: number;
  transactions: number;
  growth: string;
  positive: boolean;
}

interface CategoryData {
  category: string;
  sales: number;
  percentage: number;
  color: string;
}

interface RecentSale {
  id: string;
  time: string;
  amount: number;
  method: string;
  branch: string;
  items: number;
}

type Period = 'today' | 'week' | 'month';
type Branch = 'all' | 'main' | 'branch-a' | 'branch-b';
type Category = 'all' | 'feeds' | 'care' | 'medicine' | 'accessories';

const SalesIncomeSummary: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [selectedBranch, setSelectedBranch] = useState<Branch>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Mock data
  const salesData: Record<Period, SalesData> = {
    today: {
      total: 45750,
      transactions: 127,
      averageTicket: 360
    },
    week: {
      total: 285430,
      transactions: 842,
      averageTicket: 339
    },
    month: {
      total: 1245680,
      transactions: 3567,
      averageTicket: 349
    }
  };

  const paymentMethods: PaymentMethod[] = [
    { method: 'Cash', amount: 18500, percentage: 40.4, color: 'bg-green-500' },
    { method: 'Credit Card', amount: 12250, percentage: 26.8, color: 'bg-blue-500' },
    { method: 'GCash', amount: 8750, percentage: 19.1, color: 'bg-purple-500' },
    { method: 'Bank Transfer', amount: 4250, percentage: 9.3, color: 'bg-orange-500' },
    { method: 'Other', amount: 2000, percentage: 4.4, color: 'bg-gray-500' }
  ];

  const branchData: BranchData[] = [
    { branch: 'Main Store', sales: 22500, transactions: 65, growth: '+8.5%', positive: true },
    { branch: 'Branch A', sales: 13750, transactions: 38, growth: '+12.3%', positive: true },
    { branch: 'Branch B', sales: 9500, transactions: 24, growth: '-2.1%', positive: false }
  ];

  const categoryData: CategoryData[] = [
    { category: 'Pet Feeds', sales: 18200, percentage: 39.8, color: 'bg-amber-500' },
    { category: 'Pet Care Products', sales: 12800, percentage: 28.0, color: 'bg-emerald-500' },
    { category: 'Veterinary Medicine', sales: 8950, percentage: 19.6, color: 'bg-red-500' },
    { category: 'Accessories', sales: 4200, percentage: 9.2, color: 'bg-indigo-500' },
    { category: 'Others', sales: 1600, percentage: 3.5, color: 'bg-gray-500' }
  ];

  const recentSales: RecentSale[] = [
    { id: '#INV-001', time: '10:30 AM', amount: 1250, method: 'GCash', branch: 'Main Store', items: 3 },
    { id: '#INV-002', time: '10:15 AM', amount: 850, method: 'Cash', branch: 'Branch A', items: 2 },
    { id: '#INV-003', time: '09:45 AM', amount: 2100, method: 'Credit Card', branch: 'Main Store', items: 5 },
    { id: '#INV-004', time: '09:30 AM', amount: 650, method: 'Cash', branch: 'Branch B', items: 1 },
    { id: '#INV-005', time: '09:15 AM', amount: 1800, method: 'Bank Transfer', branch: 'Main Store', items: 4 }
  ];

  const currentData = salesData[selectedPeriod];

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as Period);
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(event.target.value as Branch);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value as Category);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            Sales Income Summary
          </h1>
          <p className="text-gray-600 mt-2">Track all money earned from sales and POS transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select 
                value={selectedPeriod} 
                onChange={handlePeriodChange}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Branch:</label>
              <select 
                value={selectedBranch} 
                onChange={handleBranchChange}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Branches</option>
                <option value="main">Main Store</option>
                <option value="branch-a">Branch A</option>
                <option value="branch-b">Branch B</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select 
                value={selectedCategory} 
                onChange={handleCategoryChange}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="feeds">Pet Feeds</option>
                <option value="care">Pet Care</option>
                <option value="medicine">Vet Medicine</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">₱{currentData.total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{currentData.transactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Filter className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Ticket</p>
                <p className="text-3xl font-bold text-gray-900">₱{currentData.averageTicket}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
            <div className="space-y-4">
              {paymentMethods.map((payment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${payment.color}`}></div>
                    <span className="font-medium text-gray-700">{payment.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₱{payment.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{payment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Branch Performance</h2>
            <div className="space-y-4">
              {branchData.map((branch, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{branch.branch}</h3>
                    <span className={`text-sm font-medium ${branch.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {branch.growth}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Sales:</span>
                      <span className="font-medium text-gray-900 ml-1">₱{branch.sales.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium text-gray-900 ml-1">{branch.transactions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Categories & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales by Category</h2>
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">{category.category}</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₱{category.sales.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{category.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`} 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Sales</h2>
            <div className="space-y-3">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{sale.id}</div>
                    <div className="text-sm text-gray-500">{sale.time} • {sale.branch}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₱{sale.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{sale.method} • {sale.items} items</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              View All Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesIncomeSummary;