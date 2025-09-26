import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Download, TrendingUp, TrendingDown, Package, BarChart3, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ProductSalesReport: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  type ProductRow = { 
    id: string; 
    sku: string; 
    name: string; 
    category_id: string | null; 
  };
  type VariantRow = {
    id: string;
    product_id: string;
    name: string;
    price: number;
  };
  type CategoryRow = { id: string; name: string };
  type ItemRow = { 
    product_id: string; 
    quantity: number; 
    unit_price: number; 
    total_price: number; 
    created_at: string; 
  };

  type ProductMetric = {
    id: string;
    name: string;
    categoryId: string | null;
    category: string;
    sku: string;
    unitPrice: number;
    costPrice: number;
    stockQuantity: number;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    profitMargin: number;
    avgDailySales: number;
    growthRate: number;
    rank: number;
  };

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [productMetrics, setProductMetrics] = useState<ProductMetric[]>([]);

  useEffect(() => {
    loadProductSalesData();
  }, [selectedPeriod]);

  const loadProductSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'this-week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case 'this-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Load products (without pricing info - that's in product_variants)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, sku, name, category_id')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Load product variants for pricing information
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, product_id, name, price, price')
        .eq('is_active', true);

      if (variantsError) throw variantsError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Load transaction items for the selected period (using correct table name)
      const { data: itemsData, error: itemsError } = await supabase
        .from('transaction_items')
        .select('product_id, quantity, unit_price, total_price, created_at')
        .gte('created_at', startDate.toISOString());

      if (itemsError) throw itemsError;

      setProducts(productsData || []);
      setVariants(variantsData || []);
      setCategories(categoriesData || []);
      setItems(itemsData || []);

      // Calculate product metrics
      const metrics: ProductMetric[] = productsData?.map(product => {
        const productItems = itemsData?.filter(item => item.product_id === product.id) || [];
        const productVariants = variantsData?.filter(v => v.product_id === product.id) || [];
        const category = categoriesData?.find(c => c.id === product.category_id);
        
        // Get average pricing from variants (or use first variant if available)
        const avgPrice = productVariants.length > 0 
          ? productVariants.reduce((sum, v) => sum + v.price, 0) / productVariants.length 
          : 0;
        const avgCostPrice = productVariants.length > 0 
          ? productVariants.reduce((sum, v) => sum + (v.price || 0), 0) / productVariants.length 
          : 0;
        
        const totalSold = productItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = productItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        const totalCost = productItems.reduce((sum, item) => sum + (item.quantity * avgCostPrice), 0);
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        // Calculate average daily sales (mock calculation)
        const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const avgDailySales = totalSold / daysInPeriod;
        
        // Mock growth rate
        const growthRate = Math.random() * 20 - 10; // Random between -10% and +10%

        return {
          id: product.id,
          name: product.name,
          categoryId: product.category_id,
          category: category?.name || 'Uncategorized',
          sku: product.sku,
          unitPrice: avgPrice,
          costPrice: avgCostPrice,
          stockQuantity: 0, // Stock quantity is in inventory table, not products
          totalSold,
          totalRevenue,
          totalProfit,
          profitMargin,
          avgDailySales,
          growthRate,
          rank: 0 // Will be set after sorting
        };
      }) || [];

      // Sort by total revenue and assign ranks
      metrics.sort((a, b) => b.totalRevenue - a.totalRevenue);
      metrics.forEach((metric, index) => {
        metric.rank = index + 1;
      });

      setProductMetrics(metrics);
    } catch (err: any) {
      console.error('Error loading product sales data:', err);
      setError(err.message || 'Failed to load product sales data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMetrics = useMemo(() => {
    return productMetrics.filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           metric.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           metric.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || metric.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [productMetrics, searchTerm, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const getGrowthIcon = (growthRate: number) => {
    return growthRate > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (growthRate: number) => {
    return growthRate > 0 ? 'text-green-600' : 'text-red-600';
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Product Sales Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadProductSalesData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="product-sales-report">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Sales Report</h1>
          <p className="text-gray-600">Analyze product performance and sales metrics</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{productMetrics.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(productMetrics.reduce((sum, p) => sum + p.totalRevenue, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(productMetrics.reduce((sum, p) => sum + p.totalProfit, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Units Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {productMetrics.reduce((sum, p) => sum + p.totalSold, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMetrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{metric.rank}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                        <div className="text-sm text-gray-500">SKU: {metric.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.totalSold.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(metric.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(metric.totalProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.profitMargin.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {getGrowthIcon(metric.growthRate)}
                        <span className={`text-sm ${getGrowthColor(metric.growthRate)}`}>
                          {metric.growthRate > 0 ? '+' : ''}{metric.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredMetrics.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Sales Data</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'No products match your filter criteria.'
                : 'No product sales data found for the selected period.'
              }
            </p>
          </div>
        )}
      </div>
  );
};

export default ProductSalesReport;

