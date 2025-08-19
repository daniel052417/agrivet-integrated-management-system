import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface MetricCardProps {
  title: string;
  value?: string;
  change?: string;
  isPositive?: boolean;
  color: 'green' | 'blue' | 'orange' | 'purple';
  metricType?: 'todays_sales' | 'products_in_stock' | 'active_orders' | 'low_stock_alerts';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, color, metricType }) => {
  const colorClasses = {
    green: {
      bg: 'bg-white',
      accent: 'bg-green-500',
      text: 'text-green-600',
      lightBg: 'bg-green-50'
    },
    blue: {
      bg: 'bg-white',
      accent: 'bg-blue-500',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50'
    },
    orange: {
      bg: 'bg-white',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50'
    },
    purple: {
      bg: 'bg-white',
      accent: 'bg-purple-500',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50'
    },
  };

  const colors = colorClasses[color];

  const [computedValue, setComputedValue] = useState<string | undefined>(value);
  const [computedChange, setComputedChange] = useState<string | undefined>(change);
  const [computedIsPositive, setComputedIsPositive] = useState<boolean | undefined>(isPositive);
  const [loading, setLoading] = useState<boolean>(Boolean(metricType));
  const [error, setError] = useState<string | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-PH'), []);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }), []);

  useEffect(() => {
    if (!metricType) return;

    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        if (metricType === 'todays_sales') {
          const now = new Date();
          const startOfToday = new Date(now);
          startOfToday.setHours(0, 0, 0, 0);
          const startOfTomorrow = new Date(startOfToday);
          startOfTomorrow.setDate(startOfToday.getDate() + 1);

          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfToday.getDate() - 1);

          const { data: todayRows, error: todayErr } = await supabase
            .from('sales_transactions')
            .select('total_amount, transaction_date')
            .gte('transaction_date', startOfToday.toISOString())
            .lt('transaction_date', startOfTomorrow.toISOString());
          if (todayErr) throw todayErr;

          const { data: yesterdayRows, error: yErr } = await supabase
            .from('sales_transactions')
            .select('total_amount, transaction_date')
            .gte('transaction_date', startOfYesterday.toISOString())
            .lt('transaction_date', startOfToday.toISOString());
          if (yErr) throw yErr;

          const todaySum = (todayRows || []).reduce((sum, r: any) => sum + Number(r.total_amount || 0), 0);
          const yesterdaySum = (yesterdayRows || []).reduce((sum, r: any) => sum + Number(r.total_amount || 0), 0);

          setComputedValue(currencyFormatter.format(todaySum));
          if (yesterdaySum > 0) {
            const delta = ((todaySum - yesterdaySum) / yesterdaySum) * 100;
            const isUp = delta >= 0;
            setComputedIsPositive(isUp);
            setComputedChange(`${isUp ? '+' : ''}${delta.toFixed(1)}%`);
          } else {
            setComputedIsPositive(true);
            setComputedChange('+0.0%');
          }
        }

        if (metricType === 'products_in_stock') {
          const { data, error: err } = await supabase
            .from('products')
            .select('stock_quantity');
          if (err) throw err;
          const totalInStock = (data || []).reduce((sum, r: any) => sum + (Number(r.stock_quantity || 0) > 0 ? Number(r.stock_quantity || 0) : 0), 0);
          setComputedValue(numberFormatter.format(totalInStock));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }

        if (metricType === 'active_orders') {
          const { data, error: err } = await supabase
            .from('sales_transactions')
            .select('id, payment_status');
          if (err) throw err;
          const activeStatuses = new Set(['pending', 'processing']);
          const activeCount = (data || []).filter((r: any) => activeStatuses.has(String(r.payment_status || '').toLowerCase())).length;
          setComputedValue(numberFormatter.format(activeCount));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }

        if (metricType === 'low_stock_alerts') {
          const { data, error: err } = await supabase
            .from('products')
            .select('stock_quantity, minimum_stock');
          if (err) throw err;
          const lowCount = (data || []).filter((r: any) => {
            const qty = Number(r.stock_quantity || 0);
            const min = Number(r.minimum_stock || 0);
            return min > 0 && qty > 0 && qty <= min;
          }).length;
          setComputedValue(numberFormatter.format(lowCount));
          setComputedChange(undefined);
          setComputedIsPositive(undefined);
        }
      } catch (e: any) {
        console.error('Failed to load metric', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [metricType, currencyFormatter, numberFormatter]);

  return (
    <div className={`${colors.bg} rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.lightBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={`w-6 h-6 ${colors.accent} rounded-lg`}></div>
        </div>
        {(computedChange !== undefined && computedIsPositive !== undefined) && (
          <div className="flex items-center space-x-1">
            {computedIsPositive ? (
              <TrendingUp className={`w-4 h-4 ${colors.text}`} />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${computedIsPositive ? colors.text : 'text-red-500'}`}>
              {computedChange}
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="h-6 bg-gray-100 rounded-md animate-pulse w-24" />
        ) : error ? (
          <h3 className="text-sm font-medium text-red-600">{error}</h3>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{computedValue ?? value}</h3>
        )}
      </div>
      <div className={`w-full h-1 ${colors.accent} rounded-full mt-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
    </div>
  );
};

export default MetricCard;