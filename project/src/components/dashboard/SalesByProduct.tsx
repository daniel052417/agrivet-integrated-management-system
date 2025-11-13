import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ProductRow = { id: string; name: string; category_id: string | null };
type CategoryRow = { id: string; name: string };
type ItemRow = { product_id: string; quantity: number; unit_price: number; discount_amount: number; line_total: number; created_at: string };

type ProductMetric = {
  id: string;
  name: string;
  category: string;
  sales: number;
  units: number;
  growthPct: number;
  isPositive: boolean;
  color: string;
};

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const SalesByProduct: React.FC = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [transactionItems, setTransactionItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      // Load transaction items for the last 30 days with fallback logic
      let itemsData = null;
      let itemsError = null;

      // Try strict filters first
      const { data: strictData, error: strictError } = await supabase
        .from('pos_transaction_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          discount_amount,
          line_total,
          created_at,
          pos_transactions!inner(
            transaction_date,
            transaction_type,
            payment_status,
            status
          )
        `)
        .eq('pos_transactions.transaction_type', 'sale')
        .eq('pos_transactions.payment_status', 'completed')
        .eq('pos_transactions.status', 'active')
        .gte('pos_transactions.transaction_date', startDate.toISOString())
        .lte('pos_transactions.transaction_date', endDate.toISOString());

      if (strictError) {
        console.error('SalesByProduct - Strict filter error:', strictError);
        itemsError = strictError;
      } else if (strictData && strictData.length > 0) {
        itemsData = strictData;
        console.log('SalesByProduct - Using strict filters, found:', strictData.length, 'transaction items');
      } else {
        console.log('SalesByProduct - No data with strict filters, trying fallback...');
        
        // Fallback 1: Remove status filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pos_transaction_items')
          .select(`
            product_id,
            quantity,
            unit_price,
            discount_amount,
            line_total,
            created_at,
            pos_transactions!inner(
              transaction_date,
              transaction_type,
              payment_status,
              status
            )
          `)
          .eq('pos_transactions.transaction_type', 'sale')
          .eq('pos_transactions.payment_status', 'completed')
          .gte('pos_transactions.transaction_date', startDate.toISOString())
          .lte('pos_transactions.transaction_date', endDate.toISOString());

        if (fallbackError) {
          console.error('SalesByProduct - Fallback filter error:', fallbackError);
          itemsError = fallbackError;
        } else if (fallbackData && fallbackData.length > 0) {
          itemsData = fallbackData;
          console.log('SalesByProduct - Using fallback filters, found:', fallbackData.length, 'transaction items');
        } else {
          console.log('SalesByProduct - No data with fallback filters, trying final fallback...');
          
          // Final fallback: Only transaction_type filter
          const { data: finalData, error: finalError } = await supabase
            .from('pos_transaction_items')
            .select(`
              product_id,
              quantity,
              unit_price,
              discount_amount,
              line_total,
              created_at,
              pos_transactions!inner(
                transaction_date,
                transaction_type,
                payment_status,
                status
              )
            `)
            .eq('pos_transactions.transaction_type', 'sale')
            .gte('pos_transactions.transaction_date', startDate.toISOString())
            .lte('pos_transactions.transaction_date', endDate.toISOString());

          if (finalError) {
            console.error('SalesByProduct - Final filter error:', finalError);
            itemsError = finalError;
          } else {
            itemsData = finalData;
            console.log('SalesByProduct - Using final fallback, found:', finalData?.length || 0, 'transaction items');
          }
        }
      }

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setTransactionItems(itemsData || []);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const productMetrics = useMemo(() => {
    const productMap = new Map<string, ProductMetric>();
    
    // Initialize products
    products.forEach((product, index) => {
      const category = categories.find(c => c.id === product.category_id);
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        category: category?.name || 'Uncategorized',
        sales: 0,
        units: 0,
        growthPct: 0,
        isPositive: true,
        color: COLORS[index % COLORS.length]
      });
    });

    // Calculate metrics from transaction items
    transactionItems.forEach(item => {
      const product = productMap.get(item.product_id);
      if (product) {
        product.sales += item.line_total || 0;
        product.units += item.quantity || 0;
      }
    });

    return Array.from(productMap.values())
      .filter(p => p.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }, [products, categories, transactionItems]);

  const totalSales = useMemo(() => 
    productMetrics.reduce((sum, product) => sum + product.sales, 0), 
    [productMetrics]
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sales Data</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>{productMetrics.length} products</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrencyPHP(totalSales)}
          </div>
          <div className="text-sm text-gray-600">Total Product Sales</div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {productMetrics.map((product, index) => {
            const percentage = totalSales > 0 ? (product.sales / totalSales) * 100 : 0;
            
            return (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrencyPHP(product.sales)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${product.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>
                    {product.units.toLocaleString()} units sold
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    product.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{product.growthPct > 0 ? '+' : ''}{product.growthPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {productMetrics.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
            <p className="text-gray-500">No product sales found for the selected period.</p>
          </div>
        )}
      </div>
  );
};

export default SalesByProduct;

