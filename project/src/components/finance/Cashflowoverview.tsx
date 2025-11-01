import React, { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useCashFlowData } from '../../hooks/useCashFlowData';

type Period = 'week' | 'month' | 'quarter' | 'year';
type ViewType = 'chart' | 'table';

const CashFlowOverview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [viewType, setViewType] = useState<ViewType>('chart');

  // Data fetching with RBAC filtering - uses hook
  const {
    cashFlowData,
    dailyCashFlow,
    cashFlowCategories,
    recentTransactions,
    loading,
    error,
    refreshData
  } = useCashFlowData();

  // Data fetching functions are now handled by useCashFlowData hook
  // Only keeping UI-specific logic here

  // Fetch data on mount and when period changes
  useEffect(() => {
    refreshData(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const maxValue = useMemo(() => {
    if (dailyCashFlow.length === 0) return 1;
    return Math.max(...dailyCashFlow.map(d => Math.max(d.inflow, d.outflow)), 1);
  }, [dailyCashFlow]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as Period);
  };

  const handleViewTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setViewType(event.target.value as ViewType);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-600" />
                Cash Flow Overview
              </h1>
              <p className="text-gray-600 mt-2">Monitor how money moves in and out of your business</p>
            </div>
            <button
              onClick={() => refreshData(selectedPeriod)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={handlePeriodChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <select 
              value={viewType} 
              onChange={handleViewTypeChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="chart">Chart View</option>
              <option value="table">Table View</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">₱{cashFlowData.currentBalance.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className="text-2xl font-bold text-green-600">₱{cashFlowData.netCashFlow.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inflow</p>
                <p className="text-2xl font-bold text-blue-600">₱{cashFlowData.totalInflow.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Outflow</p>
                <p className="text-2xl font-bold text-red-600">₱{cashFlowData.totalOutflow.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Working Capital</p>
                <p className="text-2xl font-bold text-purple-600">₱{cashFlowData.workingCapital.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {selectedPeriod === 'week' ? 'Daily' : selectedPeriod === 'month' ? 'Daily' : 'Monthly'} Cash Flow Trend
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : dailyCashFlow.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <p>No cash flow data available for the selected period</p>
              </div>
            ) : viewType === 'chart' ? (
              <div className="h-80">
                <div className="flex items-end justify-between h-full gap-2">
                  {dailyCashFlow.map((day, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className="flex flex-col items-center gap-1 mb-2 w-full">
                        {/* Net flow indicator */}
                        <div className="text-xs font-medium mb-1" style={{
                          color: day.net >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {day.net >= 0 ? '+' : ''}₱{day.net.toLocaleString()}
                        </div>
                        
                        {/* Inflow bar */}
                        <div 
                          className="bg-blue-500 rounded-t w-full relative"
                          style={{ height: `${(day.inflow / maxValue) * 150}px` }}
                          title={`Inflow: ₱${day.inflow.toLocaleString()}`}
                        />
                        
                        {/* Outflow bar */}
                        <div 
                          className="bg-red-400 rounded-b w-full relative"
                          style={{ height: `${(day.outflow / maxValue) * 150}px` }}
                          title={`Outflow: ₱${day.outflow.toLocaleString()}`}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {new Date(day.date).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">Cash Inflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span className="text-sm text-gray-600">Cash Outflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Net Positive</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {dailyCashFlow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No data available</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inflow</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outflow</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dailyCashFlow.map((day, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          ₱{day.inflow.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          ₱{day.outflow.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${
                          day.net >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {day.net >= 0 ? '+' : ''}₱{day.net.toLocaleString()}
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No recent transactions</div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'inflow' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'inflow' ? (
                        <ArrowUpRight className={`h-4 w-4 ${
                          transaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-xs text-gray-500">{transaction.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      transaction.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'inflow' ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.category}</div>
                  </div>
                </div>
                ))}
              </div>
            )}
            <button className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              View All Transactions
            </button>
          </div>
        </div>

        {/* Cash Flow Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Inflow Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              Cash Inflow Sources
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : cashFlowCategories.inflow.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No inflow data available</div>
            ) : (
              <div className="space-y-4">
                {cashFlowCategories.inflow.map((category, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{category.category}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">{category.trend}</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{category.percentage}% of total</span>
                    <span className="font-semibold text-gray-900">₱{category.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* Cash Outflow Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Cash Outflow Categories
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : cashFlowCategories.outflow.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No outflow data available</div>
            ) : (
              <div className="space-y-4">
                {cashFlowCategories.outflow.map((category, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{category.category}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${category.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {category.trend}
                      </span>
                      {category.positive ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{category.percentage}% of total</span>
                    <span className="font-semibold text-gray-900">₱{category.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowOverview;