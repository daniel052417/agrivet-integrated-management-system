import React, { useMemo } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Activity, Receipt, RefreshCw } from 'lucide-react';
import { useFinanceDashboardData } from '../../hooks/useFinanceDashboardData';

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
  // Data fetching with RBAC filtering - uses hook
  const {
    todayStats,
    monthlyData,
    previousPeriodStats,
    loading,
    error,
    refreshData
  } = useFinanceDashboardData();

  // Calculate trends based on actual data
  const salesTrend = useMemo(() => {
    if (previousPeriodStats.yesterdaySales === 0) return { value: '0%', up: true };
    const change = ((todayStats.totalSales - previousPeriodStats.yesterdaySales) / previousPeriodStats.yesterdaySales) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      up: change >= 0
    };
  }, [todayStats.totalSales, previousPeriodStats.yesterdaySales]);

  const expensesTrend = useMemo(() => {
    if (previousPeriodStats.yesterdayExpenses === 0) return { value: '0%', up: false };
    const change = ((todayStats.totalExpenses - previousPeriodStats.yesterdayExpenses) / previousPeriodStats.yesterdayExpenses) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      up: change < 0 // Expenses going down is good
    };
  }, [todayStats.totalExpenses, previousPeriodStats.yesterdayExpenses]);

  const profitTrend = useMemo(() => {
    const yesterdayProfit = previousPeriodStats.yesterdaySales - previousPeriodStats.yesterdayExpenses;
    if (yesterdayProfit === 0) return { value: '0%', up: true };
    const change = ((todayStats.profit - yesterdayProfit) / Math.abs(yesterdayProfit)) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      up: change >= 0
    };
  }, [todayStats.profit, previousPeriodStats.yesterdaySales, previousPeriodStats.yesterdayExpenses]);

  // Calculate profit margin and expense ratio
  const profitMargin = useMemo(() => {
    if (todayStats.totalSales === 0) return 0;
    return (todayStats.profit / todayStats.totalSales) * 100;
  }, [todayStats.totalSales, todayStats.profit]);

  const expenseRatio = useMemo(() => {
    if (todayStats.totalSales === 0) return 0;
    return (todayStats.totalExpenses / todayStats.totalSales) * 100;
  }, [todayStats.totalSales, todayStats.totalExpenses]);

  // Calculate max value for chart scaling
  const maxChartValue = useMemo(() => {
    if (monthlyData.length === 0) return 600000;
    return Math.max(
      ...monthlyData.map(d => Math.max(d.sales, d.expenses)),
      600000
    );
  }, [monthlyData]);

  const quickMetrics: QuickMetric[] = useMemo(() => [
    {
      title: "Today's Sales",
      value: `₱${todayStats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: salesTrend.value,
      trendUp: salesTrend.up
    },
    {
      title: "Today's Expenses",
      value: `₱${todayStats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Receipt,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: expensesTrend.value,
      trendUp: expensesTrend.up
    },
    {
      title: "Cash Balance",
      value: `₱${todayStats.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "—", // Cash balance trend not calculated in this dashboard
      trendUp: true
    },
    {
      title: "Net Profit (Today)",
      value: `₱${todayStats.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: profitTrend.value,
      trendUp: profitTrend.up
    }
  ], [todayStats, salesTrend, expensesTrend, profitTrend]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg text-gray-600">Loading dashboard data...</span>
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
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Finance Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Real-time overview of your business financial health</p>
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
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No monthly data available</p>
                </div>
              ) : (
                <>
                  {/* Simple bar chart visualization */}
                  <div className="flex items-end justify-between h-full gap-2">
                    {monthlyData.map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="flex items-end gap-1 mb-2 w-full">
                          {/* Sales bar */}
                          <div 
                            className="bg-blue-500 rounded-t w-full relative"
                            style={{ height: `${(data.sales / maxChartValue) * 200}px` }}
                            title={`Sales: ₱${data.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          />
                          {/* Expenses bar */}
                          <div 
                            className="bg-red-400 rounded-t w-full relative"
                            style={{ height: `${(data.expenses / maxChartValue) * 200}px` }}
                            title={`Expenses: ₱${data.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                </>
              )}
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
                {salesTrend.up && salesTrend.value !== '0%' && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Strong Sales Day</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Today's sales are {salesTrend.value} vs yesterday</p>
                  </div>
                )}
                {!salesTrend.up && salesTrend.value !== '0%' && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Sales Alert</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">Today's sales are {salesTrend.value} vs yesterday</p>
                  </div>
                )}
                {expenseRatio > 50 && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Expense Review</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">Expenses are {expenseRatio.toFixed(1)}% of sales - consider reviewing</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Ratios */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Ratios</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Profit Margin</span>
                    <span className="text-sm font-medium text-gray-900">{profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(profitMargin, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Expense Ratio</span>
                    <span className="text-sm font-medium text-gray-900">{expenseRatio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                    ></div>
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