import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type Activity = {
  id: string;
  time: string; // ISO string
  type: 'sale' | 'stock' | 'staff' | 'alert';
  title: string;
  description: string;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(1, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH === 1 ? '' : 's'} ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD === 1 ? '' : 's'} ago`;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const [salesRes, movementsRes, staffRes, lowStockRes] = await Promise.all([
          supabase
            .from('sales_transactions')
            .select('id, transaction_number, total_amount, transaction_date')
            .order('transaction_date', { ascending: false })
            .limit(5),
          supabase
            .from('inventory_movements')
            .select('id, product_id, movement_type, quantity, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('staff')
            .select('id, first_name, last_name, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('products')
            .select('id, name, stock_quantity, minimum_stock, updated_at')
            .order('updated_at', { ascending: false })
            .limit(10),
        ]);

        if (salesRes.error) throw salesRes.error;
        if (movementsRes.error) throw movementsRes.error;
        if (staffRes.error) throw staffRes.error;
        if (lowStockRes.error) throw lowStockRes.error;

        const sales: Activity[] = (salesRes.data || []).map((s: any) => ({
          id: `sale-${s.id}`,
          time: s.transaction_date,
          type: 'sale',
          title: 'New sale recorded',
          description: `${s.transaction_number ? `Order #${s.transaction_number} - ` : ''}${currencyFormatter.format(Number(s.total_amount || 0))}`,
        }));

        // For movements, optionally enrich with product name
        const movementProductIds = Array.from(new Set((movementsRes.data || []).map((m: any) => m.product_id).filter(Boolean)));
        let productMap = new Map<string, string>();
        if (movementProductIds.length) {
          const { data: prodRows, error: prodErr } = await supabase
            .from('products')
            .select('id, name')
            .in('id', movementProductIds);
          if (prodErr) throw prodErr;
          (prodRows || []).forEach((p: any) => productMap.set(p.id, p.name));
        }
        const movements: Activity[] = (movementsRes.data || []).map((m: any) => ({
          id: `move-${m.id}`,
          time: m.created_at,
          type: 'stock',
          title: 'Stock updated',
          description: `${productMap.get(m.product_id) || 'Product'} • ${String(m.movement_type).toLowerCase()} ${m.quantity}`,
        }));

        const staffs: Activity[] = (staffRes.data || []).map((p: any) => ({
          id: `staff-${p.id}`,
          time: p.created_at,
          type: 'staff',
          title: 'New staff member',
          description: `${p.first_name} ${p.last_name}`,
        }));

        const lowStock: Activity[] = (lowStockRes.data || [])
          .filter((p: any) => {
            const qty = Number(p.stock_quantity || 0);
            const min = Number(p.minimum_stock || 0);
            return min > 0 && qty > 0 && qty <= min;
          })
          .slice(0, 5)
          .map((p: any) => ({
            id: `alert-${p.id}`,
            time: p.updated_at,
            type: 'alert',
            title: 'Low stock alert',
            description: `${p.name} running low`,
          }));

        const combined = [...sales, ...movements, ...staffs, ...lowStock]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10);

        setActivities(combined);
      } catch (e: any) {
        console.error('Failed to load recent activity', e);
        setError('Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currencyFormatter]);

  const colorByType: Record<Activity['type'], string> = {
    sale: 'text-green-600 bg-green-50',
    stock: 'text-blue-600 bg-blue-50',
    staff: 'text-purple-600 bg-purple-50',
    alert: 'text-orange-600 bg-orange-50',
  };

  const iconByType: Record<Activity['type'], React.ElementType> = {
    sale: ShoppingCart,
    stock: Package,
    staff: Users,
    alert: AlertTriangle,
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>

      {loading && (
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = iconByType[activity.type];
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${colorByType[activity.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.time)}</p>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">No recent activity</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;