import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Target, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const SalesDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type TxRow = { id: string; total_amount: number; transaction_date: string; payment_method: string | null; customer_id: string | null };
  type ItemRow = { product_id: string; quantity: number; unit_price: number; discount_amount: number | null; line_total: number | null; created_at: string };
  type ProductRow = { id: string; name: string };
  type CustomerRow = { id: string; registration_date?: string };

  type MetricCard = { title: string; value: string; change: string; isPositive: boolean; period: string; icon: any; color: string };
  type Trend = { period: string; sales: number; orders: number; target: number };
  type TopProduct = { name: string; sales: string; units: number; growth: string };
  type Channel = { channel: string; percentage: number; value: string; color: string };
  type RecentTx = { id: string; customer: string; amount: string; time: string; status?: string };

  const [salesMetrics, setSalesMetrics] = useState<MetricCard[]>([]);
  const [salesTrends, setSalesTrends] = useState<Trend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByChannel, setSalesByChannel] = useState<Channel[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);

  function getPeriodRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date; segments: { start: Date; end: Date; label: string }[] } {
    const now = new Date();
    let start: Date; let end: Date; let segments: { start: Date; end: Date; label: string }[] = [];
    if (period === 'daily') {
      start = new Date(now); start.setHours(0,0,0,0);
      end = new Date(now); end.setHours(23,59,59,999);
      for (let i = 0; i < 4; i++) {
        const s = new Date(start.getTime() + i * 6 * 60 * 60 * 1000);
        const e = new Date(start.getTime() + (i + 1) * 6 * 60 * 60 * 1000 - 1);
        segments.push({ start: s, end: e, label: `${String(s.getHours()).padStart(2,'0')}:00` });
      }
    } else if (period === 'weekly') {
      end = new Date(now); end.setHours(23,59,59,999);
      start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0,0,0,0);
      for (let i = 0; i < 4; i++) {
        const s = new Date(start.getTime() + i * 2 * 24 * 60 * 60 * 1000);
        const e = new Date(start.getTime() + (i + 1) * 2 * 24 * 60 * 60 * 1000 - 1);
        segments.push({ start: s, end: e, label: `Day ${i*2+1}-${i*2+2}` });
      }
    } else if (period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31); end.setHours(23,59,59,999);
      for (let q = 0; q < 4; q++) {
        const s = new Date(now.getFullYear(), q*3, 1);
        const e = new Date(now.getFullYear(), q*3 + 3, 0); e.setHours(23,59,59,999);
        segments.push({ start: s, end: e, label: `Q${q+1}` });
      }
    } else { // monthly
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0); end.setHours(23,59,59,999);
      for (let w = 0; w < 4; w++) {
        const s = new Date(start.getFullYear(), start.getMonth(), 1 + w*7);
        const e = new Date(start.getFullYear(), start.getMonth(), Math.min(1 + (w+1)*7, end.getDate())); e.setHours(23,59,59,999);
        segments.push({ start: s, end: e, label: `Week ${w+1}` });
      }
    }
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - (end.getTime() - start.getTime()));
    return { start, end, prevStart, prevEnd, segments };
  }

  function formatPHP(n: number): string { return `₱${Math.round(n).toLocaleString()}`; }

  function timeAgo(d: Date): string {
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs>1?'s':''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days>1?'s':''} ago`;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { start, end, prevStart, prevEnd, segments } = getPeriodRange(selectedPeriod);

        const [{ data: txData, error: txErr }, { data: prevTxData, error: prevErr }] = await Promise.all([
          supabase.from('sales_transactions')
            .select('id, total_amount, transaction_date, payment_method, customer_id')
            .gte('transaction_date', start.toISOString())
            .lt('transaction_date', end.toISOString())
            .order('transaction_date', { ascending: false }) as any,
          supabase.from('sales_transactions')
            .select('id, total_amount, transaction_date')
            .gte('transaction_date', prevStart.toISOString())
            .lt('transaction_date', prevEnd.toISOString()) as any,
        ]);
        if (txErr) throw txErr; if (prevErr) throw prevErr;

        const txs = (txData as TxRow[] | null) || [];
        const prevTxs = (prevTxData as TxRow[] | null) || [];

        const totalSales = txs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const totalOrders = txs.length;
        const prevTotalSales = prevTxs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const growth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
        const targetAch = prevTotalSales > 0 ? (totalSales / prevTotalSales) * 100 : 0;

        const { data: newCustData, error: custErr } = await supabase
          .from('customers')
          .select('id, registration_date')
          .gte('registration_date', start.toISOString())
          .lt('registration_date', end.toISOString());
        if (custErr) throw custErr;
        const newCustomers = (newCustData as CustomerRow[] | null)?.length || 0;

        const metricCards: MetricCard[] = [
          { title: 'Total Sales', value: formatPHP(totalSales), change: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`, isPositive: growth >= 0, period: 'vs previous', icon: DollarSign, color: 'bg-green-600' },
          { title: 'Total Orders', value: totalOrders.toLocaleString(), change: '', isPositive: true, period: 'Current Period', icon: ShoppingCart, color: 'bg-blue-600' },
          { title: 'New Customers', value: newCustomers.toLocaleString(), change: '', isPositive: true, period: 'Current Period', icon: Users, color: 'bg-purple-600' },
          { title: 'Sales Target', value: `${targetAch.toFixed(1)}%`, change: '', isPositive: true, period: 'Achievement', icon: Target, color: 'bg-orange-600' },
        ];
        setSalesMetrics(metricCards);

        // Trends aggregation per segment
        const trendList: Trend[] = segments.map(seg => {
          const sales = txs.filter(t => new Date(t.transaction_date) >= seg.start && new Date(t.transaction_date) <= seg.end)
            .reduce((s, t) => s + Number(t.total_amount || 0), 0);
          const orders = txs.filter(t => new Date(t.transaction_date) >= seg.start && new Date(t.transaction_date) <= seg.end).length;
          return { period: seg.label, sales, orders, target: (totalSales / segments.length) };
        });
        setSalesTrends(trendList);

        // Top products
        const txIds = Array.from(new Set(txs.map(t => t.id)));
        const [{ data: itemsCur, error: itemsCurErr }, { data: itemsPrev, error: itemsPrevErr }] = await Promise.all([
          txIds.length ? supabase.from('transaction_items').select('product_id, quantity, unit_price, discount_amount, line_total, created_at').in('transaction_id', txIds) : Promise.resolve({ data: [], error: null }) as any,
          supabase.from('transaction_items').select('product_id, quantity, unit_price, discount_amount, line_total, created_at').gte('created_at', prevStart.toISOString()).lt('created_at', prevEnd.toISOString()) as any,
        ]);
        if (itemsCurErr) throw itemsCurErr; if (itemsPrevErr) throw itemsPrevErr;
        const curItems = (itemsCur as ItemRow[] | null) || [];
        const prevItems = (itemsPrev as ItemRow[] | null) || [];
        const productIds = Array.from(new Set(curItems.map(i => i.product_id)));
        const { data: prodRows, error: prodErr } = productIds.length ? await supabase.from('products').select('id, name').in('id', productIds) : { data: [], error: null } as any;
        if (prodErr) throw prodErr;
        const nameById = new Map<string, string>();
        (prodRows as ProductRow[]).forEach(p => nameById.set(p.id, p.name));
        const aggCur = new Map<string, { sales: number; units: number }>();
        curItems.forEach(i => {
          const sales = Number(i.line_total ?? (i.quantity * (i.unit_price || 0) - (i.discount_amount || 0)));
          const prev = aggCur.get(i.product_id) || { sales: 0, units: 0 };
          prev.sales += sales; prev.units += Number(i.quantity || 0);
          aggCur.set(i.product_id, prev);
        });
        const aggPrev = new Map<string, { sales: number }>();
        prevItems.forEach(i => {
          const sales = Number(i.line_total ?? (i.quantity * (i.unit_price || 0) - (i.discount_amount || 0)));
          const prev = aggPrev.get(i.product_id) || { sales: 0 };
          prev.sales += sales;
          aggPrev.set(i.product_id, prev);
        });
        const top = Array.from(aggCur.entries())
          .map(([productId, v]) => {
            const prev = aggPrev.get(productId) || { sales: 0 };
            const growthP = prev.sales > 0 ? ((v.sales - prev.sales) / prev.sales) * 100 : 0;
            return { name: nameById.get(productId) || 'Unknown Product', sales: formatPHP(v.sales), units: v.units, growth: `${growthP >= 0 ? '+' : ''}${growthP.toFixed(1)}%` };
          })
          .sort((a, b) => Number(a.sales.replace(/[^0-9]/g, '')) < Number(b.sales.replace(/[^0-9]/g, '')) ? 1 : -1)
          .slice(0, 5);
        setTopProducts(top);

        // Sales by channel (use payment_method)
        const byMethod = new Map<string, number>();
        txs.forEach(t => {
          const key = t.payment_method || 'Other';
          byMethod.set(key, (byMethod.get(key) || 0) + Number(t.total_amount || 0));
        });
        const totalForPct = Array.from(byMethod.values()).reduce((a, b) => a + b, 0);
        const COLORS = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-teal-500'];
        const channels: Channel[] = Array.from(byMethod.entries()).map(([method, amt], idx) => ({
          channel: method,
          percentage: totalForPct > 0 ? (amt / totalForPct) * 100 : 0,
          value: formatPHP(amt),
          color: COLORS[idx % COLORS.length],
        }));
        setSalesByChannel(channels);

        // Recent transactions
        const customersRes = await supabase.from('customers').select('id, first_name, last_name');
        if (customersRes.error) throw customersRes.error;
        const customerNameById = new Map<string, string>();
        (customersRes.data as any[])?.forEach(c => customerNameById.set(c.id, `${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'));
        const recent: RecentTx[] = txs.slice(0, 5).map(t => ({
          id: t.id,
          customer: t.customer_id ? (customerNameById.get(String(t.customer_id)) || 'Walk-in') : 'Walk-in',
          amount: formatPHP(Number(t.total_amount || 0)),
          time: timeAgo(new Date(t.transaction_date)),
          status: 'completed',
        }));
        setRecentTransactions(recent);

      } catch (e: any) {
        console.error('Failed to load sales dashboard', e);
        setError('Failed to load sales dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // Static demo arrays removed; replaced by state populated from Supabase above

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Dashboard</h2>
          <p className="text-gray-600 mt-1">Real-time sales performance and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Custom Range</span>
          </button>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && (
          <>
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          </>
        )}
        {!loading && !error && salesMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex items-center space-x-1">
                  {metric.isPositive ? (
                    <TrendingUp className={`w-4 h-4 ${metric.color.replace('bg-', 'text-')}`} />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-semibold ${metric.isPositive ? metric.color.replace('bg-', 'text-') : 'text-red-500'}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
                <p className="text-gray-400 text-xs mt-1">{metric.period}</p>
              </div>
              <div className={`w-full h-1 ${metric.color} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
            </div>
          );
        })}
        {error && !loading && (
          <div className="col-span-4 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Sales Trends and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : salesTrends.map((trend, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{trend.period}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{formatPHP(trend.sales)}</span>
                    <span className="text-xs text-gray-500 ml-2">({trend.orders} orders)</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${trend.sales >= trend.target ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.min((trend.sales / trend.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="absolute right-0 top-0 w-1 h-3 bg-gray-400 rounded-full"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Target: {formatPHP(trend.target)}</span>
                  <span className={trend.sales >= trend.target ? 'text-green-600' : 'text-orange-600'}>
                    {((trend.sales / trend.target) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.sales}</p>
                  <p className="text-xs text-green-600">{product.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales by Channel and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales by Channel</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : salesByChannel.map((channel, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{channel.value}</span>
                    <span className="text-xs text-gray-500 ml-2">({channel.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${channel.color}`}
                    style={{ width: `${channel.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
                <div className="h-10 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.id}</p>
                    <p className="text-xs text-gray-500">{transaction.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{transaction.amount}</p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
            View All Transactions
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">+18.5%</p>
            <p className="text-sm text-gray-600">Sales Growth</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">87.5%</p>
            <p className="text-sm text-gray-600">Target Achievement</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">245</p>
            <p className="text-sm text-gray-600">New Customers</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">₱2,284</p>
            <p className="text-sm text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;