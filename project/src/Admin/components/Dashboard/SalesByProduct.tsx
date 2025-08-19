import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

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
  const [metrics, setMetrics] = useState<ProductMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const totalSales = useMemo(() => metrics.reduce((sum, p) => sum + p.sales, 0), [metrics]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const startCurrent = new Date(now);
        startCurrent.setDate(startCurrent.getDate() - 30);
        startCurrent.setHours(0, 0, 0, 0);
        const startPrev = new Date(startCurrent);
        startPrev.setDate(startCurrent.getDate() - 30);

        const [prodRes, catRes, currentItemsRes, prevItemsRes] = await Promise.all([
          supabase.from('products').select('id, name, category_id'),
          supabase.from('categories').select('id, name'),
          supabase
            .from('transaction_items')
            .select('product_id, quantity, unit_price, discount_amount, line_total, created_at')
            .gte('created_at', startCurrent.toISOString()),
          supabase
            .from('transaction_items')
            .select('product_id, quantity, unit_price, discount_amount, line_total, created_at')
            .gte('created_at', startPrev.toISOString())
            .lt('created_at', startCurrent.toISOString()),
        ]);

        if (prodRes.error) throw prodRes.error;
        if (catRes.error) throw catRes.error;
        if (currentItemsRes.error) throw currentItemsRes.error;
        if (prevItemsRes.error) throw prevItemsRes.error;

        const categoryIdToName = new Map<string, string>();
        (catRes.data as CategoryRow[] | null)?.forEach((c) => categoryIdToName.set(c.id, c.name));

        const productIdToInfo = new Map<string, ProductRow>();
        (prodRes.data as ProductRow[] | null)?.forEach((p) => productIdToInfo.set(p.id, p));

        const aggCurrent = new Map<string, { sales: number; units: number }>();
        (currentItemsRes.data as ItemRow[] | null)?.forEach((i) => {
          const sales = Number(i.line_total ?? i.quantity * (i.unit_price || 0) - (i.discount_amount || 0));
          const prev = aggCurrent.get(i.product_id) || { sales: 0, units: 0 };
          prev.sales += sales;
          prev.units += Number(i.quantity || 0);
          aggCurrent.set(i.product_id, prev);
        });

        const aggPrev = new Map<string, { sales: number }>();
        (prevItemsRes.data as ItemRow[] | null)?.forEach((i) => {
          const sales = Number(i.line_total ?? i.quantity * (i.unit_price || 0) - (i.discount_amount || 0));
          const prev = aggPrev.get(i.product_id) || { sales: 0 };
          prev.sales += sales;
          aggPrev.set(i.product_id, prev);
        });

        const list: ProductMetric[] = Array.from(aggCurrent.entries()).map(([productId, cur], idx) => {
          const info = productIdToInfo.get(productId);
          const prev = aggPrev.get(productId) || { sales: 0 };
          const growth = prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : 0;
          return {
            id: productId,
            name: info?.name || 'Unknown Product',
            category: info?.category_id ? categoryIdToName.get(info.category_id) || 'Uncategorized' : 'Uncategorized',
            sales: cur.sales,
            units: cur.units,
            growthPct: growth,
            isPositive: growth >= 0,
            color: COLORS[idx % COLORS.length],
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

        setMetrics(list);
      } catch (e: any) {
        console.error('Failed to load sales by product', e);
        setError('Failed to load sales by product');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Products</h3>
        <div className="text-sm text-gray-600">
          Total: {formatCurrencyPHP(totalSales)}
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
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {metrics.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                  <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-500">{product.category}</span>
                    <span className="text-xs text-gray-500">{product.units} units</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrencyPHP(product.sales)}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className={`w-3 h-3 ${product.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                  <span className={`text-xs ${product.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {`${product.growthPct >= 0 ? '+' : ''}${product.growthPct.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {metrics.length === 0 && (
            <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">No product sales in the selected period</div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Seller</p>
            <p className="text-xs font-bold text-red-600">{metrics[0]?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Highest Growth</p>
            <p className="text-xs font-bold text-green-600">{metrics.length ? `${metrics.slice().sort((a,b)=> b.growthPct - a.growthPct)[0].growthPct.toFixed(1)}%` : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Top Units</p>
            <p className="text-xs font-bold text-orange-600">{metrics.length ? `${metrics.slice().sort((a,b)=> b.units - a.units)[0].units.toLocaleString()} units` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByProduct;