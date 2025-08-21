import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Users, Clock, Package, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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

  // Fetch selected day data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date(`${selectedDate}T00:00:00.000Z`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - 1);

        const { data: txRows, error: txErr } = await supabase
          .from('sales_transactions')
          .select('id, customer_id, staff_id, transaction_date, total_amount, payment_method')
          .gte('transaction_date', start.toISOString())
          .lt('transaction_date', end.toISOString())
          .order('transaction_date', { ascending: false }) as any;
        if (txErr) throw txErr;
        const transactions = (txRows as any[] | null) || [];

        const txIds = Array.from(new Set(transactions.map(t => t.id)));
        const customerIds = Array.from(new Set(transactions.map(t => t.customer_id).filter(Boolean)));
        const staffIds = Array.from(new Set(transactions.map(t => t.staff_id).filter(Boolean)));

        const [itemsRes, customersRes, staffRes, prevDayRes] = await Promise.all([
          txIds.length ? supabase.from('transaction_items').select('transaction_id, product_id, quantity, unit_price, discount_amount, line_total').in('transaction_id', txIds) : Promise.resolve({ data: [], error: null }),
          customerIds.length ? supabase.from('customers').select('id, first_name, last_name').in('id', customerIds as string[]) : Promise.resolve({ data: [], error: null }),
          staffIds.length ? supabase.from('staff').select('id, first_name, last_name').in('id', staffIds as string[]) : Promise.resolve({ data: [], error: null }),
          supabase.from('sales_transactions').select('total_amount').gte('transaction_date', prevStart.toISOString()).lt('transaction_date', start.toISOString()),
        ]);

        if ((itemsRes as any).error) throw (itemsRes as any).error;
        if ((customersRes as any).error) throw (customersRes as any).error;
        if ((staffRes as any).error) throw (staffRes as any).error;
        if ((prevDayRes as any).error) throw (prevDayRes as any).error;

        const items = ((itemsRes as any).data as any[]);
        const productIds = Array.from(new Set(items.map(i => i.product_id)));
        const productsRes = productIds.length ? await supabase.from('products').select('id, name').in('id', productIds as string[]) : { data: [], error: null } as any;
        if ((productsRes as any).error) throw (productsRes as any).error;

        const productNameById = new Map<string, string>();
        (((productsRes as any).data as any[]) || []).forEach(p => productNameById.set(p.id, p.name));
        const customerNameById = new Map<string, string>();
        (((customersRes as any).data as any[]) || []).forEach(c => customerNameById.set(c.id, `${c.first_name || ''} ${c.last_name || ''}`.trim() || '—'));
        const staffNameById = new Map<string, string>();
        (((staffRes as any).data as any[]) || []).forEach(s => staffNameById.set(s.id, `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—'));

        const total = transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const orders = transactions.length;
        const customers = new Set<string>();
        transactions.forEach(t => { if (t.customer_id) customers.add(String(t.customer_id)); });
        const avg = orders > 0 ? total / orders : 0;
        const prevTotal = (((prevDayRes as any).data as any[]) || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);
        const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

        setTotalSales(total);
        setTotalOrders(orders);
        setCustomersServed(customers.size);
        setAvgOrder(avg);
        setGrowthPct(growth);

        const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, sales: 0, orders: 0, customers: new Set<string>() as Set<string> }));
        transactions.forEach(t => {
          const d = new Date(t.transaction_date);
          const h = d.getHours();
          hourly[h].sales += Number(t.total_amount || 0);
          hourly[h].orders += 1;
          if (t.customer_id) hourly[h].customers.add(String(t.customer_id));
        });
        setHourlyBreakdown(hourly.map(h => ({ hour: h.hour, sales: h.sales, orders: h.orders, customers: h.customers.size })));

        const byProduct = new Map<string, { quantity: number; revenue: number }>();
        items.forEach(i => {
          const revenue = Number(i.line_total ?? (i.quantity * (i.unit_price || 0) - (i.discount_amount || 0)));
          const prev = byProduct.get(i.product_id) || { quantity: 0, revenue: 0 };
          prev.quantity += Number(i.quantity || 0);
          prev.revenue += revenue;
          byProduct.set(i.product_id, prev);
        });
        const top = Array.from(byProduct.entries())
          .map(([productId, v]) => ({
            product: productNameById.get(productId) || 'Unknown Product',
            quantity: v.quantity,
            revenue: `₱${Math.round(v.revenue).toLocaleString()}`,
            percentage: total > 0 ? (v.revenue / total) * 100 : 0,
          }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        setTopSellingToday(top);

        const byMethod = new Map<string, number>();
        transactions.forEach(t => {
          const key = (t.payment_method || 'Other');
          byMethod.set(key, (byMethod.get(key) || 0) + Number(t.total_amount || 0));
        });
        const COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
        const methods = Array.from(byMethod.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([method, amount], idx) => ({ method, amount: `₱${Math.round(amount).toLocaleString()}`, percentage: total > 0 ? (amount / total) * 100 : 0, color: COLORS[idx % COLORS.length] }));
        setPaymentMethods(methods);

        const itemsByTx = new Map<string, string[]>();
        items.forEach(i => {
          const arr = itemsByTx.get(i.transaction_id) || [];
          const name = productNameById.get(i.product_id) || 'Item';
          if (!arr.includes(name)) arr.push(name);
          itemsByTx.set(i.transaction_id, arr);
        });
        const txList = transactions.map(t => {
          const d = new Date(t.transaction_date);
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          return {
            time: `${hh}:${mm}`,
            customer: t.customer_id ? (customerNameById.get(String(t.customer_id)) || 'Customer') : 'Walk-in',
            items: itemsByTx.get(t.id) || [],
            total: Number(t.total_amount || 0),
            payment: t.payment_method || '—',
            staff: t.staff_id ? (staffNameById.get(String(t.staff_id)) || '—') : '—',
          };
        });
        setTodaysTransactions(txList);

      } catch (e: any) {
        console.error('Failed to load daily sales summary', e);
        setError('Failed to load daily sales summary');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daily Sales Summary</h2>
          <p className="text-gray-600 mt-1">Detailed breakdown of today's sales performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Compare Dates</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && (
          <>
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          </>
        )}
        {!loading && !error && (
        <>
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center space-x-1">
              <TrendingUp className={`w-4 h-4 ${growthPct >= 0 ? 'text-green-600' : 'text-red-500 rotate-180'}`} />
              <span className={`text-sm font-semibold ${growthPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {`${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`}
                  </span>
                </div>
              </div>
              <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">₱{Math.round(totalSales).toLocaleString()}</h3>
                <p className="text-gray-400 text-xs mt-1">vs yesterday</p>
              </div>
          <div className="w-full h-1 bg-green-600 rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        </>
        )}
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{totalOrders.toLocaleString()}</h3>
          </div>
          <div className="w-full h-1 bg-blue-600 rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        {/* Customers Served */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Customers Served</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{customersServed.toLocaleString()}</h3>
          </div>
          <div className="w-full h-1 bg-purple-600 rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        {/* Average Order */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Average Order</p>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">₱{Math.round(avgOrder).toLocaleString()}</h3>
          </div>
          <div className="w-full h-1 bg-orange-600 rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
      </div>

      {/* Hourly Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Hourly Sales Breakdown</h3>
          <div className="text-sm text-gray-600">Peak: {peak.hour} (₱{Math.round(peak.sales).toLocaleString()})</div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
        <div className="space-y-3">
          {hourlyBreakdown.map((hour, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm font-medium text-gray-600 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {hour.hour}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">₱{hour.sales.toLocaleString()}</span>
                  <span className="text-xs text-gray-500">{hour.orders} orders • {hour.customers} customers</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(hour.sales / maxHourlySales) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Top Selling Products and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Selling Products Today</h3>
            <Package className="w-5 h-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
          <div className="space-y-4">
            {topSellingToday.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.product}</p>
                    <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.revenue}</p>
                  <p className="text-xs text-gray-500">{product.percentage.toFixed(1)}% of sales</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
          <div className="space-y-4">
            {paymentMethods.map((payment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${payment.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{payment.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{payment.amount}</span>
                    <span className="text-xs text-gray-500 ml-2">({payment.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${payment.color}`}
                    style={{ width: `${payment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">₱{Math.round(totalSales).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Today's Transactions</h3>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            {todaysTransactions.length} transactions
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
        <div className="space-y-4">
          {todaysTransactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{transaction.time}</div>
                  <div className="text-xs text-gray-500">Time</div>
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-sm font-medium text-gray-900">{transaction.customer}</p>
                  <p className="text-xs text-gray-500">{transaction.items.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₱{transaction.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{transaction.payment} • {transaction.staff}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Daily Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Daily Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{`${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`}</p>
            <p className="text-sm text-gray-600">vs Yesterday</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{peak.hour}</p>
            <p className="text-sm text-gray-600">Peak Hour</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{customersServed.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Customers Served</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesSummary;