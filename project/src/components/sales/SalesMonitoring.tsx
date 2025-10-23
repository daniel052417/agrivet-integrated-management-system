import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Store,
  ShoppingCart,
  DollarSign,
  Activity,
  AlertTriangle,
  Package,
  Award,
  Calendar,
  RefreshCw,
  Filter,
  ChevronRight,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TimeRange = 'today' | 'week' | 'month';

interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface BranchPerformance {
  branch_id: string;
  branch_name: string;
  today_sales: number;
  orders: number;
  avg_order_value: number;
  growth_percentage: number;
  status: 'active' | 'moderate' | 'low';
}

interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_sales: number;
  quantity_sold: number;
  category_name: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  branch?: string;
  timestamp: string;
}
interface TransactionWithBranch {
  id: string;
  branch_id: string | null;
  total_amount: number;
  transaction_date: string;
  payment_status: string;
  status: string;
  transaction_type: string;
  transaction_source?: string;
  branches: {
    id: string;
    name: string;
  } | null;  // ✅ Single object, not array
}
const SalesMonitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for metrics
  const [totalSales, setTotalSales] = useState(0);
  const [activeBranches, setActiveBranches] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [inProgressOrders, setInProgressOrders] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  
  // State for branch performance
  const [branches, setBranches] = useState<BranchPerformance[]>([]);
  
  // State for product performance
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [topCategories, setTopCategories] = useState<{ category: string; sales: number }[]>([]);
  
  // State for alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // State for channel breakdown
  const [channelData, setChannelData] = useState({
    pos: 0,
    pwa: 0,
    delivery: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
  .from('pos_transactions')
  .select(`
    id,
    branch_id,
    total_amount,
    transaction_date,
    payment_status,
    status,
    transaction_type,
    transaction_source,
    branches:branch_id (
      id,
      name
    )
  `)
  .gte('transaction_date', startDate.toISOString())
  .eq('transaction_type', 'sale')
  .returns<TransactionWithBranch[]>();  // ✅ Add explicit return type

      if (txError) throw txError;

      // Calculate metrics
      const completedTx = transactions?.filter(tx => 
        tx.payment_status === 'completed' && tx.status === 'active'
      ) || [];

      const todayTx = completedTx.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        return txDate.toDateString() === now.toDateString();
      });

      // Total sales today
      const todaySales = todayTx.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
      setTotalSales(todaySales);

      // Total orders
      setTotalOrders(todayTx.length);

      // In progress orders
      const inProgress = transactions?.filter(tx => 
        tx.status !== 'completed' && tx.status !== 'cancelled'
      ).length || 0;
      setInProgressOrders(inProgress);

      // Active branches (branches with sales today)
      const branchesWithSales = new Set(todayTx.map(tx => tx.branch_id));
      setActiveBranches(branchesWithSales.size);

      // Monthly sales and growth
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const lastMonthStart = new Date(monthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      
      const thisMonthTx = completedTx.filter(tx => 
        new Date(tx.transaction_date) >= monthStart
      );
      
      const lastMonthTx = completedTx.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        return txDate >= lastMonthStart && txDate < monthStart;
      });

      const thisMonthTotal = thisMonthTx.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
      const lastMonthTotal = lastMonthTx.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
      
      setMonthlySales(thisMonthTotal);
      
      if (lastMonthTotal > 0) {
        const growth = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        setMonthlyGrowth(growth);
      }

      // Calculate branch performance
      const branchMap = new Map<string, BranchPerformance>();
      
      todayTx.forEach(tx => {
        if (!tx.branch_id) return;
        
        const branchName = tx.branches?.name || 'Unknown Branch';
        
        if (!branchMap.has(tx.branch_id)) {
          branchMap.set(tx.branch_id, {
            branch_id: tx.branch_id,
            branch_name: branchName,
            today_sales: 0,
            orders: 0,
            avg_order_value: 0,
            growth_percentage: 0,
            status: 'moderate'
          });
        }
        
        const branch = branchMap.get(tx.branch_id)!;
        branch.today_sales += tx.total_amount || 0;
        branch.orders += 1;
      });

      // Calculate avg order value and growth for each branch
      const branchList = Array.from(branchMap.values()).map(branch => {
        branch.avg_order_value = branch.orders > 0 ? branch.today_sales / branch.orders : 0;
        
        // Mock growth calculation (in real app, compare with previous period)
        branch.growth_percentage = Math.random() * 40 - 20;
        
        // Determine status
        const avgSales = todaySales / branchMap.size;
        if (branch.today_sales >= avgSales * 1.2) {
          branch.status = 'active';
        } else if (branch.today_sales >= avgSales * 0.8) {
          branch.status = 'moderate';
        } else {
          branch.status = 'low';
        }
        
        return branch;
      });

      setBranches(branchList.sort((a, b) => b.today_sales - a.today_sales));

      // Fetch product performance
      const { data: txItems, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          product_id,
          product_name,
          quantity,
          line_total,
          transaction_id,
          pos_transactions!inner (
            transaction_date,
            payment_status,
            status
          )
        `)
        .gte('pos_transactions.transaction_date', startDate.toISOString())
        .eq('pos_transactions.payment_status', 'completed')
        .eq('pos_transactions.status', 'active');

      if (!itemsError && txItems) {
        const productMap = new Map<string, ProductPerformance>();
        
        txItems.forEach(item => {
          if (!productMap.has(item.product_id)) {
            productMap.set(item.product_id, {
              product_id: item.product_id,
              product_name: item.product_name,
              total_sales: 0,
              quantity_sold: 0,
              category_name: 'Uncategorized'
            });
          }
          
          const product = productMap.get(item.product_id)!;
          product.total_sales += item.line_total || 0;
          product.quantity_sold += item.quantity || 0;
        });

        const topProds = Array.from(productMap.values())
          .sort((a, b) => b.total_sales - a.total_sales)
          .slice(0, 5);
        
        setTopProducts(topProds);
      }

      // Generate alerts
      const newAlerts: Alert[] = [];
      
      branchList.forEach(branch => {
        if (branch.status === 'low') {
          newAlerts.push({
            id: `alert-${branch.branch_id}`,
            type: 'warning',
            message: `${branch.branch_name} is performing below average (${((branch.today_sales / todaySales) * 100).toFixed(1)}% of total sales)`,
            branch: branch.branch_name,
            timestamp: new Date().toISOString()
          });
        }
        
        if (branch.growth_percentage < -15) {
          newAlerts.push({
            id: `growth-${branch.branch_id}`,
            type: 'danger',
            message: `${branch.branch_name} sales dropped ${Math.abs(branch.growth_percentage).toFixed(1)}% vs. previous period`,
            branch: branch.branch_name,
            timestamp: new Date().toISOString()
          });
        }
      });

      setAlerts(newAlerts);

      // Mock channel data (in real app, query by transaction source)
      setChannelData({
        pos: todaySales * 0.65,
        pwa: todaySales * 0.25,
        delivery: todaySales * 0.10
      });

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">Multi-branch performance tracking and comparison</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section 1: Real-Time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className={`text-sm font-medium ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Sales Today</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-gray-500 mt-2">Across all branches</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Branches</h3>
          <p className="text-2xl font-bold text-gray-900">{activeBranches}</p>
          <p className="text-xs text-gray-500 mt-2">Processing transactions</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-2">{inProgressOrders} in progress</p>
        </div>
      </div>

      {/* Section 2: Branch Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Branch Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Compare how each branch is performing</p>
            </div>
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today's Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branches.map((branch, index) => (
                <tr key={branch.branch_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <Award className="w-5 h-5 text-yellow-500 mr-2" />}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{branch.branch_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(branch.today_sales)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{branch.orders}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{formatCurrency(branch.avg_order_value)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {branch.growth_percentage >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${branch.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {branch.growth_percentage >= 0 ? '+' : ''}{branch.growth_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(branch.status)}`}>
                      {branch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {branches.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No branch data available for the selected period</p>
          </div>
        )}
      </div>

      {/* Section 3: Product Performance & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            <p className="text-sm text-gray-600 mt-1">Best sellers across all branches</p>
          </div>
          <div className="p-6 space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-xs text-gray-500">{product.quantity_sold} units sold</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(product.total_sales)}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>No product data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sales by Channel</h2>
            <p className="text-sm text-gray-600 mt-1">Where sales are coming from</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">POS (Walk-in)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(channelData.pos)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${(channelData.pos / totalSales) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((channelData.pos / totalSales) * 100).toFixed(1)}% of total</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">PWA (Online)</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(channelData.pwa)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all" 
                    style={{ width: `${(channelData.pwa / totalSales) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((channelData.pwa / totalSales) * 100).toFixed(1)}% of total</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Delivery</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(channelData.delivery)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all" 
                    style={{ width: `${(channelData.delivery / totalSales) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((channelData.delivery / totalSales) * 100).toFixed(1)}% of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Alerts & Notifications */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Items that need attention</p>
          </div>
          <div className="p-6 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border flex items-start space-x-3 ${getAlertColor(alert.type)}`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.branch && (
                    <p className="text-xs mt-1 opacity-75">Branch: {alert.branch}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesMonitoring;