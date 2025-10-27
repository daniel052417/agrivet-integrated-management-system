import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Users, Clock, Package } from 'lucide-react';
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

  const [hourlyBreakdown, setHourlyBreakdown] = useState<{ hour: string; sales: number; orders: number; customers: number; }[]>([]);

  const [topSellingToday, setTopSellingToday] = useState<{ product: string; quantity: number; revenue: string; percentage: number; }[]>([]);

  const [todaysTransactions, setTodaysTransactions] = useState<{ time: string; customer: string; items: string[]; total: number; payment: string; staff: string; }[]>([]);

  const [paymentMethods, setPaymentMethods] = useState<{ method: string; amount: string; percentage: number; color: string; }[]>([]);

  const maxHourlySales = useMemo(() => Math.max(0, ...hourlyBreakdown.map(h => h.sales)), [hourlyBreakdown]);
  const peak = useMemo(() => {
    const p = hourlyBreakdown.reduce((prev, cur) => (cur.sales > prev.sales ? cur : prev), { hour: '—', sales: 0, orders: 0, customers: 0 });
    return p;
  }, [hourlyBreakdown]);

  useEffect(() => {
    loadDailyData();
  }, [selectedDate]);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Load transactions for selected date
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

      if (transactionsError) throw transactionsError;

      // Load staff information directly from staff table
      const userIds = [...new Set(transactions?.map(t => t.cashier_id).filter(Boolean) || [])];
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select(`
          id, first_name, last_name, department, email
        `)
        .in('id', userIds)
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Load transaction items for top selling products (using pos_transaction_items table)
      const { data: items, error: itemsError } = await supabase
        .from('pos_transaction_items')
        .select(`
          quantity, unit_price, line_total,
          product_name
        `)
        .in('transaction_id', transactions?.map(t => t.id) || []);

      if (itemsError) throw itemsError;

      // Calculate metrics
      const sales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const orders = transactions?.length || 0;
      const customers = new Set(transactions?.map(t => t.customer_id).filter(Boolean)).size;
      const avg = orders > 0 ? sales / orders : 0;

      setTotalSales(sales);
      setTotalOrders(orders);
      setCustomersServed(customers);
      setAvgOrder(avg);

      // Calculate growth (mock data for now)
      setGrowthPct(5.2);

      // Calculate hourly breakdown
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        sales: 0,
        orders: 0,
        customers: 0
      }));

      transactions?.forEach(transaction => {
        const hour = new Date(transaction.transaction_date).getHours();
        hourlyData[hour].sales += transaction.total_amount || 0;
        hourlyData[hour].orders += 1;
        if (transaction.customer_id) {
          hourlyData[hour].customers += 1;
        }
      });

      setHourlyBreakdown(hourlyData);

      // Calculate top selling products
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

      // Format today's transactions
      const formattedTransactions = transactions?.slice(0, 10).map(transaction => {
        const staffMember = staff?.find(s => s.id === transaction.cashier_id);
        return {
          time: new Date(transaction.transaction_date).toLocaleTimeString(),
          customer: transaction.customers 
            ? `${(transaction.customers as any).first_name || ''} ${(transaction.customers as any).last_name || ''}`.trim()
            : 'Walk-in Customer',
          items: ['Multiple items'], // This would be calculated from transaction items
          total: transaction.total_amount || 0,
          payment: transaction.payment_status || 'Unknown',
          staff: staffMember
            ? `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()
            : 'Unknown'
        };
      }) || [];

      setTodaysTransactions(formattedTransactions);

      // Calculate payment status distribution
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
    <div className="daily-sales-summary">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Sales Summary</h1>
          <p className="text-gray-600">Comprehensive daily sales analysis and insights</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {hourlyBreakdown.slice(0, 8).map((hour, index) => (
              <div key={index} className="text-center">
                <div className="text-sm text-gray-600 mb-2">{hour.hour}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${maxHourlySales > 0 ? (hour.sales / maxHourlySales) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(hour.sales)} ({hour.orders} orders)
                </div>
              </div>
            ))}
          </div>
          {peak.sales > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
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

