import React, { useState } from 'react';
import { Activity, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CashFlowData {
  currentBalance: number;
  netCashFlow: number;
  totalInflow: number;
  totalOutflow: number;
  workingCapital: number;
}

interface DailyCashFlow {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface MonthlyCashFlow {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface CashFlowCategory {
  category: string;
  amount: number;
  percentage: number;
  trend: string;
  positive: boolean;
}

interface CashFlowCategories {
  inflow: CashFlowCategory[];
  outflow: CashFlowCategory[];
}

interface RecentTransaction {
  id: number;
  type: 'inflow' | 'outflow';
  description: string;
  amount: number;
  time: string;
  category: string;
}

type Period = 'week' | 'month' | 'quarter' | 'year';
type ViewType = 'chart' | 'table';

const CashFlowOverview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [viewType, setViewType] = useState<ViewType>('chart');

  // Mock data for cash flow
  const cashFlowData: CashFlowData = {
    currentBalance: 125430,
    netCashFlow: 27110,
    totalInflow: 1245680,
    totalOutflow: 1218570,
    workingCapital: 198750
  };

  const dailyCashFlow: DailyCashFlow[] = [
    { date: '2024-10-25', inflow: 38500, outflow: 15200, net: 23300 },
    { date: '2024-10-26', inflow: 42100, outflow: 28900, net: 13200 },
    { date: '2024-10-27', inflow: 35800, outflow: 19500, net: 16300 },
    { date: '2024-10-28', inflow: 47200, outflow: 22100, net: 25100 },
    { date: '2024-10-29', inflow: 39600, outflow: 31800, net: 7800 },
    { date: '2024-10-30', inflow: 44300, outflow: 18700, net: 25600 },
    { date: '2024-10-31', inflow: 45750, outflow: 18320, net: 27430 }
  ];

  const monthlyCashFlow: MonthlyCashFlow[] = [
    { month: 'Jun', inflow: 520000, outflow: 385000, net: 135000 },
    { month: 'Jul', inflow: 485000, outflow: 402000, net: 83000 },
    { month: 'Aug', inflow: 625000, outflow: 445000, net: 180000 },
    { month: 'Sep', inflow: 590000, outflow: 428000, net: 162000 },
    { month: 'Oct', inflow: 678000, outflow: 456000, net: 222000 },
    { month: 'Nov', inflow: 712000, outflow: 489000, net: 223000 }
  ];

  const cashFlowCategories: CashFlowCategories = {
    inflow: [
      { category: 'Retail Sales', amount: 456780, percentage: 36.7, trend: '+8.2%', positive: true },
      { category: 'Wholesale Sales', amount: 342900, percentage: 27.5, trend: '+12.5%', positive: true },
      { category: 'Online Sales', amount: 289650, percentage: 23.3, trend: '+18.7%', positive: true },
      { category: 'Service Revenue', amount: 156350, percentage: 12.5, trend: '+5.4%', positive: true }
    ],
    outflow: [
      { category: 'Supplier Payments', amount: 485200, percentage: 39.8, trend: '+2.1%', positive: false },
      { category: 'Operating Expenses', amount: 312450, percentage: 25.6, trend: '-1.5%', positive: true },
      { category: 'Payroll & Benefits', amount: 256890, percentage: 21.1, trend: '+3.2%', positive: false },
      { category: 'Utilities & Rent', amount: 164030, percentage: 13.5, trend: '+0.8%', positive: false }
    ]
  };

  const recentTransactions: RecentTransaction[] = [
    { 
      id: 1, 
      type: 'inflow', 
      description: 'Retail sales - Main Store', 
      amount: 18500, 
      time: '2 hours ago',
      category: 'Sales'
    },
    { 
      id: 2, 
      type: 'outflow', 
      description: 'Supplier payment - ABC Distributors', 
      amount: 15500, 
      time: '3 hours ago',
      category: 'Supplier'
    },
    { 
      id: 3, 
      type: 'inflow', 
      description: 'Online order payments', 
      amount: 8750, 
      time: '4 hours ago',
      category: 'Sales'
    },
    { 
      id: 4, 
      type: 'outflow', 
      description: 'Electricity bill payment', 
      amount: 2800, 
      time: '5 hours ago',
      category: 'Utilities'
    },
    { 
      id: 5, 
      type: 'inflow', 
      description: 'Wholesale payment received', 
      amount: 12400, 
      time: '6 hours ago',
      category: 'Sales'
    }
  ];

  const maxValue = Math.max(...dailyCashFlow.map(d => Math.max(d.inflow, d.outflow)));

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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Cash Flow Overview
          </h1>
          <p className="text-gray-600 mt-2">Monitor how money moves in and out of your business</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Daily Cash Flow Trend</h2>
            
            {viewType === 'chart' ? (
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
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
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
          </div>

          {/* Cash Outflow Categories */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
              Cash Outflow Categories
            </h3>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowOverview;