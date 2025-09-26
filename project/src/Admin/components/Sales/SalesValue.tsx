import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, BarChart3, PieChart, Target } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const SalesValue: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type TxRow = { id: string; total_amount: number; transaction_date: string; payment_status: string };
  type ItemRow = { product_id: string; quantity: number; unit_price: number; total_price: number; created_at: string };
  type ProductRow = { id: string; name: string; category_id: string; sku: string };
  type VariantRow = { id: string; product_id: string; cost: number; price: number; name: string };
  type CategoryRow = { id: string; name: string };

  type Metric = { title: string; value: string; change: string; isPositive: boolean; period: string; color: string; icon: 'sales' | 'order' | 'daily' | 'target' };
  type CategoryMetric = { category: string; value: string; percentage: number; growth: string; color: string };
  type Trend = { month: string; sales: number; target: number; orders: number };
  type TopProd = { name: string; sales: string; units: number; margin: string };

  const [salesMetrics, setSalesMetrics] = useState<Metric[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<CategoryMetric[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<Trend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProd[]>([]);

  function getPeriodRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const now = new Date();
    let start: Date; let end: Date;
    if (period === 'daily') { start = new Date(now); start.setHours(0,0,0,0); end = new Date(now); end.setHours(23,59,59,999); }
    else if (period === 'weekly') { end = new Date(now); end.setHours(23,59,59,999); start = new Date(end); start.setDate(end.getDate()-6); start.setHours(0,0,0,0); }
    else if (period === 'yearly') { start = new Date(now.getFullYear(),0,1); end = new Date(now.getFullYear(),11,31); end.setHours(23,59,59,999); }
    else { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now.getFullYear(), now.getMonth()+1, 0); end.setHours(23,59,59,999); }
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - (end.getTime() - start.getTime()));
    return { start, end, prevStart, prevEnd };
  }

  function formatPHP(n: number): string { return `₱${Math.round(n).toLocaleString()}`; }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { start, end, prevStart, prevEnd } = getPeriodRange(selectedPeriod);

        // Fetch current period transactions
        const { data: txRows, error: txErr } = await supabase
          .from('sales_transactions')
          .select('id, total_amount, transaction_date, payment_status')
          .gte('transaction_date', start.toISOString())
          .lt('transaction_date', end.toISOString())
          .eq('payment_status', 'completed'); // Only count completed transactions

        // Fetch previous period transactions for comparison
        const { data: prevTxRows, error: prevTxErr } = await supabase
          .from('sales_transactions')
          .select('id, total_amount, transaction_date')
          .gte('transaction_date', prevStart.toISOString())
          .lt('transaction_date', prevEnd.toISOString())
          .eq('payment_status', 'completed');

        if (txErr) throw txErr; 
        if (prevTxErr) throw prevTxErr;
        const txs = (txRows as TxRow[] | null) || [];
        const prevTxs = (prevTxRows as TxRow[] | null) || [];

        const totalSales = txs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const totalOrders = txs.length;
        const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
        const prevTotal = prevTxs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const salesGrowth = prevTotal > 0 ? ((totalSales - prevTotal) / prevTotal) * 100 : 0;
        const dailyAvg = (totalSales / Math.max(1, (end.getTime() - start.getTime() + 1) / (24*60*60*1000)));
        const targetAch = prevTotal > 0 ? (totalSales / prevTotal) * 100 : 0;

        setSalesMetrics([
          { title: 'Total Sales Value', value: formatPHP(totalSales), change: `${salesGrowth >= 0 ? '+' : ''}${salesGrowth.toFixed(1)}%`, isPositive: salesGrowth >= 0, period: 'vs previous', color: 'bg-green-600', icon: 'sales' },
          { title: 'Average Order Value', value: formatPHP(avgOrder), change: '', isPositive: true, period: 'Current Period', color: 'bg-blue-600', icon: 'order' },
          { title: 'Daily Sales Average', value: formatPHP(dailyAvg), change: '', isPositive: true, period: selectedPeriod === 'monthly' ? 'This Month' : 'Current Period', color: 'bg-purple-600', icon: 'daily' },
          { title: 'Sales Target Achievement', value: `${targetAch.toFixed(1)}%`, change: '', isPositive: true, period: 'vs previous', color: 'bg-orange-600', icon: 'target' },
        ]);

        // Get transaction items for product analysis
        const txIds = Array.from(new Set(txs.map(t => t.id)));
        const { data: itemsData, error: itemsErr } = txIds.length 
          ? await supabase
              .from('transaction_items')
              .select('product_id, quantity, unit_price, total_price, created_at')
              .in('transaction_id', txIds)
          : { data: [], error: null };

        if (itemsErr) throw itemsErr;
        const items = (itemsData as ItemRow[] | null) || [];

        // Get product and variant data
        const productIds = Array.from(new Set(items.map(i => i.product_id)));
        const [{ data: prodRows, error: prodErr }, { data: catRows, error: catErr }] = await Promise.all([
          productIds.length 
            ? supabase
                .from('products')
                .select('id, name, category_id, sku')
                .in('id', productIds)
                .eq('is_active', true)
            : { data: [], error: null },
          supabase
            .from('categories')
            .select('id, name')
            .eq('is_active', true),
        ]);

        if (prodErr) throw prodErr; 
        if (catErr) throw catErr;

        const products = (prodRows as ProductRow[]) || [];
        const cats = (catRows as CategoryRow[]) || [];
        const catNameById = new Map<string, string>(); 
        cats.forEach(c => catNameById.set(c.id, c.name));

        // Get product variants for cost data
        const { data: variantRows, error: variantErr } = productIds.length
          ? await supabase
              .from('product_variants')
              .select('id, product_id, cost, price, name')
              .in('product_id', productIds)
              .eq('is_active', true)
          : { data: [], error: null };

        if (variantErr) throw variantErr;
        const variants = (variantRows as VariantRow[]) || [];

        // Create variant lookup by product_id
        const variantByProductId = new Map<string, VariantRow>();
        variants.forEach(v => {
          if (!variantByProductId.has(v.product_id)) {
            variantByProductId.set(v.product_id, v);
          }
        });

        // Calculate category and product metrics
        const byCategory = new Map<string, { revenue: number; units: number }>();
        const byProduct = new Map<string, { name: string; revenue: number; units: number; margin: number }>();

        items.forEach(i => {
          const revenue = Number(i.total_price || 0);
          const p = products.find(pp => pp.id === i.product_id);
          const category = p?.category_id ? (catNameById.get(p.category_id) || 'Uncategorized') : 'Uncategorized';
          
          // Update category metrics
          const prevC = byCategory.get(category) || { revenue: 0, units: 0 };
          prevC.revenue += revenue; 
          prevC.units += Number(i.quantity || 0); 
          byCategory.set(category, prevC);

          // Update product metrics
          if (p) {
            const prevP = byProduct.get(p.id) || { name: p.name, revenue: 0, units: 0, margin: 0 };
            prevP.revenue += revenue;
            prevP.units += Number(i.quantity || 0);
            
            // Calculate margin using variant cost
            const variant = variantByProductId.get(p.id);
            const unitCost = variant ? Number(variant.cost || 0) : 0;
            const profit = revenue - unitCost * Number(i.quantity || 0);
            prevP.margin = prevP.revenue > 0 ? (profit / prevP.revenue) * 100 : 0;
            byProduct.set(p.id, prevP);
          }
        });

        // Set category metrics
        const catTotal = Array.from(byCategory.values()).reduce((s, v) => s + v.revenue, 0);
        const COLORS = ['bg-red-500','bg-green-500','bg-orange-500','bg-blue-500','bg-yellow-500','bg-purple-500'];
        const catList: CategoryMetric[] = Array.from(byCategory.entries()).map(([category, v], idx) => ({
          category,
          value: formatPHP(v.revenue),
          percentage: catTotal > 0 ? (v.revenue / catTotal) * 100 : 0,
          growth: '',
          color: COLORS[idx % COLORS.length],
        }))
        .sort((a, b) => Number(a.value.replace(/[^0-9]/g,'')) < Number(b.value.replace(/[^0-9]/g,'')) ? 1 : -1);
        setSalesByCategory(catList);

        // Set top products
        const topList: TopProd[] = Array.from(byProduct.values())
          .map(p => ({ name: p.name, sales: formatPHP(p.revenue), units: p.units, margin: `${p.margin.toFixed(1)}%` }))
          .sort((a, b) => Number(a.sales.replace(/[^0-9]/g,'')) < Number(b.sales.replace(/[^0-9]/g,'')) ? 1 : -1)
          .slice(0, 5);
        setTopProducts(topList);

        // Generate monthly trends for last 6 months
        const months: Trend[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(); 
          d.setMonth(d.getMonth() - i, 1); 
          d.setHours(0,0,0,0);
          const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          
          const { data, error: e } = await supabase
            .from('sales_transactions')
            .select('total_amount, transaction_date')
            .gte('transaction_date', d.toISOString())
            .lt('transaction_date', next.toISOString())
            .eq('payment_status', 'completed');
          
          if (e) throw e;
          const monthSales = ((data as any[])||[]).reduce((s, r) => s + Number(r.total_amount || 0), 0);
          months.push({ 
            month: d.toLocaleString('en-US', { month: 'short' }), 
            sales: monthSales, 
            target: monthSales * 1.05, 
            orders: ((data as any[])||[]).length 
          });
        }
        setMonthlyTrends(months);

      } catch (e: any) {
        console.error('Failed to load sales value', e);
        setError('Failed to load sales value');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // Static demo arrays removed; now using state populated from Supabase

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Value Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive sales performance and revenue analysis</p>
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
            <Download className="w-4 h-4" />
            <span>Export Report</span>
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
        {!loading && !error && salesMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <DollarSign className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
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
        ))}
        {error && !loading && (
          <div className="col-span-4 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Sales Trends Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales Trends vs Targets</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Actual Sales</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-sm text-gray-600">Target</span>
            </div>
          </div>
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
          ) : monthlyTrends.map((trend, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{trend.month}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{formatPHP(trend.sales)}</span>
                  <span className="text-xs text-gray-500">{trend.orders} orders</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full relative"
                      style={{ width: `${(trend.sales / trend.target) * 100}%` }}
                    >
                      <div className="absolute right-0 top-0 w-1 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`text-sm font-medium ${trend.sales >= trend.target ? 'text-green-600' : 'text-orange-600'}`}>
                  {((trend.sales / trend.target) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales by Category and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
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
            ) : salesByCategory.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{category.value}</span>
                    <span className="text-xs text-green-600 ml-2">{category.growth}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${category.color}`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total sales</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products by Sales Value */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Top Products by Sales Value</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
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
                  <p className="text-xs text-green-600">{product.margin} margin</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">87.5%</p>
            <p className="text-sm text-gray-600">Target Achievement</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">+18.5%</p>
            <p className="text-sm text-gray-600">Growth Rate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">₱2,450</p>
            <p className="text-sm text-gray-600">Avg Order Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesValue;