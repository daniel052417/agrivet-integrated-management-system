import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, TrendingDown, Clock, Truck, Eye, Edit, Search, Filter, Download, RefreshCw, ShoppingCart, Phone, Mail, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const LowStockAlerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  type LowItem = {
    id: string;
    name: string;
    sku: string;
    category: string;
    currentStock: number;
    minimumStock: number;
    reorderLevel: number;
    unitPrice: number;
    totalValue: number;
    supplier: string;
    supplierContact: string;
    supplierEmail: string;
    lastOrderDate: string;
    leadTime: string;
    urgency: 'Critical' | 'High' | 'Medium' | 'Low';
    daysUntilEmpty: number;
    avgDailyUsage: number;
  };
  const [lowStockItems, setLowStockItems] = useState<LowItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type AlertMetric = { title: string; value: string; description: string; color: string; bgColor: string; icon: any };
  const [alertMetrics, setAlertMetrics] = useState<AlertMetric[]>([]);

  type CategoryAgg = { category: string; items: number; value: number; urgency: 'Critical'|'High'|'Medium'|'Low'; color: string };
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryAgg[]>([]);

  type Suggestion = { supplier: string; items: number; totalValue: number; contact: string; email: string; leadTime: string; lastOrder: string };
  const [reorderSuggestions, setReorderSuggestions] = useState<Suggestion[]>([]);

  const COLORS = ['bg-red-500','bg-green-500','bg-yellow-500','bg-blue-500','bg-purple-500'];
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: products, error: pErr }, { data: categories, error: cErr }, { data: suppliers, error: sErr }] = await Promise.all([
          supabase.from('products').select('id, name, sku, category_id, supplier_id, stock_quantity, minimum_stock, unit_price, updated_at'),
          supabase.from('categories').select('id, name'),
          supabase.from('suppliers').select('id, name, email, phone'),
        ]);
        if (pErr) throw pErr; if (cErr) throw cErr; if (sErr) throw sErr;

        const categoryIdToName = new Map<string, string>();
        (categories || []).forEach((c: any) => categoryIdToName.set(c.id, c.name));
        const supplierIdToInfo = new Map<string, { name: string; email: string; phone: string }>();
        (suppliers || []).forEach((s: any) => supplierIdToInfo.set(s.id, { name: s.name, email: s.email, phone: s.phone }));

        const rows = (products as any[]) || [];
        const lowItems: LowItem[] = rows
          .filter(p => {
            const qty = Number(p.stock_quantity || 0); const min = Number(p.minimum_stock || 0);
            return min > 0 && qty > 0 && qty <= min;
          })
          .map(p => {
            const qty = Number(p.stock_quantity || 0);
            const min = Number(p.minimum_stock || 0);
            const price = Number(p.unit_price || 0);
            const ratio = min > 0 ? qty / min : 1;
            const urgency: LowItem['urgency'] = ratio <= 0.25 ? 'Critical' : ratio <= 0.5 ? 'High' : ratio <= 0.75 ? 'Medium' : 'Low';
            const avgDailyUsage = Math.max(1, Math.round(qty / 14));
            const daysUntilEmpty = Math.max(1, Math.ceil(qty / avgDailyUsage));
            const supplier = supplierIdToInfo.get(p.supplier_id || '') || { name: '—', email: '—', phone: '—' };
            return {
              id: p.id,
              name: p.name,
              sku: p.sku,
              category: categoryIdToName.get(p.category_id || '') || 'Uncategorized',
              currentStock: qty,
              minimumStock: min,
              reorderLevel: Math.max(min, Math.ceil(min * 1.5)),
              unitPrice: price,
              totalValue: qty * price,
              supplier: supplier.name,
              supplierContact: supplier.phone || '—',
              supplierEmail: supplier.email || '—',
              lastOrderDate: p.updated_at || '',
              leadTime: '—',
              urgency,
              daysUntilEmpty,
              avgDailyUsage,
            };
          })
          .sort((a,b) => (a.currentStock/a.minimumStock) - (b.currentStock/b.minimumStock));
        setLowStockItems(lowItems);

        const critical = lowItems.filter(i => i.urgency === 'Critical').length;
        const high = lowItems.filter(i => i.urgency === 'High').length;
        const medium = lowItems.filter(i => i.urgency === 'Medium').length;
        const valueAtRisk = lowItems.reduce((s,i)=> s + i.totalValue, 0);
        setAlertMetrics([
          { title: 'Critical Alerts', value: String(critical), description: 'Immediate action required', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
          { title: 'High Priority', value: String(high), description: 'Reorder within 3 days', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
          { title: 'Medium Priority', value: String(medium), description: 'Reorder within 7 days', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Package },
          { title: 'Total Value at Risk', value: currency.format(valueAtRisk), description: 'Value of low stock items', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingDown },
        ]);

        const byCat = new Map<string, { items: number; value: number; urgencyRank: number }>();
        const urgencyToRank: Record<LowItem['urgency'], number> = { Critical: 3, High: 2, Medium: 1, Low: 0 };
        lowItems.forEach(i => {
          const key = i.category;
          const agg = byCat.get(key) || { items: 0, value: 0, urgencyRank: 0 };
          agg.items += 1;
          agg.value += i.totalValue;
          agg.urgencyRank = Math.max(agg.urgencyRank, urgencyToRank[i.urgency]);
          byCat.set(key, agg);
        });
        const catList: CategoryAgg[] = Array.from(byCat.entries()).map(([cat, agg], idx) => ({
          category: cat,
          items: agg.items,
          value: agg.value,
          urgency: (Object.keys(urgencyToRank) as LowItem['urgency'][]).find(u => urgencyToRank[u] === agg.urgencyRank) || 'Low',
          color: COLORS[idx % COLORS.length],
        })).sort((a,b)=> b.value - a.value);
        setCategoryBreakdown(catList);

        const bySupplier = new Map<string, { items: number; value: number; last: string }>();
        lowItems.forEach(i => {
          const key = i.supplier;
          const agg = bySupplier.get(key) || { items: 0, value: 0, last: '' };
          agg.items += 1; agg.value += i.totalValue; agg.last = agg.last && i.lastOrderDate && agg.last > i.lastOrderDate ? agg.last : i.lastOrderDate;
          bySupplier.set(key, agg);
        });
        const sug: Suggestion[] = Array.from(bySupplier.entries()).map(([supplier, agg]) => {
          const info = [...supplierIdToInfo.values()].find(s => s.name === supplier);
          return {
            supplier,
            items: agg.items,
            totalValue: agg.value,
            contact: info?.phone || '—',
            email: info?.email || '—',
            leadTime: '—',
            lastOrder: agg.last ? new Date(agg.last).toLocaleDateString() : '—',
          };
        }).sort((a,b)=> b.totalValue - a.totalValue);
        setReorderSuggestions(sug);
      } catch (e: any) {
        console.error('Failed to load low stock alerts', e);
        setError('Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Medicines': return 'bg-red-100 text-red-800';
      case 'Agriculture': return 'bg-green-100 text-green-800';
      case 'Animal Feed': return 'bg-yellow-100 text-yellow-800';
      case 'Tools': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || item.urgency.toLowerCase() === selectedUrgency;
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesUrgency && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h2>
          <p className="text-gray-600 mt-1">Monitor and manage inventory items that need immediate attention</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Alerts</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Alert Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {alertMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{metric.title}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Category Breakdown and Reorder Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Alerts by Category</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              </>
            ) : (
            categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category}</p>
                    <p className="text-xs text-gray-500">{category.items} items • {category.urgency} priority</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{currency.format(category.value)}</p>
                  <p className="text-xs text-gray-500">at risk</p>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Reorder Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Reorder Suggestions</h3>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              </>
            ) : (
            reorderSuggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{suggestion.supplier}</h4>
                    <p className="text-xs text-gray-500">{suggestion.items} items • {suggestion.totalValue}</p>
                  </div>
                  <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                    <ShoppingCart className="w-3 h-3" />
                    <span>Reorder</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{suggestion.contact}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{suggestion.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Lead time: {suggestion.leadTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Last order: {suggestion.lastOrder}</span>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="medicines">Medicines</option>
            <option value="agriculture">Agriculture</option>
            <option value="animal feed">Animal Feed</option>
            <option value="tools">Tools</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Low Stock Items ({filteredItems.length})
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-refresh:</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Empty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={8}>Loading...</td>
                </tr>
              ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      <div className="text-xs text-gray-400">{currency.format(item.unitPrice)} each</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-red-600">{item.currentStock}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{item.minimumStock}</span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            (item.currentStock / item.minimumStock) < 0.3 ? 'bg-red-500' :
                            (item.currentStock / item.minimumStock) < 0.6 ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((item.currentStock / item.minimumStock) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {item.minimumStock} • Reorder: {item.reorderLevel}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        item.daysUntilEmpty <= 3 ? 'text-red-600' :
                        item.daysUntilEmpty <= 7 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {item.daysUntilEmpty}
                      </div>
                      <div className="text-xs text-gray-500">days</div>
                      <div className="text-xs text-gray-400">
                        {item.avgDailyUsage}/day avg
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.supplier}</div>
                      <div className="text-xs text-gray-500">{item.supplierContact}</div>
                      <div className="text-xs text-gray-400">Last order: {item.lastOrderDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{item.leadTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                      {item.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                        <ShoppingCart className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Reorder All Critical</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Truck className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Contact Suppliers</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Package className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Adjust Min Levels</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Export Alert Report</span>
          </button>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Alert Activity</h3>
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {[
            { time: '2 hours ago', action: 'Critical alert triggered', item: 'Veterinary Syringes 10ml', type: 'critical' },
            { time: '4 hours ago', action: 'Reorder completed', item: 'Animal Feed Premium', type: 'success' },
            { time: '6 hours ago', action: 'Stock level updated', item: 'Organic Fertilizer', type: 'info' },
            { time: '1 day ago', action: 'Supplier contacted', item: 'Pruning Shears', type: 'info' },
            { time: '2 days ago', action: 'Alert resolved', item: 'Vitamin Complex', type: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'critical' ? 'bg-red-500' :
                activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.item}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlerts;