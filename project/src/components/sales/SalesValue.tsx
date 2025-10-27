import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, BarChart3, PieChart, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetric[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProd[]>([]);

  useEffect(() => {
    loadSalesValueData();
  }, [selectedPeriod]);

  const loadSalesValueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Load transactions (only completed ones)
      const { data: transactions, error: transactionsError } = await supabase
        .from('sales_transactions')
        .select('id, total_amount, transaction_date, payment_status')
        .gte('transaction_date', startDate.toISOString())
        .eq('payment_status', 'completed')
        .order('transaction_date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Load transaction items
      const transactionIds = transactions?.map(t => t.id) || [];
      const { data: items, error: itemsError } = transactionIds.length > 0
        ? await supabase
            .from('transaction_items')
            .select('product_id, quantity, unit_price, total_price, created_at')
            .in('transaction_id', transactionIds)
        : { data: [], error: null };

      if (itemsError) throw itemsError;

      // Load products and categories
      const productIds = items?.map(i => i.product_id) || [];
      const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
        productIds.length > 0
          ? supabase
              .from('products')
              .select('id, name, category_id, sku')
              .in('id', productIds)
              .eq('is_active', true)
          : { data: [], error: null },
        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
      ]);

      if (productsError) throw productsError;
      if (categoriesError) throw categoriesError;

      // Load product units for cost data
      const { data: units, error: unitsError } = productIds.length > 0
        ? await supabase
            .from('product_units')
            .select('id, product_id, price_per_unit, unit_name')
            .in('product_id', productIds)
            .eq('is_sellable', true)
        : { data: [], error: null };

      if (unitsError) throw unitsError;

      // Create unit lookup by product_id
      const unitByProductId = new Map<string, any>();
      units?.forEach(u => {
        if (!unitByProductId.has(u.product_id)) {
          unitByProductId.set(u.product_id, u);
        }
      });

      // Calculate metrics
      const totalSales = transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const totalOrders = transactions?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      const dailyTarget = 10000; // Mock target
      const targetAchievement = (totalSales / dailyTarget) * 100;

      setMetrics([
        {
          title: 'Total Sales',
          value: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalSales),
          change: '+12.5%',
          isPositive: true,
          period: 'vs last period',
          color: 'green',
          icon: 'sales'
        },
        {
          title: 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: '+8.2%',
          isPositive: true,
          period: 'vs last period',
          color: 'blue',
          icon: 'order'
        },
        {
          title: 'Average Order Value',
          value: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(avgOrderValue),
          change: '+5.1%',
          isPositive: true,
          period: 'vs last period',
          color: 'purple',
          icon: 'daily'
        },
        {
          title: 'Target Achievement',
          value: `${targetAchievement.toFixed(1)}%`,
          change: targetAchievement >= 100 ? 'Target Met' : 'In Progress',
          isPositive: targetAchievement >= 100,
          period: 'of daily target',
          color: targetAchievement >= 100 ? 'green' : 'yellow',
          icon: 'target'
        }
      ]);

      // Calculate category metrics
      const categorySales = new Map<string, { name: string; sales: number; count: number }>();
      
      items?.forEach(item => {
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          const category = categories?.find(c => c.id === product.category_id);
          const categoryName = category?.name || 'Uncategorized';
          const existing = categorySales.get(categoryName) || { name: categoryName, sales: 0, count: 0 };
          existing.sales += item.total_price || 0;
          existing.count += item.quantity;
          categorySales.set(categoryName, existing);
        }
      });

      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-pink-500'];
      const categoryMetricsData = Array.from(categorySales.entries()).map(([category, data], index) => ({
        category: data.name,
        value: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(data.sales),
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
        growth: '+15.2%', // Mock growth
        color: colors[index % colors.length]
      })).sort((a, b) => b.percentage - a.percentage);

      setCategoryMetrics(categoryMetricsData);

      // Calculate trends (mock data for now)
      const trendData: Trend[] = [
        { month: 'Jan', sales: 45000, target: 50000, orders: 120 },
        { month: 'Feb', sales: 52000, target: 50000, orders: 135 },
        { month: 'Mar', sales: 48000, target: 50000, orders: 128 },
        { month: 'Apr', sales: 55000, target: 50000, orders: 142 },
        { month: 'May', sales: 58000, target: 50000, orders: 150 },
        { month: 'Jun', sales: 62000, target: 50000, orders: 165 }
      ];

      setTrends(trendData);

      // Calculate top products
      const productSales = new Map<string, { name: string; sales: number; units: number; cost: number }>();
      
      items?.forEach(item => {
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          const existing = productSales.get(product.name) || { name: product.name, sales: 0, units: 0, cost: 0 };
          existing.sales += item.total_price || 0;
          existing.units += item.quantity;
          
          // Use unit cost for margin calculation
          const unit = unitByProductId.get(product.id);
          const unitCost = unit ? (unit.price_per_unit || 0) : 0;
          existing.cost += item.quantity * unitCost;
          productSales.set(product.name, existing);
        }
      });

      const topProductsData = Array.from(productSales.values())
        .map(product => ({
          name: product.name,
          sales: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(product.sales),
          units: product.units,
          margin: product.sales > 0 ? `${(((product.sales - product.cost) / product.sales) * 100).toFixed(1)}%` : '0%'
        }))
        .sort((a, b) => parseFloat(b.sales.replace(/[^0-9.-]+/g, '')) - parseFloat(a.sales.replace(/[^0-9.-]+/g, '')))
        .slice(0, 5);

      setTopProducts(topProductsData);

    } catch (err: any) {
      console.error('Error loading sales value data:', err);
      setError(err.message || 'Failed to load sales value data');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'sales':
        return <DollarSign className="w-6 h-6" />;
      case 'order':
        return <BarChart3 className="w-6 h-6" />;
      case 'daily':
        return <TrendingUp className="w-6 h-6" />;
      case 'target':
        return <Target className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sales Value Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadSalesValueData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sales-value">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Value Analysis</h1>
          <p className="text-gray-600">Comprehensive sales value metrics and insights</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getColorClass(metric.color)}`}>
                  {getIcon(metric.icon)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center mt-1">
                    {metric.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm ml-1 ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{metric.period}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sales Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trends</h3>
          <div className="h-64 flex items-end space-x-2">
            {trends.map((trend, index) => {
              const maxSales = Math.max(...trends.map(t => t.sales));
              const height = (trend.sales / maxSales) * 200;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t" style={{ height: `${height}px` }}>
                    <div className="w-full bg-blue-500 rounded-t"></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    <div className="font-medium">{trend.month}</div>
                    <div>₱{(trend.sales / 1000).toFixed(0)}k</div>
                    <div className="text-gray-500">{trend.orders} orders</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
            <div className="space-y-4">
              {categoryMetrics.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{category.value}</div>
                    <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.units} units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{product.sales}</div>
                    <div className="text-xs text-gray-500">{product.margin} margin</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
  );
};

export default SalesValue;

