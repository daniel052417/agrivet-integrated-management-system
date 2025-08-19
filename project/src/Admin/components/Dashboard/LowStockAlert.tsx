import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type ProductRow = {
  id: string;
  name: string;
  stock_quantity: number;
  minimum_stock: number | null;
  category_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type LowStockItem = {
  name: string;
  stock: number;
  minimum: number;
  category: string;
};

const LowStockAlert: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStock = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, stock_quantity, minimum_stock, category_id') as any,
          supabase
            .from('categories')
            .select('id, name') as any,
        ]);

        if (productsError) throw productsError;
        if (categoriesError) throw categoriesError;

        const categoryIdToName = new Map<string, string>();
        (categories as CategoryRow[] | null)?.forEach((c) => categoryIdToName.set(c.id, c.name));

        const lowStock: LowStockItem[] = (products as ProductRow[] | null)
          ?.filter((p) => {
            const min = Number(p.minimum_stock ?? 0);
            const qty = Number(p.stock_quantity ?? 0);
            // low stock: >0 and <= minimum
            return min > 0 && qty > 0 && qty <= min;
          })
          .map((p) => ({
            name: p.name,
            stock: Number(p.stock_quantity ?? 0),
            minimum: Number(p.minimum_stock ?? 0),
            category: categoryIdToName.get(p.category_id || '') || 'Uncategorized',
          }))
          // Sort by how far below/near minimum (ascending difference)
          .sort((a, b) => (a.stock - a.minimum) - (b.stock - b.minimum))
          // Limit to top 8 alerts
          .slice(0, 8) || [];

        setItems(lowStock);
      } catch (err: any) {
        console.error('Failed to load low stock alerts', err);
        setError('Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h3>
        <div className="flex items-center space-x-1 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">{items.length}</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
          <div className="h-12 bg-orange-50/70 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">{item.stock}</p>
                <p className="text-xs text-gray-500">Min: {item.minimum}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">No low stock items 🎉</div>
          )}
        </div>
      )}

      <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
        View All Alerts
      </button>
    </div>
  );
};

export default LowStockAlert;