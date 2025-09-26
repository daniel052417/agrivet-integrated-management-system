import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Filter, Eye, Edit, BarChart3, PieChart, Warehouse } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const InventorySummaryPage: React.FC = () => {
  type Metric = { title: string; value: string; color: string; change?: string; isPositive?: boolean; period: string };
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  type CategoryRow = { id: string; name: string };
  type VariantRow = { id: string; product_id: string; name: string; price: number; cost: number | null; is_active: boolean };
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

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

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
      const [{ data: categories, error: categoriesError }, { data: suppliers, error: suppliersError }] = await Promise.all([
        supabase.from('categories').select('id, name').eq('is_active', true),
        supabase.from('suppliers').select('id, name'),
      ]);

      if (categoriesError) throw categoriesError;
      if (suppliersError) throw suppliersError;

      // No need for separate variant query since it's already joined

      // Calculate metrics
      const inventoryRows = (inventoryData as any[] | null) || [];
      const totalProducts = inventoryRows.length;
      
      const totalValue = inventoryRows.reduce((sum, inv) => {
        const qty = Number(inv.quantity_on_hand || 0);
        const price = Number(inv.product_variants.price || 0);
        return sum + qty * price;
      }, 0);

      const totalCost = inventoryRows.reduce((sum, inv) => {
        const qty = Number(inv.quantity_on_hand || 0);
        const cost = Number(inv.product_variants.cost || inv.product_variants.price || 0);
        return sum + qty * cost;
      }, 0);

      const lowStockCount = inventoryRows.filter(inv => {
        const qty = Number(inv.quantity_on_hand || 0);
        const reorder = Number(inv.reorder_level || 0);
        return reorder > 0 && qty > 0 && qty <= reorder;
      }).length;

      const outOfStockCount = inventoryRows.filter(inv => Number(inv.quantity_on_hand || 0) === 0).length;
      const profit = totalValue - totalCost;
      const profitMargin = totalValue > 0 ? (profit / totalValue) * 100 : 0;

      setMetrics([
        {
          title: 'Total Products',
          value: totalProducts.toString(),
          color: 'blue',
          period: 'All time'
        },
        {
          title: 'Total Value',
          value: currency.format(totalValue),
          color: 'green',
          change: '+5.2%',
          isPositive: true,
          period: 'vs last month'
        },
        {
          title: 'Low Stock Items',
          value: lowStockCount.toString(),
          color: lowStockCount > 10 ? 'red' : 'yellow',
          change: lowStockCount > 0 ? `${lowStockCount} items need attention` : 'All good',
          isPositive: lowStockCount === 0,
          period: 'Current status'
        },
        {
          title: 'Out of Stock',
          value: outOfStockCount.toString(),
          color: outOfStockCount > 0 ? 'red' : 'green',
          change: outOfStockCount > 0 ? 'Immediate action needed' : 'All items in stock',
          isPositive: outOfStockCount === 0,
          period: 'Current status'
        },
        {
          title: 'Profit Margin',
          value: `${profitMargin.toFixed(1)}%`,
          color: profitMargin > 20 ? 'green' : profitMargin > 10 ? 'yellow' : 'red',
          change: profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : 'Needs improvement',
          isPositive: profitMargin > 10,
          period: 'Current'
        },
        {
          title: 'Total Profit',
          value: currency.format(profit),
          color: profit > 0 ? 'green' : 'red',
          change: profit > 0 ? 'Profitable' : 'Loss',
          isPositive: profit > 0,
          period: 'Current'
        }
      ]);

      // Calculate category summary
      const categoryMap = new Map<string, CategorySummary>();
      
      (categories as CategoryRow[] | null)?.forEach(category => {
        categoryMap.set(category.id, {
          category: category.name,
          totalItems: 0,
          totalValue: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          avgValue: 0,
          color: COLORS[categoryMap.size % COLORS.length]
        });
      });

      inventoryRows.forEach(inv => {
        const categoryId = inv.product_variants.products.category_id;
        const category = categoryMap.get(categoryId);
        if (category) {
          const qty = Number(inv.quantity_on_hand || 0);
          const price = Number(inv.product_variants.price || 0);
          const reorder = Number(inv.reorder_level || 0);
          
          category.totalItems += 1;
          category.totalValue += qty * price;
          
          if (qty === 0) {
            category.outOfStock += 1;
          } else if (reorder > 0 && qty <= reorder) {
            category.lowStock += 1;
          } else {
            category.inStock += 1;
          }
        }
      });

      // Calculate averages and trends
      const categorySummaries = Array.from(categoryMap.values()).map(category => ({
        ...category,
        avgValue: category.totalItems > 0 ? category.totalValue / category.totalItems : 0,
        trend: category.totalValue > 0 ? 'up' : 'stable'
      })).sort((a, b) => b.totalValue - a.totalValue);

      setCategorySummary(categorySummaries);

      // Calculate low stock items
      const lowStockList: LowItem[] = inventoryRows
        .filter(inv => {
          const qty = Number(inv.quantity_on_hand || 0);
          const reorder = Number(inv.reorder_level || 0);
          return reorder > 0 && qty > 0 && qty <= reorder;
        })
        .map(inv => {
          const qty = Number(inv.quantity_on_hand || 0);
          const reorder = Number(inv.reorder_level || 0);
          const ratio = reorder > 0 ? qty / reorder : 1;
          let urgency: 'high'|'medium'|'low' = 'low';
          if (qty === 0) {
            urgency = 'high';
          } else if (ratio <= 0.5) {
            urgency = 'medium';
          }

          const categoryName = (categories as CategoryRow[] | null)?.find(c => c.id === inv.product_variants.products.category_id)?.name || 'Uncategorized';
          const supplierName = (suppliers as SupplierRow[] | null)?.find(s => s.id === inv.product_variants.products.supplier_id)?.name || 'Unknown';

          return {
            name: inv.product_variants.products.name,
            category: categoryName,
            current: qty,
            minimum: reorder,
            supplier: supplierName,
            lastUpdate: inv.product_variants.products.updated_at ? new Date(inv.product_variants.products.updated_at).toLocaleDateString() : 'Never',
            urgency
          };
        });

      setLowStockItems(lowStockList.slice(0, 10));

      // Calculate top value items
      const topItems: TopItem[] = inventoryRows
        .map(inv => {
          const qty = Number(inv.quantity_on_hand || 0);
          const price = Number(inv.product_variants.price || 0);
          const categoryName = (categories as CategoryRow[] | null)?.find(c => c.id === inv.product_variants.products.category_id)?.name || 'Uncategorized';
          
          return {
            name: inv.product_variants.products.name,
            value: qty * price,
            quantity: qty,
            category: categoryName
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setTopValueItems(topItems);

    } catch (err: any) {
      console.error('Error loading inventory data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Inventory Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadInventoryData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="inventory-summary">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Summary</h1>
          <p className="text-gray-600">Comprehensive overview of your inventory status</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{metric.title}</h3>
                <div className={`p-2 rounded-lg ${getMetricColor(metric.color)}`}>
                  <Package className="w-6 h-6" />
                </div>
              </div>
              
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {metric.value}
              </div>
              
              {metric.change && (
                <div className="flex items-center space-x-2">
                  {metric.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-1">
                {metric.period}
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorySummary.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{category.category}</h4>
                  <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{category.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">{currency.format(category.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Stock:</span>
                    <span className="font-medium text-green-600">{category.inStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low Stock:</span>
                    <span className="font-medium text-yellow-600">{category.lowStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Out of Stock:</span>
                    <span className="font-medium text-red-600">{category.outOfStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Value:</span>
                    <span className="font-medium">{currency.format(category.avgValue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Low Stock Items</h3>
          
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category} • {item.supplier}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Current: {item.current}</div>
                      <div className="text-sm text-gray-600">Minimum: {item.minimum}</div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                      {item.urgency.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">All Good!</h4>
              <p className="text-gray-500">No low stock items at this time.</p>
            </div>
          )}
        </div>

        {/* Top Value Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Value Items</h3>
          
          <div className="space-y-3">
            {topValueItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-gray-900">{currency.format(item.value)}</div>
                  <div className="text-sm text-gray-600">{item.quantity} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default InventorySummaryPage;

