import React from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Activity, Receipt } from 'lucide-react';

interface TodayStats {
  totalSales: number;
  totalExpenses: number;
  cashBalance: number;
  profit: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  expenses: number;
}

interface QuickMetric {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend: string;
  trendUp: boolean;
}

const FinanceDashboard: React.FC = () => {
  // Mock data for visualization
  const todayStats: TodayStats = {
    totalSales: 45750,
    totalExpenses: 18320,
    cashBalance: 125430,
    profit: 27430
  };

  const monthlyData: MonthlyData[] = [
    { month: 'Jan', sales: 320000, expenses: 145000 },
    { month: 'Feb', sales: 285000, expenses: 138000 },
    { month: 'Mar', sales: 410000, expenses: 162000 },
    { month: 'Apr', sales: 375000, expenses: 155000 },
    { month: 'May', sales: 445000, expenses: 168000 },
    { month: 'Jun', sales: 520000, expenses: 185000 }
  ];

  const quickMetrics: QuickMetric[] = [
    {
      title: "Today's Sales",
      value: `₱${todayStats.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Today's Expenses",
      value: `₱${todayStats.totalExpenses.toLocaleString()}`,
      icon: Receipt,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: "-8.2%",
      trendUp: false
    },
    {
      title: "Cash Balance",
      value: `₱${todayStats.cashBalance.toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+5.1%",
      trendUp: true
    },
    {
      title: "Net Profit (Today)",
      value: `₱${todayStats.profit.toLocaleString()}`,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+15.3%",
      trendUp: true
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Finance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Real-time overview of your business financial health</p>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${metric.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.trendUp ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{metric.trend}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales vs Expenses Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Sales vs Expenses</h2>
            <div className="h-80">
              {/* Simple bar chart visualization */}
              <div className="flex items-end justify-between h-full gap-2">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex items-end gap-1 mb-2 w-full">
                      {/* Sales bar */}
                      <div 
                        className="bg-blue-500 rounded-t w-full relative"
                        style={{ height: `${(data.sales / 600000) * 200}px` }}
                        title={`Sales: ₱${data.sales.toLocaleString()}`}
                      />
                      {/* Expenses bar */}
                      <div 
                        className="bg-red-400 rounded-t w-full relative"
                        style={{ height: `${(data.expenses / 600000) * 200}px` }}
                        title={`Expenses: ₱${data.expenses.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{data.month}</span>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Record Expense</div>
                  <div className="text-sm text-gray-500">Add new business expense</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">View Cash Flow</div>
                  <div className="text-sm text-gray-500">Check detailed cash flow</div>
                </button>
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Generate Report</div>
                  <div className="text-sm text-gray-500">Create financial summary</div>
                </button>
              </div>
            </div>

            {/* Financial Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Strong Sales Day</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Today's sales are 12.5% above average</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Expense Review</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">Consider reviewing utility expenses this month</p>
                </div>
              </div>
            </div>

            {/* Key Ratios */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Ratios</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className="text-sm font-medium text-gray-900">59.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '59.9%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Expense Ratio</span>
                    <span className="text-sm font-medium text-gray-900">40.1%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40.1%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;