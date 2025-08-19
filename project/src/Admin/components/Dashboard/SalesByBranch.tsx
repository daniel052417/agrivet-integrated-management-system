import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type BranchRow = {
  id: string;
  name: string;
};

type TxRow = {
  id: string;
  branch_id: string;
  customer_id: string | null;
  total_amount: number;
  transaction_date: string;
};

type BranchMetric = {
  id: string;
  name: string;
  sales: number;
  orders: number;
  customers: number;
  growthPct: number;
  isPositive: boolean;
  color: string;
};

const COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const SalesByBranch: React.FC = () => {
  const [metrics, setMetrics] = useState<BranchMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const totalSales = useMemo(() => metrics.reduce((sum, b) => sum + b.sales, 0), [metrics]);

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

        const [{ data: branchRows, error: branchErr }, { data: txRows, error: txErr }] = await Promise.all([
          supabase.from('branches').select('id, name') as any,
          supabase
            .from('sales_transactions')
            .select('id, branch_id, customer_id, total_amount, transaction_date')
            .gte('transaction_date', startPrev.toISOString()) as any,
        ]);

        if (branchErr) throw branchErr;
        if (txErr) throw txErr;

        const branchMap = new Map<string, BranchRow>();
        (branchRows as BranchRow[] | null)?.forEach((b) => branchMap.set(b.id, b));

        const currentAgg = new Map<string, { sales: number; orders: number; customers: Set<string> }>();
        const prevAgg = new Map<string, { sales: number }>();

        (txRows as TxRow[] | null)?.forEach((t) => {
          const isCurrent = new Date(t.transaction_date).getTime() >= startCurrent.getTime();
          const key = t.branch_id || 'unknown';
          if (isCurrent) {
            const prev = currentAgg.get(key) || { sales: 0, orders: 0, customers: new Set<string>() };
            prev.sales += Number(t.total_amount || 0);
            prev.orders += 1;
            if (t.customer_id) prev.customers.add(String(t.customer_id));
            currentAgg.set(key, prev);
          } else {
            const prev = prevAgg.get(key) || { sales: 0 };
            prev.sales += Number(t.total_amount || 0);
            prevAgg.set(key, prev);
          }
        });

        const list: BranchMetric[] = Array.from(branchMap.values()).map((b, idx) => {
          const cur = currentAgg.get(b.id) || { sales: 0, orders: 0, customers: new Set<string>() };
          const prev = prevAgg.get(b.id) || { sales: 0 };
          const growth = prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : 0;
          return {
            id: b.id,
            name: b.name,
            sales: cur.sales,
            orders: cur.orders,
            customers: cur.customers.size,
            growthPct: growth,
            isPositive: growth >= 0,
            color: COLORS[idx % COLORS.length],
          };
        })
        .sort((a, b) => b.sales - a.sales);

        setMetrics(list);
      } catch (e: any) {
        console.error('Failed to load sales by branch', e);
        setError('Failed to load sales by branch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales by Branch</h3>
        <div className="text-sm text-gray-600">
          Total: {formatCurrencyPHP(totalSales)}
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {metrics.map((branch) => (
            <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${branch.color}`}></div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{branch.name}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{branch.orders} orders</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{branch.customers} customers</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrencyPHP(branch.sales)}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${branch.isPositive ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                    <span className={`text-xs ${branch.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {`${branch.growthPct >= 0 ? '+' : ''}${branch.growthPct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${branch.color}`}
                  style={{ width: `${totalSales > 0 ? (branch.sales / totalSales) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Best Performing</p>
            <p className="text-lg font-bold text-green-600">{metrics[0]?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Growth Leader</p>
            <p className="text-lg font-bold text-blue-600">{metrics.length ? `${metrics.slice().sort((a,b)=> b.growthPct - a.growthPct)[0].growthPct.toFixed(1)}%` : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByBranch;