import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Package, BarChart3, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ProductSalesReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type ProductRow = { id: string; sku: string; name: string; category_id: string | null; unit_price: number; cost_price: number; stock_quantity: number };
  type CategoryRow = { id: string; name: string };
  type ItemRow = { product_id: string; quantity: number; unit_price: number; discount_amount: number | null; line_total: number | null; created_at: string };

  type ProductMetric = {
    id: string;
    name: string;
    categoryId: string | null;
    category: string;
    sku: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    margin: number;
    growth: number;
    isPositive: boolean;
    stock: number;
    avgPrice: number;
  };

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [metrics, setMetrics] = useState<ProductMetric[]>([]);

  function getPeriodRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;
    switch (period) {
      case 'today':
        start = new Date(now); start.setHours(0,0,0,0);
        end = new Date(now); end.setHours(23,59,59,999);
        break;
      case 'this-week': {
        const day = now.getDay();
        const diffToMonday = (day === 0 ? 6 : day - 1);
        start = new Date(now); start.setDate(now.getDate() - diffToMonday); start.setHours(0,0,0,0);
        end = new Date(now); end.setHours(23,59,59,999);
        break;
      }
      case 'last-month': {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0); end.setHours(23,59,59,999);
        break;
      }
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31); end.setHours(23,59,59,999);
        break;
      case 'this-month':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0); end.setHours(23,59,59,999);
        break;
    }
    const lengthMs = end.getTime() - start.getTime() + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - lengthMs + 1);
    return { start, end, prevStart, prevEnd };
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { start, end, prevStart, prevEnd } = getPeriodRange(selectedPeriod);

        const [prodRes, catRes, itemsCurRes, itemsPrevRes] = await Promise.all([
          supabase.from('products').select('id, sku, name, category_id, unit_price, cost_price, stock_quantity'),
          supabase.from('categories').select('id, name'),
          supabase.from('transaction_items')
            .select('product_id, quantity, unit_price, discount_amount, line_total, created_at')
            .gte('created_at', start.toISOString())
            .lt('created_at', new Date(end.getTime() + 1).toISOString()),
          supabase.from('transaction_items')
            .select('product_id, quantity, unit_price, discount_amount, line_total, created_at')
            .gte('created_at', prevStart.toISOString())
            .lt('created_at', new Date(prevEnd.getTime() + 1).toISOString()),
        ]);

        if (prodRes.error) throw prodRes.error;
        if (catRes.error) throw catRes.error;
        if (itemsCurRes.error) throw itemsCurRes.error;
        if (itemsPrevRes.error) throw itemsPrevRes.error;

        const products = (prodRes.data as ProductRow[]) || [];
        const cats = (catRes.data as CategoryRow[]) || [];
        setCategories(cats);
        const curItems = (itemsCurRes.data as ItemRow[]) || [];
        const prevItems = (itemsPrevRes.data as ItemRow[]) || [];

        const categoryIdToName = new Map<string, string>();
        cats.forEach(c => categoryIdToName.set(c.id, c.name));

        const curAgg = new Map<string, { units: number; revenue: number }>();
        curItems.forEach(i => {
          const revenue = Number(i.line_total ?? (i.quantity * (i.unit_price || 0) - (i.discount_amount || 0)));
          const prev = curAgg.get(i.product_id) || { units: 0, revenue: 0 };
          prev.units += Number(i.quantity || 0);
          prev.revenue += revenue;
          curAgg.set(i.product_id, prev);
        });

        const prevAgg = new Map<string, { revenue: number }>();
        prevItems.forEach(i => {
          const revenue = Number(i.line_total ?? (i.quantity * (i.unit_price || 0) - (i.discount_amount || 0)));
          const prev = prevAgg.get(i.product_id) || { revenue: 0 };
          prev.revenue += revenue;
          prevAgg.set(i.product_id, prev);
        });

        const list: ProductMetric[] = products
          .map(p => {
            const cur = curAgg.get(p.id) || { units: 0, revenue: 0 };
            const prev = prevAgg.get(p.id) || { revenue: 0 };
            const revenue = cur.revenue;
            const units = cur.units;
            const cost = Number(p.cost_price || 0) * units;
            const profit = revenue - cost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            const growth = prev.revenue > 0 ? ((revenue - prev.revenue) / prev.revenue) * 100 : 0;
            return {
              id: p.id,
              name: p.name,
              categoryId: p.category_id,
              category: p.category_id ? (categoryIdToName.get(p.category_id) || 'Uncategorized') : 'Uncategorized',
              sku: p.sku,
              unitsSold: units,
              revenue,
              profit,
              margin,
              growth,
              isPositive: growth >= 0,
              stock: Number(p.stock_quantity || 0),
              avgPrice: units > 0 ? revenue / units : 0,
            };
          })
          .filter(m => m.unitsSold > 0 || m.revenue > 0)
          .sort((a, b) => b.revenue - a.revenue);

        setMetrics(list);
      } catch (e: any) {
        console.error('Failed to load product sales report', e);
        setError('Failed to load product sales report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  const categoryPerformance = useMemo(() => {
    const COLORS = ['bg-red-500','bg-green-500','bg-orange-500','bg-blue-500','bg-purple-500','bg-teal-500'];
    const byCat = new Map<string, { revenue: number; units: number }>();
    metrics.forEach(m => {
      const key = m.category || 'Uncategorized';
      const prev = byCat.get(key) || { revenue: 0, units: 0 };
      prev.revenue += m.revenue;
      prev.units += m.unitsSold;
      byCat.set(key, prev);
    });
    return Array.from(byCat.entries()).map(([category, v], idx) => ({
      category,
      revenue: v.revenue,
      units: v.units,
      growth: 0,
      color: COLORS[idx % COLORS.length],
    }));
  }, [metrics]);

  const filteredMetrics = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return metrics.filter(m => {
      if (selectedCategory !== 'all' && m.categoryId !== selectedCategory) return false;
      if (!term) return true;
      return m.name.toLowerCase().includes(term) || m.sku.toLowerCase().includes(term) || m.category.toLowerCase().includes(term);
    });
  }, [metrics, searchTerm, selectedCategory]);

  const topPerformers = useMemo(() => metrics.slice(0, 5), [metrics]);

  const totalRevenue = filteredMetrics.reduce((sum, p) => sum + p.revenue, 0);
  const totalUnits = filteredMetrics.reduce((sum, p) => sum + p.unitsSold, 0);
  const avgMargin = filteredMetrics.length > 0 ? filteredMetrics.reduce((sum, p) => sum + p.margin, 0) / filteredMetrics.length : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Sales Report</h2>
          <p className="text-gray-600 mt-1">Detailed analysis of product performance and sales metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₱{Math.round(totalRevenue).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Margin</p>
              <p className="text-2xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Products Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{filteredMetrics.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Performance by Category</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryPerformance.map((category, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <span className="text-sm font-medium text-gray-900">{category.category}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Revenue</span>
                  <span className="text-sm font-bold text-gray-900">₱{Math.round(category.revenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Units</span>
                  <span className="text-sm text-gray-700">{category.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Growth</span>
                  <span className="text-sm text-gray-600">{category.growth ? `${category.growth > 0 ? '+' : ''}${category.growth.toFixed(1)}%` : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Product Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="px-6 py-4" colSpan={9}>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-100 rounded animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded animate-pulse" />
                      <div className="h-6 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td className="px-6 py-4 text-sm text-red-600" colSpan={9}>{error}</td>
                </tr>
              )}
              {!loading && !error && filteredMetrics.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.unitsSold.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₱{Math.round(product.revenue).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{Math.round(product.profit).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.margin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {product.isPositive ? (
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-600" />
                      )}
                      <span className={`text-sm ${product.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {product.isPositive ? '+' : ''}{product.growth.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${product.stock < 50 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !error && filteredMetrics.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={9}>No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Performing Products</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topPerformers.map((product, index) => (
            <div key={product.id} className="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold mx-auto mb-2">
                #{index + 1}
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">{product.name}</h4>
              <p className="text-lg font-bold text-gray-900">₱{Math.round(product.revenue).toLocaleString()}</p>
              <p className="text-xs text-gray-500">{product.unitsSold} units</p>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600">+{product.growth.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSalesReport;