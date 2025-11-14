import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Users, Clock, Package, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DailySalesSummary: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // dynamic metrics state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [customersServed, setCustomersServed] = useState<number>(0);
  const [avgOrder, setAvgOrder] = useState<number>(0);
  const [growthPct, setGrowthPct] = useState<number>(0);

  const [hourlyBreakdown, setHourlyBreakdown] = useState<{ hour: string; hour24: number; sales: number; orders: number; customers: number; percentOfDay: number; trend: 'up' | 'down' | 'flat'; diffAmount: number; }[]>([]);

  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const [topSellingToday, setTopSellingToday] = useState<{ product: string; quantity: number; revenue: string; percentage: number; }[]>([]);

  const [todaysTransactions, setTodaysTransactions] = useState<{ time: string; customer: string; items: string[]; total: number; payment: string; staff: string; }[]>([]);

  const [paymentMethods, setPaymentMethods] = useState<{ method: string; amount: string; percentage: number; color: string; }[]>([]);

  const maxHourlySales = useMemo(() => Math.max(0, ...hourlyBreakdown.map(h => h.sales)), [hourlyBreakdown]);
  const peak = useMemo(() => {
    const p = hourlyBreakdown.reduce((prev, cur) => (cur.sales > prev.sales ? cur : prev), { hour: '—', hour24: -1, sales: 0, orders: 0, customers: 0, percentOfDay: 0, trend: 'flat', diffAmount: 0 });
    return p;
  }, [hourlyBreakdown]);

  useEffect(() => {
    loadDailyData();
  }, [selectedDate, branchFilter]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        setBranches([{ id: 'all', name: 'All Branches' } as any, ...((data as any[]) || [])]);
      } catch (e) {
      }
    };
    loadBranches();
  }, []);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const prevStart = new Date(startOfDay);
      prevStart.setDate(prevStart.getDate() - 1);
      const prevEnd = new Date(endOfDay);
      prevEnd.setDate(prevEnd.getDate() - 1);

      const { data: transactions, error: transactionsError } = await supabase
        .from('pos_transactions')
        .select(`
          id, transaction_date, total_amount, customer_id, cashier_id, branch_id,
          subtotal, tax_amount, payment_status,
          customers:customer_id (first_name, last_name)
        `)
        .gte('transaction_date', startOfDay.toISOString())
        .lte('transaction_date', endOfDay.toISOString())
        .order('transaction_date', { ascending: true });

      let filteredTransactions = transactions || [];
      if (branchFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.branch_id === branchFilter);
      }

      const { data: prevTransactions, error: prevErr } = await supabase
        .from('pos_transactions')
        .select(`id, transaction_date, total_amount, branch_id`)
        .gte('transaction_date', prevStart.toISOString())
        .lte('transaction_date', prevEnd.toISOString())
        .order('transaction_date', { ascending: true });
      if (prevErr) throw prevErr;
      let filteredPrev = prevTransactions || [];
      if (branchFilter !== 'all') {
        filteredPrev = filteredPrev.filter(t => t.branch_id === branchFilter);
      }

      if (transactionsError) throw transactionsError;

      const userIds = [...new Set(filteredTransactions?.map((t: any) => t.cashier_id).filter(Boolean) || [])];
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select(`
          id, first_name, last_name, email
        `)
        .in('id', userIds)
        .eq('is_active', true);

      if (staffError) throw staffError;

      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          quantity, unit_price, line_total,
          product_name
        `)
        .in('transaction_id', filteredTransactions?.map((t: any) => t.id) || []);

      if (itemsError) throw itemsError;

      const sales = filteredTransactions?.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0) || 0;
      const orders = filteredTransactions?.length || 0;
      const customers = new Set(filteredTransactions?.map((t: any) => t.customer_id).filter(Boolean)).size;
      const avg = orders > 0 ? sales / orders : 0;

      setTotalSales(sales);
      setTotalOrders(orders);
      setCustomersServed(customers);
      setAvgOrder(avg);

      setGrowthPct(5.2);

      const operatingHours = Array.from({ length: 12 }, (_, idx) => 7 + idx);
      const hours = operatingHours;
      const hourlyData = hours.map((h) => ({
        hour: `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`,
        hour24: h,
        sales: 0,
        orders: 0,
        customers: 0,
        percentOfDay: 0,
        trend: 'flat' as 'up' | 'down' | 'flat',
        diffAmount: 0,
      }));

      filteredTransactions?.forEach((transaction: any) => {
        const hour = new Date(transaction.transaction_date).getHours();
        const idx = hours.indexOf(hour);
        if (idx !== -1) {
          hourlyData[idx].sales += transaction.total_amount || 0;
          hourlyData[idx].orders += 1;
          if (transaction.customer_id) hourlyData[idx].customers += 1;
        }
      });

      const prevMap = new Map<number, number>();
      filteredPrev?.forEach((t: any) => {
        const h = new Date(t.transaction_date).getHours();
        prevMap.set(h, (prevMap.get(h) || 0) + (t.total_amount || 0));
      });

      hourlyData.forEach((h) => {
        h.percentOfDay = sales > 0 ? (h.sales / sales) * 100 : 0;
        const prev = prevMap.get(h.hour24) || 0;
        const diff = h.sales - prev;
        h.diffAmount = diff;
        h.trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      });

      setHourlyBreakdown(hourlyData);

      const productSales = new Map<string, { quantity: number; revenue: number; name: string }>();
      
      items?.forEach(item => {
        const productName = item.product_name || 'Unknown Product';
        const existing = productSales.get(productName) || { quantity: 0, revenue: 0, name: productName };
        existing.quantity += item.quantity || 0;
        existing.revenue += item.line_total || 0;
        productSales.set(productName, existing);
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(product => ({
          product: product.name,
          quantity: product.quantity,
          revenue: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(product.revenue),
          percentage: sales > 0 ? (product.revenue / sales) * 100 : 0
        }));

      setTopSellingToday(topProducts);

      const formattedTransactions = filteredTransactions?.slice(0, 10).map((transaction: any) => {
        const staffMember = staff?.find(s => s.id === transaction.cashier_id);
        return {
          time: new Date(transaction.transaction_date).toLocaleTimeString(),
          customer: transaction.customers 
            ? `${(transaction.customers as any).first_name || ''} ${(transaction.customers as any).last_name || ''}`.trim()
            : 'Walk-in Customer',
          items: ['Multiple items'],
          total: transaction.total_amount || 0,
          payment: transaction.payment_status || 'Unknown',
          staff: staffMember
            ? `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()
            : 'Unknown'
        };
      }) || [];

      setTodaysTransactions(formattedTransactions);

      const paymentData = new Map<string, number>();
      transactions?.forEach(transaction => {
        const status = transaction.payment_status || 'Unknown';
        paymentData.set(status, (paymentData.get(status) || 0) + (transaction.total_amount || 0));
      });

      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
      const paymentStatusData = Array.from(paymentData.entries()).map(([status, amount], index) => ({
        method: status,
        amount: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount),
        percentage: sales > 0 ? (amount / sales) * 100 : 0,
        color: colors[index % colors.length]
      }));

      setPaymentMethods(paymentStatusData);

    } catch (err: any) {
      console.error('Error loading daily data:', err);
      setError(err.message || 'Failed to load daily data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const getBarColor = (percentOfDay: number, isPeak: boolean) => {
    if (isPeak) return 'bg-indigo-600';
    if (percentOfDay >= 25) return 'bg-green-600';
    if (percentOfDay >= 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Daily Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadDailyData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Sales Summary</h1>
          <p className="text-gray-600">Comprehensive daily sales analysis and insights</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Branch:</label>
              <select
                aria-label="Filter by branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 ml-1">+{growthPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                <p className="text-sm text-gray-500">Transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers Served</p>
                <p className="text-2xl font-bold text-gray-900">{customersServed}</p>
                <p className="text-sm text-gray-500">Unique customers</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(avgOrder)}</p>
                <p className="text-sm text-gray-500">Per transaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sales Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[28rem] overflow-y-auto pr-1">
            {hourlyBreakdown.map((h, index) => {
              const widthPct = maxHourlySales > 0 ? (h.sales / maxHourlySales) * 100 : 0;
              const isPeak = h.hour24 === peak.hour24 && peak.sales > 0;
              const color = getBarColor(h.percentOfDay, !!isPeak);
              return (
                <div key={index} className="text-left" aria-label={`Sales at ${h.hour}: ${formatCurrency(h.sales)}, ${h.orders} orders`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">{h.hour}</span>
                      {isPeak && (
                        <span className="inline-flex items-center text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 mr-1" /> Peak
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{h.percentOfDay.toFixed(1)}%</span>
                      {h.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-600" aria-label="Higher than previous day" />}
                      {h.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-600" aria-label="Lower than previous day" />}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1" title={`${formatCurrency(h.sales)} • ${h.orders} orders`}>
                    <div
                      className={`h-3 rounded-full ${color}`}
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatCurrency(h.sales)}</span>
                    <span>{h.orders} orders</span>
                  </div>
                </div>
              );
            })}
          </div>
          {peak.sales > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg" role="status" aria-live="polite">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Peak hour: {peak.hour} with {formatCurrency(peak.sales)} in sales
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products Today</h3>
          <div className="space-y-3">
            {topSellingToday.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{product.product}</div>
                    <div className="text-sm text-gray-500">{product.quantity} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{product.revenue}</div>
                  <div className="text-sm text-gray-500">{product.percentage.toFixed(1)}% of total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{method.method}</span>
                  <span className="text-sm text-gray-500">{method.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${method.color}`}
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
                <div className="text-sm font-semibold text-gray-900">{method.amount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {todaysTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{transaction.customer}</div>
                    <div className="text-sm text-gray-500">{transaction.time} • {transaction.staff}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(transaction.total)}</div>
                  <div className="text-sm text-gray-500">{transaction.payment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default DailySalesSummary;

