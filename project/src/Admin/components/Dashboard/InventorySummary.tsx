import React, { useEffect, useMemo, useState } from 'react';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type ProductRow = {
  category_id: string;
  stock_quantity: number;
  unit_price: number;
  cost_price: number;
  minimum_stock: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

type CategorySummary = {
  name: string;
  stock: number;
  value: number;
  color: string;
};

const COLORS = ['bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const InventorySummary: React.FC = () => {
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [inStockQuantity, setInStockQuantity] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [outOfStockCount, setOutOfStockCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
          supabase
            .from('products')
            .select('category_id, stock_quantity, unit_price, cost_price, minimum_stock') as any,
          supabase
            .from('categories')
            .select('id, name') as any,
        ]);

        if (productsError) throw productsError;
        if (categoriesError) throw categoriesError;

        const categoryIdToName = new Map<string, string>();
        (categories as CategoryRow[] | null)?.forEach((c) => categoryIdToName.set(c.id, c.name));

        const categoryIdToAgg = new Map<string, { stock: number; value: number }>();

        let inStockQty = 0;
        let lowStock = 0;
        let outOfStock = 0;

        (products as ProductRow[] | null)?.forEach((p) => {
          const quantity = Number(p.stock_quantity || 0);
          const price = Number(p.cost_price ?? p.unit_price ?? 0);
          const categoryId = p.category_id || 'uncategorized';

          // Totals
          if (quantity > 0) inStockQty += quantity;
          if (quantity === 0) {
            outOfStock += 1;
          } else if (p.minimum_stock != null && quantity <= Number(p.minimum_stock)) {
            lowStock += 1;
          }

          // Per-category aggregation
          const prev = categoryIdToAgg.get(categoryId) || { stock: 0, value: 0 };
          prev.stock += quantity;
          prev.value += quantity * price;
          categoryIdToAgg.set(categoryId, prev);
        });

        const summaries: CategorySummary[] = Array.from(categoryIdToAgg.entries())
          .map(([categoryId, agg], idx) => ({
            name: categoryIdToName.get(categoryId) || 'Uncategorized',
            stock: agg.stock,
            value: agg.value,
            color: COLORS[idx % COLORS.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        setCategorySummaries(summaries);
        setInStockQuantity(inStockQty);
        setLowStockCount(lowStock);
        setOutOfStockCount(outOfStock);
      } catch (err: any) {
        console.error('Failed to load inventory summary', err);
        setError('Failed to load inventory summary');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalValue = useMemo(() => categorySummaries.reduce((sum, c) => sum + c.value, 0), [categorySummaries]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Summary</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>Total Value: {formatCurrencyPHP(totalValue)}</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {categorySummaries.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.stock} items</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrencyPHP(category.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{inStockQuantity.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-orange-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{lowStockCount.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{outOfStockCount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;