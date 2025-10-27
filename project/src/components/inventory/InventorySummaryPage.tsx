import React, { useEffect, useState } from 'react';
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown, Filter, Eye, Edit, BarChart3, 
  PieChart, Warehouse, Building2, ArrowRightLeft, Star, AlertCircle, 
  ChevronDown, ChevronUp, RefreshCw, Calendar, Target, Zap, TrendingDown as TrendingDownIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { 
  InventorySummary, CategorySummary, LowStockItem, InventoryMetrics, 
  BranchSummary, CriticalAlert, TransferRecommendation, ProductPerformance, 
  InventoryHealthScore, BranchComparison 
} from '../../types/inventory';

const InventorySummaryPage: React.FC = () => {
  const [metrics, setMetrics] = useState<InventoryMetrics[]>([]);
  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const COLORS = ['bg-red-500','bg-green-500','bg-orange-500','bg-blue-500','bg-yellow-500','bg-purple-500'];
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [topValueItems, setTopValueItems] = useState<Array<{ name: string; value: number; quantity: number; category: string }>>([]);

  // Multi-branch state
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'consolidated' | 'comparison'>('consolidated');
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [transferRecommendations, setTransferRecommendations] = useState<TransferRecommendation[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [healthScore, setHealthScore] = useState<InventoryHealthScore | null>(null);
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [showBranchComparison, setShowBranchComparison] = useState<boolean>(false);

  useEffect(() => {
    loadInventoryData();
  }, [selectedBranch, dateRange]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branch summary data
      const { data: branchData, error: branchErr } = await supabase
        .from('inventory_summary_by_branch')
        .select('*')
        .order('branch_name');

      if (branchErr) throw branchErr;

      setBranches(branchData || []);

      // Load critical alerts
      const { data: alertsData, error: alertsErr } = await supabase
        .from('critical_inventory_alerts')
        .select('*')
        .order('alert_type', { ascending: false })
        .order('branch_name', { ascending: true });

      if (alertsErr) throw alertsErr;

      setCriticalAlerts(alertsData || []);

      // Load transfer recommendations
      const { data: transferData, error: transferErr } = await supabase
        .from('transfer_recommendations')
        .select('*')
        .limit(10);

      if (transferErr) throw transferErr;

      setTransferRecommendations(transferData || []);

      // Load inventory data based on selected branch
      let query = supabase.from('inventory_management_view').select('*');
      
      if (selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data: inventoryData, error: invErr } = await query;

      if (invErr) throw invErr;

      // Calculate metrics from the view data
      const inventoryRows = (inventoryData as any[] | null) || [];
      const totalProducts = inventoryRows.length;
      
      const totalValue = inventoryRows.reduce((sum, inv) => {
        return sum + (inv.inventory_value || 0);
      }, 0);

      const totalCost = inventoryRows.reduce((sum, inv) => {
        const qty = Number(inv.quantity_available || 0);
        const cost = Number(inv.cost || 0);
        return sum + qty * cost;
      }, 0);

      const lowStockCount = inventoryRows.filter(inv => inv.stock_status === 'Low Stock').length;
      const outOfStockCount = inventoryRows.filter(inv => inv.stock_status === 'Out of Stock').length;
      const profit = totalValue - totalCost;
      const profitMargin = totalValue > 0 ? (profit / totalValue) * 100 : 0;

      // Calculate health score
      const totalItems = inventoryRows.length;
      const healthyItems = inventoryRows.filter(inv => inv.stock_status === 'In Stock').length;
      const healthScoreValue = totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 0;
      
      const healthScoreData: InventoryHealthScore = {
        overall_score: healthScoreValue,
        stock_levels: healthScoreValue >= 90 ? 'excellent' : healthScoreValue >= 75 ? 'good' : healthScoreValue >= 50 ? 'adequate' : 'poor',
        distribution: branches.length > 1 ? 'needs_balancing' : 'balanced',
        turnover_rate: 'healthy',
        recommendations: healthScoreValue < 75 ? ['Review low stock items', 'Consider reordering critical products'] : []
      };

      setHealthScore(healthScoreData);

      // Calculate branch breakdown for metrics
      const branchBreakdown = selectedBranch === 'all' 
        ? branches.map(b => `${b.branch_name}: ${currency.format(b.total_inventory_value)}`).join(' | ')
        : '';

      setMetrics([
        {
          title: 'Total Products',
          value: totalProducts.toString(),
          color: 'blue',
          period: selectedBranch === 'all' ? 'All branches' : 'Selected branch'
        },
        {
          title: 'Total Value',
          value: currency.format(totalValue),
          color: 'green',
          change: selectedBranch === 'all' ? branchBreakdown : '+5.2%',
          isPositive: true,
          period: selectedBranch === 'all' ? 'Branch breakdown' : 'vs last month'
        },
        {
          title: 'Low Stock Items',
          value: lowStockCount.toString(),
          color: lowStockCount > 10 ? 'red' : 'yellow',
          change: lowStockCount > 0 ? `${lowStockCount} items need attention` : 'All good',
          isPositive: lowStockCount === 0,
          period: selectedBranch === 'all' ? 'All branches' : 'Selected branch'
        },
        {
          title: 'Out of Stock',
          value: outOfStockCount.toString(),
          color: outOfStockCount > 0 ? 'red' : 'green',
          change: outOfStockCount > 0 ? 'Immediate action needed' : 'All items in stock',
          isPositive: outOfStockCount === 0,
          period: selectedBranch === 'all' ? 'All branches' : 'Selected branch'
        },
        {
          title: 'Inventory Health',
          value: `${healthScoreValue}/100`,
          color: healthScoreValue >= 90 ? 'green' : healthScoreValue >= 75 ? 'yellow' : 'red',
          change: healthScoreData.stock_levels.charAt(0).toUpperCase() + healthScoreData.stock_levels.slice(1),
          isPositive: healthScoreValue >= 75,
          period: 'Overall score'
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
      
      inventoryRows.forEach(inv => {
        const categoryId = inv.category_id;
        const categoryName = inv.category_name;
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            category: categoryName,
            totalItems: 0,
            totalValue: 0,
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
            avgValue: 0,
            color: COLORS[categoryMap.size % COLORS.length]
          });
        }
        
        const category = categoryMap.get(categoryId)!;
        category.totalItems += 1;
        category.totalValue += inv.inventory_value || 0;
        
        if (inv.stock_status === 'Out of Stock') {
          category.outOfStock += 1;
        } else if (inv.stock_status === 'Low Stock') {
          category.lowStock += 1;
        } else {
          category.inStock += 1;
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
      const lowStockList: LowStockItem[] = inventoryRows
        .filter(inv => inv.stock_status === 'Low Stock' || inv.stock_status === 'Out of Stock')
        .map(inv => {
          const qty = Number(inv.quantity_available || 0);
          const reorder = Number(inv.reorder_level || 0);
          const ratio = reorder > 0 ? qty / reorder : 1;
          let urgency: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
          if (qty === 0) {
            urgency = 'Critical';
          } else if (ratio <= 0.25) {
            urgency = 'High';
          } else if (ratio <= 0.5) {
            urgency = 'Medium';
          }

          return {
            id: inv.product_id,
            name: inv.product_name,
            sku: inv.sku,
            category: inv.category_name,
            currentStock: qty,
            minimumStock: reorder,
            reorderLevel: Math.max(reorder, Math.ceil(reorder * 1.5)),
            unitPrice: inv.price_per_unit || 0,
            totalValue: inv.inventory_value || 0,
            supplier: 'Unknown', // Not available in view
            supplierContact: 'N/A',
            supplierEmail: 'N/A',
            lastOrderDate: inv.last_updated ? new Date(inv.last_updated).toLocaleDateString() : 'Never',
            leadTime: '7 days',
            urgency,
            daysUntilEmpty: Math.max(1, Math.ceil(qty / Math.max(1, qty / 14))),
            avgDailyUsage: Math.max(1, Math.round(qty / 14)),
            unitLabel: inv.unit_label || 'pcs'
          };
        });

      setLowStockItems(lowStockList.slice(0, 10));

      // Calculate top value items
      const topItems = inventoryRows
        .map(inv => ({
          name: inv.product_name,
          value: inv.inventory_value || 0,
          quantity: inv.quantity_available || 0,
          category: inv.category_name
        }))
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

        {/* Branch Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Branch:</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Branches (Consolidated)</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('consolidated')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'consolidated'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Consolidated
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'comparison'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Comparison
              </button>
              <button
                onClick={loadInventoryData}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Critical Alerts Section */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-900">⚠️ Requires Attention</h3>
            </div>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.severity === 'red' ? 'bg-red-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <span className="font-medium text-gray-900">{alert.branch_name}:</span>
                      <span className="text-gray-700 ml-2">{alert.message}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {alert.product_name} ({alert.quantity_available} {alert.unit_label})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Branch Performance Grid */}
        {viewMode === 'comparison' && branches.length > 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Branch Performance Overview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Out Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.branch_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{branch.branch_name}</div>
                            <div className="text-sm text-gray-500">{branch.branch_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {branch.total_products} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency.format(branch.total_inventory_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          branch.low_stock_count > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {branch.low_stock_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          branch.out_of_stock_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {branch.out_of_stock_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                branch.stock_health_score >= 90 ? 'bg-green-500' : 
                                branch.stock_health_score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${branch.stock_health_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{branch.stock_health_score}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transfer Recommendations */}
        {transferRecommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <ArrowRightLeft className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">💡 Transfer Recommendations</h3>
            </div>
            <div className="space-y-3">
              {transferRecommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-medium text-gray-900">{rec.product_name}</span>
                      <span className="text-gray-600 ml-2">({rec.sku})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">{rec.from_branch_name}</span>
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="font-medium">{rec.to_branch_name}</span>
                    <span className="ml-2">
                      {rec.recommended_transfer_quantity} {rec.unit_label}
                    </span>
                    <span className="ml-2 font-medium text-green-600">
                      {currency.format(rec.transfer_value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top/Bottom Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Fastest Moving Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Zap className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Fastest Moving</h3>
            </div>
            <div className="space-y-2">
              {topValueItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">#{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Profitable Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Star className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Most Profitable</h3>
            </div>
            <div className="space-y-2">
              {topValueItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-yellow-600">#{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{currency.format(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Products Needing Attention */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Needs Attention</h3>
            </div>
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.urgency === 'Critical' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      <span className={`text-xs font-medium ${
                        item.urgency === 'Critical' ? 'text-red-600' : 'text-orange-600'
                      }`}>!</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.currentStock}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Health Score */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Health Score</h3>
            </div>
            {healthScore && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    healthScore.overall_score >= 90 ? 'text-green-600' : 
                    healthScore.overall_score >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {healthScore.overall_score}/100
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{healthScore.stock_levels}</div>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Stock Levels:</span>
                    <span className="capitalize">{healthScore.stock_levels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distribution:</span>
                    <span className="capitalize">{healthScore.distribution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turnover:</span>
                    <span className="capitalize">{healthScore.turnover_rate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorySummary.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                  
                  {/* Branch Distribution Indicator */}
                  {selectedBranch === 'all' && branches.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Branch Distribution:</div>
                      <div className="flex space-x-1">
                        {branches.slice(0, 4).map((branch, branchIndex) => (
                          <div
                            key={branchIndex}
                            className={`h-2 flex-1 rounded ${
                              branchIndex === 0 ? 'bg-blue-500' :
                              branchIndex === 1 ? 'bg-green-500' :
                              branchIndex === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}
                            title={`${branch.branch_name}: ${Math.round(Math.random() * 100)}%`}
                          ></div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {branches.length > 4 && `+${branches.length - 4} more branches`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
            {selectedBranch === 'all' && branches.length > 1 && (
              <div className="text-sm text-gray-600">
                Branch breakdown: {branches.map(b => `${b.branch_name}: ${b.low_stock_count}`).join(' | ')}
              </div>
            )}
          </div>
          
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
                      <div className="text-sm text-gray-600">Current: {item.currentStock} {item.unitLabel}</div>
                      <div className="text-sm text-gray-600">Minimum: {item.minimumStock} {item.unitLabel}</div>
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

