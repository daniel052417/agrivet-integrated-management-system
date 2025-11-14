import React, { useEffect, useState } from 'react';
import { AlertTriangle, Package, TrendingDown, Clock, Truck, Search, Filter, Download, RefreshCw, ShoppingCart, Phone, Mail, Calendar, BarChart3, ChevronDown, ChevronRight, MoreVertical, User, AlertCircle } from 'lucide-react';
import { LowStockItem, InventoryMetrics } from '../../types/inventory';
import { useLowStockData } from '../../hooks/useLowStockData';

// Type definitions
// interface LowStockItem {
//   id: string;
//   name: string;
//   sku: string;
//   category: string;
//   currentStock: number;
//   minimumStock: number;
//   reorderLevel: number;
//   unitPrice: number;
//   totalValue: number;
//   supplier: string;
//   supplierContact: string;
//   supplierEmail: string;
//   lastOrderDate: string;
//   leadTime: string;
//   urgency: 'Critical' | 'High' | 'Medium' | 'Low';
//   daysUntilEmpty: number;
//   avgDailyUsage: number;
//   unitLabel: string;
//   branchId: string;
//   branchName: string;
// }

// interface InventoryMetrics {
//   title: string;
//   value: string;
//   description: string;
//   color: string;
//   bgColor: string;
//   icon: any;
//   period: string;
// }

// // Mock supabase client - replace with your actual supabase import
// const supabase = {
//   from: (table: string) => ({
//     select: (query: string) => ({
//       not: (column: string, operator: string, value: any) => ({
//         then: (callback: any) => callback({ data: [], error: null })
//       })
//     })
//   })
// };

const LowStockAlerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'by-branch'>('all');

  // Data fetching with RBAC filtering - uses hook
  const {
    lowStockItems,
    alertMetrics,
    categoryBreakdown,
    reorderSuggestions,
    branchData,
    availableBranches,
    loading,
    error,
    refreshData
  } = useLowStockData();

  const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

  const filteredItems = lowStockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesBranch = selectedBranch === 'all' || item.branchId === selectedBranch;
    const matchesCriticalFilter = !showOnlyCritical || (item.urgency === 'Critical' || item.urgency === 'High');
    
    return matchesSearch && matchesUrgency && matchesCategory && matchesBranch && matchesCriticalFilter;
  });

  const filteredBranchData = selectedBranch === 'all' 
    ? branchData 
    : branchData.filter(b => b.id === selectedBranch);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const renderItemCard = (item: LowStockItem) => {
    const isExpanded = expandedItems.has(item.id);
    const progressWidth = getStockProgressWidth(item.currentStock, item.minimumStock);
    const progressColor = getStockProgressColor(item.currentStock, item.minimumStock);
    
    return (
      <div 
        key={item.id} 
        className={`p-6 hover:bg-gray-50 transition-colors border-l-4 ${getUrgencyBorderColor(item.urgency)}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getUrgencyIcon(item.urgency)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900 truncate">{item.name}</h4>
                <div className="flex items-center space-x-2 mt-1 flex-wrap">
                  <span className="text-sm text-gray-500">SKU: {item.sku}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(item.urgency)}`}>
                    {item.urgency}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800`}>
                    {item.category}
                  </span>
                  {viewMode === 'all' && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.branchName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Stock Level</span>
                <span className="text-sm text-gray-600">
                  {item.currentStock} / {item.minimumStock} {item.unitLabel}
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
                  {item.daysUntilEmpty > 0 ? `${item.daysUntilEmpty} days left` : 'Out of stock'}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center space-x-2 ml-4">
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
          </div> */}
        </div>

        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Financial</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium">{formatCurrency(item.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Usage:</span>
                    <span className="font-medium">{item.avgDailyUsage} {item.unitLabel}/day</span>
                  </div>
                </div>
              </div>

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
                        <span className="truncate">{item.supplierEmail}</span>
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

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Product Details</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Branch:</span> {item.branchName}
                  </div>
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
                  <div>
                    <span className="font-medium">Unit:</span> {item.unitLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Low Stock Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h2>
          <p className="text-gray-600 mt-1">Monitor and manage inventory items that need immediate attention by branch</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                viewMode === 'all' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Items
            </button>
            <button 
              onClick={() => setViewMode('by-branch')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                viewMode === 'by-branch' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              By Branch
            </button>
          </div>
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
          <button 
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              onClick={() => isClickable && setSelectedUrgency(urgencyLevel)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Alerts by Category</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No categories with low stock</p>
            ) : (
              categoryBreakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCategory(category.category)}>
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
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Reorder Suggestions</h3>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {reorderSuggestions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reorder suggestions available</p>
            ) : (
              reorderSuggestions.map((suggestion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{suggestion.supplier}</h4>
                      <p className="text-xs text-gray-500">{suggestion.items} items • {currency.format(suggestion.totalValue)}</p>
                    </div>
                    {/* <button className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                      <ShoppingCart className="w-3 h-3" />
                      <span>Reorder</span>
                    </button> */}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{suggestion.contact}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{suggestion.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Lead: {suggestion.leadTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Last: {suggestion.lastOrder}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Filters & Search</h3>
          <div className="text-sm text-gray-500">
            Showing {viewMode === 'all' ? filteredItems.length : filteredBranchData.reduce((sum, b) => sum + b.items.filter(item => {
              const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   item.category.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
              const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
              const matchesCriticalFilter = !showOnlyCritical || (item.urgency === 'Critical' || item.urgency === 'High');
              return matchesSearch && matchesUrgency && matchesCategory && matchesCriticalFilter;
            }).length, 0)} of {lowStockItems.length} items
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Branches ({lowStockItems.length})</option>
            {availableBranches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({lowStockItems.filter(i => i.branchId === branch.id).length})
              </option>
            ))}
          </select>

          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Urgency Levels ({lowStockItems.length})</option>
            <option value="Critical">Critical ({lowStockItems.filter(i => i.urgency === 'Critical').length})</option>
            <option value="High">High ({lowStockItems.filter(i => i.urgency === 'High').length})</option>
            <option value="Medium">Medium ({lowStockItems.filter(i => i.urgency === 'Medium').length})</option>
            <option value="Low">Low ({lowStockItems.filter(i => i.urgency === 'Low').length})</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Array.from(new Set(lowStockItems.map(i => i.category))).map(category => (
              <option key={category} value={category}>
                {category} ({lowStockItems.filter(i => i.category === category).length})
              </option>
            ))}
          </select>

          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedUrgency('all');
              setSelectedCategory('all');
              setSelectedBranch('all');
              setShowOnlyCritical(false);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {viewMode === 'all' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Low Stock Items ({filteredItems.length})
              </h3>
              <div className="flex items-center space-x-4">
                {/* <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Auto-refresh:</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Live</span>
                </div>
                {filteredItems.length > 0 && (
                  <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Bulk Reorder All</span>
                  </button>
                )} */}
              </div>
            </div>
          </div>
        
          <div className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items found</h3>
                <p className="text-gray-500">All inventory levels are within acceptable ranges or no items match your filters.</p>
              </div>
            ) : (
              filteredItems.map((item) => renderItemCard(item))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBranchData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items found</h3>
              <p className="text-gray-500">All inventory levels are within acceptable ranges or no items match your filters.</p>
            </div>
          ) : (
            filteredBranchData.map((branch) => {
              const branchFilteredItems = branch.items.filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     item.category.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
                const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                const matchesCriticalFilter = !showOnlyCritical || (item.urgency === 'Critical' || item.urgency === 'High');
                
                return matchesSearch && matchesUrgency && matchesCategory && matchesCriticalFilter;
              });

              if (branchFilteredItems.length === 0) return null;

              return (
                <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{branch.name}</h3>
                        <p className="text-sm text-gray-600">
                          {branchFilteredItems.length} items • 
                          <span className="text-red-600 font-medium"> {branchFilteredItems.filter(i => i.urgency === 'Critical').length} Critical</span> • 
                          <span className="text-orange-600 font-medium"> {branchFilteredItems.filter(i => i.urgency === 'High').length} High</span> • 
                          <span className="text-yellow-600 font-medium"> {branchFilteredItems.filter(i => i.urgency === 'Medium').length} Medium</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Value at Risk</p>
                        <p className="text-lg font-bold text-red-600">{currency.format(branchFilteredItems.reduce((sum, item) => sum + item.totalValue, 0))}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {branchFilteredItems.map((item) => renderItemCard(item))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
      </div> */}
    </div>
  );
};

export default LowStockAlerts;