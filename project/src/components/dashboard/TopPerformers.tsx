import React, { useEffect, useMemo, useState } from 'react';
import { User, Trophy, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type StaffRow = { id: string; first_name: string; last_name: string; position: string | null; role: string | null };
type TxRow = { staff_id: string | null; total_amount: number; transaction_date: string };

type Performer = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  totalSales: number;
  orderCount: number;
  badge: 'gold' | 'silver' | 'bronze' | 'none';
};

const TopPerformers: React.FC = () => {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch staff data
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, position, role')
          .eq('is_active', true);

        if (staffError) throw staffError;

        // Fetch sales transactions from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: txData, error: txError } = await supabase
          .from('sales_transactions')
          .select('created_by_user_id, total_amount, transaction_date')
          .gte('transaction_date', thirtyDaysAgo.toISOString())
          .eq('status', 'completed');

        if (txError) throw txError;

        setStaff(staffData || []);
        setTransactions(txData || []);
      } catch (err) {
        console.error('Error fetching top performers data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const performers = useMemo((): Performer[] => {
    if (!staff.length || !transactions.length) return [];

    // Group transactions by staff member
    const staffSales = new Map<string, { totalSales: number; orderCount: number }>();
    
    transactions.forEach(tx => {
      if (tx.created_by_user_id) {
        const current = staffSales.get(tx.created_by_user_id) || { totalSales: 0, orderCount: 0 };
        current.totalSales += tx.total_amount || 0;
        current.orderCount += 1;
        staffSales.set(tx.created_by_user_id, current);
      }
    });

    // Create performer objects
    const performers: Performer[] = staff
      .map(s => {
        const sales = staffSales.get(s.id) || { totalSales: 0, orderCount: 0 };
        return {
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          position: s.position,
          totalSales: sales.totalSales,
          orderCount: sales.orderCount,
          badge: 'none' as const
        };
      })
      .filter(p => p.totalSales > 0)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map((p, index) => ({
        ...p,
        badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'none'
      }));

    return performers;
  }, [staff, transactions]);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'gold':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'silver':
        return <Award className="w-4 h-4 text-gray-400" />;
      case 'bronze':
        return <Award className="w-4 h-4 text-orange-600" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Trophy className="w-4 h-4" />
          <span>Last 30 days</span>
        </div>
      </div>

      <div className="space-y-4">
        {performers.map((performer, index) => (
          <div key={performer.id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {getBadgeIcon(performer.badge)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {performer.first_name} {performer.last_name}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  #{index + 1}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {performer.position || 'Staff'} • {performer.orderCount} orders
              </p>
            </div>
            
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">
                ₱{performer.totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {((performer.totalSales / Math.max(...performers.map(p => p.totalSales), 1)) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {performers.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-500 text-sm">No performance data available</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TopPerformers;