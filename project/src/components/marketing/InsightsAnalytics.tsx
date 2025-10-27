import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Eye,
  Target,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building2,
  UserCheck,
  Star,
  Activity
} from 'lucide-react';
import { InsightsService } from '../../lib/insightsService';
import { SalesInsightsIntegration } from '../../lib/salesInsightsIntegration';
import { RealTimeInsightsService } from '../../lib/realTimeInsightsService';

// Mock data for insights and analytics
const mockInsightsData = {
  overview: {
    activePromotions: 12,
    totalEngagedCustomers: 1247,
    topProduct: 'Ammonium Sulfate 21-0-0',
    totalSales: 125000,
    growthRate: 15.3,
    conversionRate: 8.7
  },
  monthlySalesTrend: [
    { month: 'Jan', sales: 45000, orders: 234, customers: 189 },
    { month: 'Feb', sales: 52000, orders: 267, customers: 201 },
    { month: 'Mar', sales: 48000, orders: 245, customers: 198 },
    { month: 'Apr', sales: 61000, orders: 312, customers: 256 },
    { month: 'May', sales: 58000, orders: 298, customers: 241 },
    { month: 'Jun', sales: 67000, orders: 345, customers: 278 },
    { month: 'Jul', sales: 72000, orders: 378, customers: 302 },
    { month: 'Aug', sales: 69000, orders: 356, customers: 289 },
    { month: 'Sep', sales: 75000, orders: 389, customers: 315 },
    { month: 'Oct', sales: 82000, orders: 425, customers: 342 },
    { month: 'Nov', sales: 78000, orders: 401, customers: 328 },
    { month: 'Dec', sales: 89000, orders: 456, customers: 367 }
  ],
  topProducts: [
    { name: 'Ammonium Sulfate 21-0-0', sales: 25000, units: 1250, growth: 12.5 },
    { name: 'Calcium Nitrate 15-5-0', sales: 18000, units: 900, growth: 8.3 },
    { name: 'Premium Seeds Mix', sales: 15000, units: 750, growth: 15.7 },
    { name: 'Garden Spade Set', sales: 12000, units: 600, growth: 5.2 },
    { name: 'Organic Fertilizer', sales: 10000, units: 500, growth: 22.1 }
  ],
  loyalBuyers: [
    { name: 'Juan Dela Cruz', purchases: 15, totalSpent: 25000, lastPurchase: '2025-01-20', tier: 'Gold' },
    { name: 'Maria Santos', purchases: 12, totalSpent: 18000, lastPurchase: '2025-01-18', tier: 'Silver' },
    { name: 'Pedro Garcia', purchases: 10, totalSpent: 15000, lastPurchase: '2025-01-15', tier: 'Silver' },
    { name: 'Ana Rodriguez', purchases: 8, totalSpent: 12000, lastPurchase: '2025-01-12', tier: 'Bronze' },
    { name: 'Carlos Lopez', purchases: 7, totalSpent: 10500, lastPurchase: '2025-01-10', tier: 'Bronze' }
  ],
  branchPerformance: [
    { name: 'Poblacion Branch', sales: 45000, orders: 234, customers: 189, growth: 18.5 },
    { name: 'Downtown Branch', sales: 38000, orders: 198, customers: 156, growth: 12.3 },
    { name: 'Mall Branch', sales: 32000, orders: 167, customers: 134, growth: 8.7 },
    { name: 'Highway Branch', sales: 28000, orders: 145, customers: 118, growth: 15.2 }
  ],
  promotionEffectiveness: [
    { name: 'Summer Sale 2025', views: 1250, uses: 89, conversion: 7.1, revenue: 15000 },
    { name: 'New Year Special', views: 980, uses: 67, conversion: 6.8, revenue: 12000 },
    { name: 'Valentine\'s Promotion', views: 750, uses: 45, conversion: 6.0, revenue: 8500 },
    { name: 'Farmer\'s Choice', views: 1100, uses: 78, conversion: 7.1, revenue: 13500 }
  ],
  customerSegments: [
    { segment: 'Frequent Buyers', count: 234, percentage: 18.7, avgOrder: 2500 },
    { segment: 'Occasional Buyers', count: 456, percentage: 36.5, avgOrder: 1200 },
    { segment: 'New Customers', count: 312, percentage: 25.0, avgOrder: 800 },
    { segment: 'Loyal Customers', count: 245, percentage: 19.6, avgOrder: 3200 }
  ]
};

const InsightsAnalytics: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data state
  const [insightsData, setInsightsData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize real-time service
  const realTimeService = RealTimeInsightsService.getInstance();

  // Load insights data
  const loadInsightsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {
        branch_id: selectedBranch,
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      // Load insights data
      const [overview, monthlyTrend, topProducts, loyalBuyers, branchPerformance, promotionEffectiveness, customerSegments] = await Promise.all([
        InsightsService.getOverview(filters),
        InsightsService.getMonthlySalesTrend(filters),
        InsightsService.getTopProducts(filters),
        InsightsService.getLoyalBuyers(filters),
        InsightsService.getBranchPerformance(filters),
        InsightsService.getPromotionEffectiveness(filters),
        InsightsService.getCustomerSegments(filters)
      ]);

      setInsightsData({
        overview,
        monthlySalesTrend: monthlyTrend,
        topProducts,
        loyalBuyers,
        branchPerformance,
        promotionEffectiveness,
        customerSegments
      });

      // Load sales data
      const salesInsights = await SalesInsightsIntegration.getSalesInsightsData(filters);
      setSalesData(salesInsights);

    } catch (err) {
      console.error('Error loading insights data:', err);
      setError('Failed to load insights data. Using mock data instead.');
      // Fallback to mock data
      setInsightsData(mockInsightsData);
    } finally {
      setIsLoading(false);
    }
  };

  // Load real-time data
  const loadRealTimeData = async () => {
    try {
      const realTime = await realTimeService.getCurrentData();
      setRealTimeData(realTime);
      
      const alertsData = await realTimeService.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error loading real-time data:', err);
    }
  };

  // Initialize data loading
  useEffect(() => {
    loadInsightsData();
    loadRealTimeData();
    
    // Start real-time polling
    realTimeService.startPolling(30000); // 30 seconds
    
    // Subscribe to real-time updates
    const unsubscribe = realTimeService.subscribe((data) => {
      setRealTimeData(data);
    });
    
    // Subscribe to alerts
    const unsubscribeAlerts = realTimeService.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => {
      realTimeService.stopPolling();
      unsubscribe();
      unsubscribeAlerts();
    };
  }, [selectedBranch, selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsightsData();
    await loadRealTimeData();
    setRefreshing(false);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting insights report as ${format.toUpperCase()}`);
    // Implement export functionality
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      case 'Bronze': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  // Get data with fallback to mock data
  const getData = () => {
    return insightsData || mockInsightsData;
  };

  const getSalesData = () => {
    return salesData || {
      totalRevenue: 125000,
      totalOrders: 1247,
      totalCustomers: 892,
      averageOrderValue: 100.24
    };
  };

  const getRealTimeData = () => {
    return realTimeData || {
      todaySales: 12500,
      todayOrders: 45,
      todayCustomers: 32,
      activeUsers: 12
    };
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insights & Analytics</h2>
          <p className="text-gray-600">Data-driven insights for marketing performance and customer behavior</p>
          {error && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-lg text-gray-600">Loading insights data...</span>
          </div>
        </div>
      )}

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={alert.id || index} className={`p-3 rounded-lg border-l-4 ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(alert.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              <option value="poblacion">Poblacion Branch</option>
              <option value="downtown">Downtown Branch</option>
              <option value="mall">Mall Branch</option>
              <option value="highway">Highway Branch</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Promotions</p>
              <p className="text-2xl font-bold text-gray-900">{getData().overview.activePromotions}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">+2 from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engaged Customers</p>
              <p className="text-2xl font-bold text-gray-900">{getData().overview.totalEngagedCustomers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">+{getData().overview.growthRate}% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getData().overview.totalSales)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">+{getData().overview.growthRate}% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{getData().overview.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">+1.2% from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Trend</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Sales</span>
            </div>
          </div>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-1">
              {getData().monthlySalesTrend.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-emerald-500 rounded-t"
                    style={{ height: `${(data.sales / 90000) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                    {data.month}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(data.sales)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Products</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getData().topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.sales)}</p>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(product.growth)}
                    <span className={`text-xs ${getGrowthColor(product.growth)}`}>
                      +{product.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loyal Buyers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Loyal Buyers</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getData().loyalBuyers.map((buyer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{buyer.name}</p>
                    <p className="text-xs text-gray-500">{buyer.purchases} purchases</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(buyer.totalSpent)}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(buyer.tier)}`}>
                      {buyer.tier}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(buyer.lastPurchase)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getData().branchPerformance.map((branch, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                    <p className="text-xs text-gray-500">{branch.orders} orders • {branch.customers} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(branch.sales)}</p>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(branch.growth)}
                    <span className={`text-xs ${getGrowthColor(branch.growth)}`}>
                      +{branch.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promotion Effectiveness */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Promotion Effectiveness</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getData().promotionEffectiveness.map((promo, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{promo.name}</h4>
                  <span className="text-sm text-gray-500">{promo.conversion}% conversion</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="text-sm font-medium text-gray-900">{promo.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Uses</p>
                    <p className="text-sm font-medium text-gray-900">{promo.uses}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(promo.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getData().customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{segment.segment}</p>
                    <p className="text-xs text-gray-500">{segment.count} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{segment.percentage}%</p>
                  <p className="text-xs text-gray-500">Avg: {formatCurrency(segment.avgOrder)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsAnalytics;
