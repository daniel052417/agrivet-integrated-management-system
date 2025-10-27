import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Target, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SalesDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type TxRow = { 
    id: string; 
    total_amount: number; 
    transaction_date: string; 
    customer_id: string | null; 
    subtotal: number;
    tax_amount: number;
    payment_status: string;
    created_by_user_id: string;
    branch_id: string | null;
  };
  type ItemRow = { 
    product_id: string; 
    quantity: number; 
    unit_price: number; 
    total_price: number; 
    created_at: string; 
  };
  type ProductRow = { id: string; name: string };
  type CustomerRow = { id: string; registration_date?: string };
  type StaffRow = { id: string; first_name: string; last_name: string; department?: string };
  type BranchRow = { id: string; name: string; code: string };

  type MetricCard = { title: string; value: string; change: string; isPositive: boolean; period: string; icon: any; color: string };
  type Trend = { period: string; sales: number; orders: number; target: number };
  type TopProduct = { name: string; sales: string; units: number; growth: string };
  type Channel = { channel: string; percentage: number; value: string; color: string };
  type RecentTx = { 
    id: string; 
    customer: string; 
    amount: string; 
    time: string; 
    status?: string;
    staff?: string;
    branch?: string;
  };

  const [salesMetrics, setSalesMetrics] = useState<MetricCard[]>([]);
  const [salesTrends, setSalesTrends] = useState<Trend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByChannel, setSalesByChannel] = useState<Channel[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);

  function getPeriodRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date; segments: { start: Date; end: Date; label: string }[] } {
    const now = new Date();
    let start: Date; let end: Date; let segments: { start: Date; end: Date; label: string }[] = [];

    if (period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      segments = [
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), label: '6 days ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4), label: '5 days ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), label: '4 days ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), label: '3 days ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), label: '2 days ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), end: new Date(now.getFullYear(), now.getMonth(), now.getDate()), label: 'Yesterday' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), label: 'Today' }
      ];
      return { start, end, prevStart, prevEnd, segments };
    } else if (period === 'weekly') {
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday + 7);
      const prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 7);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
      segments = [
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 28), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 21), label: '4 weeks ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 21), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 14), label: '3 weeks ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 14), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 7), label: '2 weeks ago' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday - 7), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday), label: 'Last week' },
        { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday + 7), label: 'This week' }
      ];
      return { start, end, prevStart, prevEnd, segments };
    } else { // monthly
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      segments = [
        { start: new Date(now.getFullYear(), now.getMonth() - 4, 1), end: new Date(now.getFullYear(), now.getMonth() - 3, 1), label: '4 months ago' },
        { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: new Date(now.getFullYear(), now.getMonth() - 2, 1), label: '3 months ago' },
        { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: new Date(now.getFullYear(), now.getMonth() - 1, 1), label: '2 months ago' },
        { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1), label: 'Last month' },
        { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: 'This month' }
      ];
      return { start, end, prevStart, prevEnd, segments };
    }
  }

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end, prevStart, prevEnd, segments } = getPeriodRange(selectedPeriod);

      // Load transactions for current period
      const { data: transactions, error: txError } = await supabase
        .from('pos_transactions')
        .select(`
          id, total_amount, transaction_date, customer_id, subtotal, tax_amount, 
          payment_status, cashier_id, branch_id
        `)
        .gte('transaction_date', start.toISOString())
        .lt('transaction_date', end.toISOString())
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;

      // Load previous period transactions for comparison
      const { data: prevTransactions, error: prevTxError } = await supabase
        .from('pos_transactions')
        .select(`
          id, total_amount, transaction_date, customer_id, subtotal, tax_amount, 
          payment_status, cashier_id, branch_id
        `)
        .gte('transaction_date', prevStart.toISOString())
        .lt('transaction_date', prevEnd.toISOString());

      if (prevTxError) throw prevTxError;

      // Load transaction items for product analysis (using pos_transaction_items table)
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select('product_id, quantity, unit_price, line_total, created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      if (itemsError) throw itemsError;

      // Load products for names (using correct column name)
      const productIds = [...new Set(items?.map(item => item.product_id) || [])];
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Load customers for analysis
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, created_at')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      if (customersError) throw customersError;

      // Load staff for better transaction details
      const staffIds = [...new Set(transactions?.map(tx => tx.cashier_id) || [])];
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, department, email')
        .in('id', staffIds)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load branches for better transaction details
      const branchIds = [...new Set(transactions?.map(tx => tx.branch_id).filter(Boolean) || [])];
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, code')
        .in('id', branchIds)
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      // Calculate metrics
      const currentSales = transactions?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0;
      const prevSales = prevTransactions?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0;
      const salesChange = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;

      const currentOrders = transactions?.length || 0;
      const prevOrders = prevTransactions?.length || 0;
      const ordersChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;

      const currentCustomers = customers?.length || 0;
      const prevCustomers = 0; // This would need to be calculated from previous period
      const customersChange = 0; // This would need to be calculated

      const avgOrderValue = currentOrders > 0 ? currentSales / currentOrders : 0;
      const prevAvgOrderValue = prevOrders > 0 ? prevSales / prevOrders : 0;
      const aovChange = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;

      // Set metrics
      setSalesMetrics([
        {
          title: 'Total Sales',
          value: `₱${currentSales.toLocaleString()}`,
          change: `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}%`,
          isPositive: salesChange >= 0,
          period: selectedPeriod,
          icon: DollarSign,
          color: 'green'
        },
        {
          title: 'Total Orders',
          value: currentOrders.toString(),
          change: `${ordersChange >= 0 ? '+' : ''}${ordersChange.toFixed(1)}%`,
          isPositive: ordersChange >= 0,
          period: selectedPeriod,
          icon: ShoppingCart,
          color: 'blue'
        },
        {
          title: 'New Customers',
          value: currentCustomers.toString(),
          change: `${customersChange >= 0 ? '+' : ''}${customersChange.toFixed(1)}%`,
          isPositive: customersChange >= 0,
          period: selectedPeriod,
          icon: Users,
          color: 'purple'
        },
        {
          title: 'Avg Order Value',
          value: `₱${avgOrderValue.toLocaleString()}`,
          change: `${aovChange >= 0 ? '+' : ''}${aovChange.toFixed(1)}%`,
          isPositive: aovChange >= 0,
          period: selectedPeriod,
          icon: Target,
          color: 'orange'
        }
      ]);

      // Calculate trends for segments
      const trendData = segments.map(segment => {
        const segmentTxs = transactions?.filter(tx => 
          new Date(tx.transaction_date) >= segment.start && 
          new Date(tx.transaction_date) < segment.end
        ) || [];
        const segmentSales = segmentTxs.reduce((sum, tx) => sum + (tx.total_amount || 0), 0);
        const segmentOrders = segmentTxs.length;
        const segmentTarget = segmentSales * 1.1; // 10% growth target

        return {
          period: segment.label,
          sales: segmentSales,
          orders: segmentOrders,
          target: segmentTarget
        };
      });

      setSalesTrends(trendData);

      // Calculate top products
      const productSales = new Map<string, { name: string; sales: number; units: number }>();
      items?.forEach(item => {
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          const current = productSales.get(item.product_id) || { name: product.name, sales: 0, units: 0 };
          current.sales += item.line_total || (item.unit_price * item.quantity);
          current.units += item.quantity;
          productSales.set(item.product_id, current);
        }
      });

      const topProductsData = Array.from(productSales.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(product => ({
          name: product.name,
          sales: `₱${product.sales.toLocaleString()}`,
          units: product.units,
          growth: '+12.5%' // This would need to be calculated
        }));

      setTopProducts(topProductsData);

      // Calculate sales by channel (mock data for now)
      setSalesByChannel([
        { channel: 'In-Store', percentage: 65, value: `₱${(currentSales * 0.65).toLocaleString()}`, color: 'bg-blue-500' },
        { channel: 'Online', percentage: 25, value: `₱${(currentSales * 0.25).toLocaleString()}`, color: 'bg-green-500' },
        { channel: 'Phone', percentage: 10, value: `₱${(currentSales * 0.10).toLocaleString()}`, color: 'bg-purple-500' }
      ]);

      // Recent transactions with better details
      const recentTxs = transactions?.slice(0, 5).map(tx => {
        const staffMember = staff?.find(s => s.id === tx.cashier_id);
        const branch = branches?.find(b => b.id === tx.branch_id);
        const customer = customers?.find(c => c.id === tx.customer_id);
        
        return {
          id: tx.id,
          customer: customer ? `Customer ${tx.customer_id}` : 'Walk-in Customer',
          amount: `₱${tx.total_amount.toLocaleString()}`,
          time: new Date(tx.transaction_date).toLocaleTimeString(),
          status: tx.payment_status === 'completed' ? 'Completed' : tx.payment_status,
          staff: staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown',
          branch: branch?.name || 'Unknown Branch'
        };
      }) || [];

      setRecentTransactions(recentTxs);

    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sales Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadSalesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sales-dashboard">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
          <p className="text-gray-600">Comprehensive sales performance and analytics</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['daily', 'weekly', 'monthly'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {salesMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  metric.color === 'green' ? 'bg-green-100' :
                  metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <metric.icon className={`w-6 h-6 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-sm font-semibold ${
                    metric.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
            <div className="h-64 flex items-end space-x-2">
              {salesTrends.map((trend, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: `${(trend.sales / Math.max(...salesTrends.map(t => t.sales))) * 200}px` }}>
                    <div className="w-full bg-blue-500 rounded-t"></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    <div className="font-medium">{trend.period}</div>
                    <div>₱{trend.sales.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales by Channel */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Channel</h3>
            <div className="space-y-4">
              {salesByChannel.map((channel, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${channel.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{channel.value}</div>
                    <div className="text-xs text-gray-500">{channel.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.units} units sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{product.sales}</div>
                    <div className="text-sm text-green-600">{product.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{tx.customer}</div>
                    <div className="text-sm text-gray-500">{tx.time}</div>
                    <div className="text-xs text-gray-400">
                      {tx.staff} • {tx.branch}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{tx.amount}</div>
                    <div className={`text-sm ${
                      tx.status === 'Completed' ? 'text-green-600' : 
                      tx.status === 'pending' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default SalesDashboard;

