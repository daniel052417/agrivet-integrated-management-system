import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Filter, Eye, Edit, BarChart3, PieChart, Warehouse } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const InventorySummaryPage: React.FC = () => {
  // Reserved for future filtering
  // const [searchTerm, setSearchTerm] = useState('');
  // const [selectedCategory, setSelectedCategory] = useState('all');

  type Metric = { title: string; value: string; color: string; change?: string; isPositive?: boolean; period: string };
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
  // legacy static metrics removed

  type CategoryRow = { id: string; name: string };
  // Removed unused type definitions
  type SupplierRow = { id: string; name: string };
  type CategorySummary = { category: string; totalItems: number; totalValue: number; inStock: number; lowStock: number; outOfStock: number; avgValue: number; color: string; trend?: string };
  
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const COLORS = ['bg-red-500','bg-green-500','bg-orange-500','bg-blue-500','bg-yellow-500','bg-purple-500'];
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type LowItem = { name: string; category: string; current: number; minimum: number; supplier: string; lastUpdate: string; urgency: 'high'|'medium'|'low' };
  const [lowStockItems, setLowStockItems] = useState<LowItem[]>([]);

  type TopItem = { name: string; value: number; quantity: number; category: string };
  const [topValueItems, setTopValueItems] = useState<TopItem[]>([]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load inventory data with product and variant information
        const { data: inventoryData, error: invErr } = await supabase
          .from('inventory')
          .select(`
            id,
            quantity_on_hand,
            quantity_available,
            reorder_level,
            max_stock_level,
            product_variants!inner(
              id,
              name,
              sku,
              variant_type,
              variant_value,
              price,
              cost,
              products!inner(
                id,
                name,
                sku,
                category_id,
                supplier_id,
                unit_of_measure,
                is_active,
                updated_at
              )
            )
          `)
          .eq('product_variants.products.is_active', true);

        if (invErr) throw invErr;

        // Load categories and suppliers
        const [{ data: categories, error: cErr }, { data: suppliers, error: sErr }] = await Promise.all([
          supabase.from('categories').select('id, name').eq('is_active', true),
          supabase.from('suppliers').select('id, name'),
        ]);
        if (cErr) throw cErr; if (sErr) throw sErr;

        const categoryIdToName = new Map<string, string>();
        (categories as CategoryRow[] | null)?.forEach(c => categoryIdToName.set(c.id, c.name));
        const supplierIdToName = new Map<string, string>();
        (suppliers as SupplierRow[] | null)?.forEach(s => supplierIdToName.set(s.id, s.name));

        // No need for separate variant query since it's already joined

        const inventoryRows = (inventoryData as any[] | null) || [];

        // Calculate metrics
        const totalValue = inventoryRows.reduce((sum, inv) => {
          const qty = Number(inv.quantity_on_hand || 0);
          const cost = Number(inv.product_variants.cost || inv.product_variants.price || 0);
          return sum + qty * cost;
        }, 0);

        const totalProducts = inventoryRows.length;
        const lowCount = inventoryRows.filter(inv => {
          const qty = Number(inv.quantity_on_hand || 0);
          const reorder = Number(inv.reorder_level || 0);
          return reorder > 0 && qty > 0 && qty <= reorder;
        }).length;
        const outCount = inventoryRows.filter(inv => Number(inv.quantity_on_hand || 0) === 0).length;
        setMetrics([
          { title: 'Total Inventory Value', value: currency.format(totalValue), period: 'Current Stock', color: 'bg-blue-600' },
          { title: 'Total Products', value: totalProducts.toLocaleString(), period: 'Active Items', color: 'bg-green-600' },
          { title: 'Low Stock Items', value: lowCount.toLocaleString(), period: 'Need Restock', color: 'bg-orange-600' },
          { title: 'Out of Stock', value: outCount.toLocaleString(), period: 'Urgent Action', color: 'bg-red-600' },
        ]);

        const byCat = new Map<string, { totalItems: number; totalValue: number; inStock: number; lowStock: number; outOfStock: number }>();
        inventoryRows.forEach(inv => {
          const cat = inv.product_variants.products.category_id || 'uncategorized';
          const qty = Number(inv.quantity_on_hand || 0);
          const cost = Number(inv.product_variants.cost || inv.product_variants.price || 0);
          const reorder = Number(inv.reorder_level || 0);
          const agg = byCat.get(cat) || { totalItems: 0, totalValue: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
          agg.totalItems += qty;
          agg.totalValue += qty * cost;
          if (qty === 0) agg.outOfStock += 1; else agg.inStock += qty;
          if (reorder > 0 && qty > 0 && qty <= reorder) agg.lowStock += 1;
          byCat.set(cat, agg);
        });
        const catList: any[] = Array.from(byCat.entries()).map(([catId, agg], idx) => ({
          category: categoryIdToName.get(catId) || 'Uncategorized',
          totalItems: agg.totalItems,
          totalValue: agg.totalValue,
          inStock: agg.inStock,
          lowStock: agg.lowStock,
          outOfStock: agg.outOfStock,
          avgValue: agg.totalItems > 0 ? agg.totalValue / agg.totalItems : 0,
          color: COLORS[idx % COLORS.length],
        })).sort((a,b)=> b.totalValue - a.totalValue);
        setCategorySummary(catList as any);

        const lowItems: LowItem[] = inventoryRows
          .filter(inv => {
            const qty = Number(inv.quantity_on_hand || 0);
            const reorder = Number(inv.reorder_level || 0);
            return reorder > 0 && qty > 0 && qty <= reorder;
          })
          .map(inv => {
            const qty = Number(inv.quantity_on_hand || 0);
            const reorder = Number(inv.reorder_level || 0);
            const ratio = reorder > 0 ? qty / reorder : 1;
            const urgency: LowItem['urgency'] = ratio <= 0.25 ? 'high' : ratio <= 0.5 ? 'medium' : 'low';
            return {
              name: inv.product_variants.products.name,
              category: categoryIdToName.get(inv.product_variants.products.category_id || '') || 'Uncategorized',
              current: qty,
              minimum: reorder,
              supplier: supplierIdToName.get(inv.product_variants.products.supplier_id || '') || '—',
              lastUpdate: inv.product_variants.products.updated_at || '',
              urgency,
            };
          })
          .sort((a,b) => (a.current/a.minimum) - (b.current/b.minimum))
          .slice(0,5);
        setLowStockItems(lowItems);

        const topItems: TopItem[] = inventoryRows
          .map(inv => {
            const qty = Number(inv.quantity_on_hand || 0);
            const cost = Number(inv.product_variants.cost || inv.product_variants.price || 0);
            return {
              name: inv.product_variants.products.name,
              value: qty * cost,
              quantity: qty,
              category: categoryIdToName.get(inv.product_variants.products.category_id || '') || 'Uncategorized',
            };
          })
          .sort((a,b) => b.value - a.value)
          .slice(0,5);
        setTopValueItems(topItems);
      } catch (e: any) {
        console.error('Failed to load inventory summary page', e);
        setError('Failed to load inventory summary');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Summary</h2>
          <p className="text-gray-600 mt-1">Complete overview of stock levels, values, and inventory health</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Inventory Metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${metric.color.replace('bg-', 'bg-').replace('-600', '-50')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Package className={`w-6 h-6 ${metric.color.replace('bg-', 'text-')}`} />
                </div>
                {metric.change !== undefined && metric.isPositive !== undefined && (
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
                )}
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{metric.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{metric.value}</h3>
                <p className="text-gray-400 text-xs mt-1">{metric.period}</p>
              </div>
              <div className={`w-full h-1 ${metric.color} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Inventory by Category</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categorySummary.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">{category.totalItems.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{currency.format(category.totalValue)}</td>
                  <td className="px-4 py-4 text-sm text-green-600">{category.inStock.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-orange-600">{category.lowStock.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-red-600">{category.outOfStock.toLocaleString()}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{currency.format(category.avgValue)}</td>
                  <td className="px-4 py-4">
                    {category.trend && (
                      <span className={`text-sm ${category.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {category.trend}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts and Top Value Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
            </div>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              {lowStockItems.length} items
            </span>
          </div>

          <div className="space-y-4">
            {lowStockItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.category} • {item.supplier}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                    {item.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Current: <strong className="text-red-600">{item.current}</strong></span>
                    <span>Min: <strong>{item.minimum}</strong></span>
                    <span>Last Update: {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString() : '—'}</span>
                  </div>
                  <button className="text-green-600 hover:text-green-800 text-xs font-medium">
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Value Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Warehouse className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Highest Value Items</h3>
            </div>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topValueItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} • Qty: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{currency.format(item.value)}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Edit className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Health Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Inventory Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">92.8%</p>
            <p className="text-sm text-gray-600">Stock Availability</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">₱2.8M</p>
            <p className="text-sm text-gray-600">Total Inventory Value</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">23</p>
            <p className="text-sm text-gray-600">Items Need Restock</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">+8.5%</p>
            <p className="text-sm text-gray-600">Value Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummaryPage;