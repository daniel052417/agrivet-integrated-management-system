import React, { useEffect, useMemo, useState } from 'react';
import { User, Trophy, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type StaffRow = { id: string; first_name: string; last_name: string; position: string | null; role: string | null };
type TxRow = { staff_id: string | null; total_amount: number; transaction_date: string };

type Performer = {
  id: string;
  name: string;
  role: string;
  sales: number;
  orders: number;
  growthPct: number;
  badge: 'gold' | 'silver' | 'bronze' | 'none';
};

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'gold': return 'text-yellow-600 bg-yellow-100';
    case 'silver': return 'text-gray-600 bg-gray-100';
    case 'bronze': return 'text-orange-600 bg-orange-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getBadgeIcon = (badge: string) => {
  switch (badge) {
    case 'gold': return Trophy;
    case 'silver': return Award;
    case 'bronze': return Award;
    default: return Award;
  }
};

const TopPerformers: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const teamAvg = useMemo(() => {
    if (!performers.length) return 0;
    const avg = performers.reduce((s, p) => s + p.sales, 0) / performers.length;
    return avg;
  }, [performers]);

  const avgGrowth = useMemo(() => {
    if (!performers.length) return 0;
    const avg = performers.reduce((s, p) => s + p.growthPct, 0) / performers.length;
    return avg;
  }, [performers]);

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

        const { data: txRows, error: txErr } = await supabase
          .from('sales_transactions')
          .select('staff_id, total_amount, transaction_date')
          .gte('transaction_date', startPrev.toISOString());
        if (txErr) throw txErr;

        const staffIds = Array.from(new Set((txRows as TxRow[] | null)?.map(r => r.staff_id).filter(Boolean) as string[]));

        let staffMap = new Map<string, StaffRow>();
        if (staffIds.length) {
          const { data: staffRows, error: staffErr } = await supabase
            .from('staff')
            .select('id, first_name, last_name, position, role')
            .in('id', staffIds);
          if (staffErr) throw staffErr;
          (staffRows as StaffRow[] | null)?.forEach(s => staffMap.set(s.id, s));
        }

        const currentAgg = new Map<string, { sales: number; orders: number }>();
        const prevAgg = new Map<string, { sales: number }>();

        (txRows as TxRow[] | null)?.forEach(t => {
          if (!t.staff_id) return;
          const isCurrent = new Date(t.transaction_date).getTime() >= startCurrent.getTime();
          if (isCurrent) {
            const prev = currentAgg.get(t.staff_id) || { sales: 0, orders: 0 };
            prev.sales += Number(t.total_amount || 0);
            prev.orders += 1;
            currentAgg.set(t.staff_id, prev);
          } else {
            const prev = prevAgg.get(t.staff_id) || { sales: 0 };
            prev.sales += Number(t.total_amount || 0);
            prevAgg.set(t.staff_id, prev);
          }
        });

        const list: Performer[] = Array.from(currentAgg.entries()).map(([staffId, cur]) => {
          const staff = staffMap.get(staffId);
          const prev = prevAgg.get(staffId) || { sales: 0 };
          const growth = prev.sales > 0 ? ((cur.sales - prev.sales) / prev.sales) * 100 : 0;
          return {
            id: staffId,
            name: staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown Staff',
            role: staff?.position || staff?.role || 'Staff',
            sales: cur.sales,
            orders: cur.orders,
            growthPct: growth,
            badge: 'none' as 'none',
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3);

        // Assign badges to top 3
        if (list[0]) list[0].badge = 'gold';
        if (list[1]) list[1].badge = 'silver';
        if (list[2]) list[2].badge = 'bronze';

        setPerformers(list);
      } catch (e: any) {
        console.error('Failed to load top performers', e);
        setError('Failed to load top performers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Top Performers</h3>
        <div className="text-sm text-gray-600">This Month</div>
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
          {performers.map((performer) => {
            const BadgeIcon = getBadgeIcon(performer.badge);
            return (
              <div key={performer.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${getBadgeColor(performer.badge)}`}>
                    <BadgeIcon className="w-3 h-3" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                      <p className="text-xs text-gray-500">{performer.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrencyPHP(performer.sales)}</p>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className={`w-3 h-3 ${performer.growthPct >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                        <span className={`text-xs ${performer.growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{`${performer.growthPct >= 0 ? '+' : ''}${performer.growthPct.toFixed(1)}%`}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{performer.orders} orders</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {performers.length === 0 && (
            <div className="p-3 text-sm text-gray-500 bg-gray-50 rounded-lg text-center">No performers for this period</div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Team Average</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrencyPHP(teamAvg)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Performance</p>
            <p className="text-lg font-bold ${avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">{`${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;