import React, { useState, useMemo } from 'react';
import { TrendingUp, Filter, Calendar, MapPin, CreditCard, Package, RefreshCw } from 'lucide-react';
import { useFinanceDashboardSalesIncomeData } from '../../hooks/useFinanceDashboardSalesIncomeData';
import { simplifiedAuth, SYSTEM_ROLES } from '../../lib/simplifiedAuth';

type Period = 'today' | 'week' | 'month';
type Branch = 'all' | 'main' | 'branch-a' | 'branch-b';
type Category = 'all' | 'feeds' | 'care' | 'medicine' | 'accessories';

const SalesIncomeSummary: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [selectedBranch, setSelectedBranch] = useState<Branch>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  // Data fetching with RBAC filtering - uses hook
  const {
    salesData,
    paymentMethods,
    branchData,
    categoryData,
    recentSales,
    loading,
    error,
    refreshData
  } = useFinanceDashboardSalesIncomeData();

  // Check if user is Super Admin
  const isSuperAdmin = useMemo(() => {
    const user = simplifiedAuth.getCurrentUser();
    return user?.role_name === SYSTEM_ROLES.SUPER_ADMIN;
  }, []);

  const currentData = salesData[selectedPeriod];

  // Filter category data based on selected category (client-side filtering)
  const filteredCategoryData = useMemo(() => {
    if (selectedCategory === 'all') {
      return categoryData;
    }
    // Map UI category names to actual category names
    const categoryMap: Record<string, string> = {
      'feeds': 'Pet Feeds',
      'care': 'Pet Care Products',
      'medicine': 'Veterinary Medicine',
      'accessories': 'Accessories'
    };
    const targetCategory = categoryMap[selectedCategory];
    return categoryData.filter(cat => 
      cat.category.toLowerCase().includes(targetCategory?.toLowerCase() || '')
    );
  }, [categoryData, selectedCategory]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as Period);
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(event.target.value as Branch);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value as Category);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Loading sales data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-800">{error}</span>
              <button 
                onClick={refreshData}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Sales Income Summary
              </h1>
              <p className="text-gray-600 mt-2">Track all money earned from sales and POS transactions</p>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
            
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Branch:</label>
                <select 
                  value={selectedBranch} 
                  onChange={handleBranchChange}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Branches</option>
                  {branchData.map((branch, index) => (
                    <option key={index} value={branch.branch.toLowerCase().replace(/\s+/g, '-')}>
                      {branch.branch}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <p className="text-3xl font-bold text-gray-900">
                  ₱{currentData.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
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
                <p className="text-3xl font-bold text-gray-900">
                  ₱{Math.round(currentData.averageTicket).toLocaleString('en-US')}
                </p>
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
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payment data available</div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${payment.color}`}></div>
                      <span className="font-medium text-gray-700">{payment.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₱{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500">{payment.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Branch Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Branch Performance</h2>
            {branchData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No branch data available</div>
            ) : (
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
                        <span className="font-medium text-gray-900 ml-1">
                          ₱{branch.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-medium text-gray-900 ml-1">{branch.transactions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Categories & Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales by Category</h2>
            {filteredCategoryData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No category data available</div>
            ) : (
              <div className="space-y-4">
                {filteredCategoryData.map((category, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{category.category}</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ₱{category.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
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
            )}
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Sales</h2>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent sales available</div>
            ) : (
              <>
                <div className="space-y-3">
                  {recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{sale.id}</div>
                        <div className="text-sm text-gray-500">{sale.time} • {sale.branch}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ₱{sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-gray-500">{sale.method} • {sale.items} items</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View All Sales
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesIncomeSummary;