import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, TrendingDown, Clock, Truck, Search, Filter, Download, RefreshCw, ShoppingCart, Phone, Mail, Calendar, BarChart3, ChevronDown, ChevronRight, MoreVertical, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const LowStockAlerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    // Additional fields from inventory schema
    branchName?: string;
    branchCode?: string;
    variantType?: string;
    variantValue?: string;
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
        console.log('🚀 Starting to fetch low stock data...');
        
        // Use the same RPC function as InventoryManagement for consistency
        const { data: inventoryData, error: inventoryError } = await supabase.rpc('get_inventory_with_details', {
          branch_filter: null // Get all branches for low stock alerts
        });
        
        if (inventoryError) throw inventoryError;
        
        console.log('🔍 Raw inventory data for low stock:', inventoryData);
        console.log('📊 Number of inventory records:', inventoryData?.length || 0);

        // Get categories and suppliers for additional info
        const [{ data: categories, error: cErr }, { data: suppliers, error: sErr }] = await Promise.all([
          supabase.from('categories').select('id, name').eq('is_active', true),
          supabase.from('suppliers').select('id, name, email, phone').eq('is_active', true),
        ]);
        
        if (cErr) throw cErr; 
        if (sErr) throw sErr;

        const categoryIdToName = new Map<string, string>();
        (categories || []).forEach((c: any) => categoryIdToName.set(c.id, c.name));
        const supplierIdToInfo = new Map<string, { name: string; email: string; phone: string }>();
        (suppliers || []).forEach((s: any) => supplierIdToInfo.set(s.id, { name: s.name, email: s.email, phone: s.phone }));

        // Filter for low stock items using inventory table data
        const lowItems: LowItem[] = (inventoryData || [])
          .filter((item: any) => {
            const qty = Number(item.quantity_on_hand || 0);
            const reorderLevel = Number(item.reorder_level || 0);
            return reorderLevel > 0 && qty > 0 && qty <= reorderLevel;
          })
          .map((item: any) => {
            const qty = Number(item.quantity_on_hand || 0);
            const reorderLevel = Number(item.reorder_level || 0);
            const price = Number(item.price || 0);
            const ratio = reorderLevel > 0 ? qty / reorderLevel : 1;
            const urgency: LowItem['urgency'] = ratio <= 0.25 ? 'Critical' : ratio <= 0.5 ? 'High' : ratio <= 0.75 ? 'Medium' : 'Low';
            const avgDailyUsage = Math.max(1, Math.round(qty / 14));
            const daysUntilEmpty = Math.max(1, Math.ceil(qty / avgDailyUsage));
            
            // Get supplier info from product (we need to fetch this separately)
            const supplier = { name: '—', email: '—', phone: '—' }; // Will be populated later if needed
            
            return {
              id: item.product_id,
              name: item.product_name,
              sku: item.variant_name, // Using variant name as SKU
              category: categoryIdToName.get(item.category_id || '') || 'Uncategorized',
              currentStock: qty,
              minimumStock: reorderLevel,
              reorderLevel: Math.max(reorderLevel, Math.ceil(reorderLevel * 1.5)),
              unitPrice: price,
              totalValue: qty * price,
              supplier: supplier.name,
              supplierContact: supplier.phone || '—',
              supplierEmail: supplier.email || '—',
              lastOrderDate: item.updated_at || '',
              leadTime: '—',
              urgency,
              daysUntilEmpty,
              avgDailyUsage,
              // Additional fields from inventory schema
              branchName: item.branch_name,
              branchCode: item.branch_code,
              variantType: item.variant_type,
              variantValue: item.variant_value,
            };
          })
          .sort((a: LowItem, b: LowItem) => (a.currentStock/a.minimumStock) - (b.currentStock/b.minimumStock));
        
        console.log('✅ Filtered low stock items:', lowItems.length);
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
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyBorderColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'border-l-red-500';
      case 'High': return 'border-l-orange-500';
      case 'Medium': return 'border-l-yellow-500';
      case 'Low': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'High': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'Medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Low': return <Package className="w-4 h-4 text-blue-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
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
    const matchesCriticalFilter = !showOnlyCritical || (item.urgency === 'Critical' || item.urgency === 'High');
    
    return matchesSearch && matchesUrgency && matchesCategory && matchesCriticalFilter;
  });

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStockProgressWidth = (current: number, minimum: number) => {
    if (minimum === 0) return 0;
    return Math.min((current / minimum) * 100, 100);
  };

  const getStockProgressColor = (current: number, minimum: number) => {
    const ratio = minimum > 0 ? current / minimum : 1;
    if (ratio <= 0.25) return 'bg-red-500';
    if (ratio <= 0.5) return 'bg-orange-500';
    if (ratio <= 0.75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h2>
          <p className="text-gray-600 mt-1">Monitor and manage inventory items that need immediate attention</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowOnlyCritical(!showOnlyCritical)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showOnlyCritical 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Critical Only</span>
            {showOnlyCritical && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {lowStockItems.filter(i => i.urgency === 'Critical' || i.urgency === 'High').length}
              </span>
            )}
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
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
          const urgencyLevel = metric.title.includes('Critical') ? 'Critical' : 
                              metric.title.includes('High') ? 'High' : 
                              metric.title.includes('Medium') ? 'Medium' : 'all';
          const isClickable = urgencyLevel !== 'all';
          
          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
                isClickable ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
              }`}
              onClick={() => isClickable && setSelectedUrgency(urgencyLevel.toLowerCase())}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                  {isClickable && (
                    <p className="text-xs text-gray-500 mt-1">Click to filter</p>
                  )}
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

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
          <div className="text-sm text-gray-500">
            Showing {filteredItems.length} of {lowStockItems.length} items
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products or SKU..."
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
            <option value="all">All Urgency Levels ({lowStockItems.length})</option>
            <option value="critical">Critical ({lowStockItems.filter(i => i.urgency === 'Critical').length})</option>
            <option value="high">High ({lowStockItems.filter(i => i.urgency === 'High').length})</option>
            <option value="medium">Medium ({lowStockItems.filter(i => i.urgency === 'Medium').length})</option>
            <option value="low">Low ({lowStockItems.filter(i => i.urgency === 'Low').length})</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(lowStockItems.map(i => i.category))).map(category => (
              <option key={category} value={category.toLowerCase()}>
                {category} ({lowStockItems.filter(i => i.category === category).length})
              </option>
            ))}
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Enhanced Low Stock Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Low Stock Items ({filteredItems.length})
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto-refresh:</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live</span>
              </div>
              {filteredItems.length > 0 && (
                <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Bulk Reorder All</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items found</h3>
              <p className="text-gray-500">All inventory levels are within acceptable ranges.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const progressWidth = getStockProgressWidth(item.currentStock, item.minimumStock);
              const progressColor = getStockProgressColor(item.currentStock, item.minimumStock);
              
              return (
                <div 
                  key={item.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getUrgencyBorderColor(item.urgency)}`}
                >
                  {/* Main Item Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Product Name & SKU */}
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getUrgencyIcon(item.urgency)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-gray-900 truncate">{item.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">SKU: {item.sku}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                              {item.urgency}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                              {item.category}
                            </span>
                          </div>
                          {item.branchName && (
                            <div className="text-xs text-gray-400 mt-1">📍 {item.branchName}</div>
                          )}
                        </div>
                      </div>

                      {/* Stock Level Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Stock Level</span>
                          <span className="text-sm text-gray-600">
                            {item.currentStock} / {item.minimumStock} units
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${progressColor}`}
                            style={{ width: `${progressWidth}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>Min: {item.minimumStock}</span>
                          <span>Reorder: {item.reorderLevel}</span>
                          <span className={`font-medium ${
                            item.daysUntilEmpty <= 3 ? 'text-red-600' :
                            item.daysUntilEmpty <= 7 ? 'text-orange-600' : 'text-yellow-600'
                          }`}>
                            {item.daysUntilEmpty} days left
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        <ShoppingCart className="w-4 h-4" />
                        <span>Reorder</span>
                      </button>
                      <button 
                        onClick={() => toggleExpanded(item.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Financial Info */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Financial</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Unit Price:</span>
                              <span className="font-medium">{currency.format(item.unitPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Value:</span>
                              <span className="font-medium">{currency.format(item.totalValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Daily Usage:</span>
                              <span className="font-medium">{item.avgDailyUsage}/day</span>
                            </div>
                          </div>
                        </div>

                        {/* Supplier Info */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Supplier</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span>{item.supplier === 'Unknown' ? 'Not Assigned' : item.supplier}</span>
                            </div>
                            {item.supplier !== 'Unknown' ? (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span>{item.supplierContact}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span>{item.supplierEmail}</span>
                                </div>
                              </>
                            ) : (
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Assign Supplier
                              </button>
                            )}
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>Last order: {item.lastOrderDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Variant Info */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Product Details</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            {item.variantType && (
                              <div>
                                <span className="font-medium">{item.variantType}:</span> {item.variantValue}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Lead Time:</span> {item.leadTime}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 ${
                                item.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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