import React, { useEffect, useMemo, useState } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Activity,
  Award,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};

type TxRow = {
  id: string;
  branch_id: string;
  customer_id: string | null;
  total_amount: number;
  transaction_date: string;
  created_by_user_id: string | null;
};

type StaffRow = {
  id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  is_active: boolean;
};

type BranchPerformance = {
  id: string;
  name: string;
  address: string | null;
  sales: number;
  orders: number;
  customers: number;
  staff: number;
  growth: number;
  efficiency: number;
  rank: number;
  color: string;
  status: 'excellent' | 'good' | 'average' | 'needs_attention';
};

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500', 'bg-teal-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const BranchPerformance: React.FC = () => {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadBranchData();
  }, [timeRange]);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name, address, phone, is_active')
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      // Load staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, branch_id, first_name, last_name, position, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load transactions with fallback logic
      let transactionsData = null;
      let transactionsError = null;

      // Try strict filters first
      const { data: strictData, error: strictError } = await supabase
        .from('pos_transactions')
        .select('id, branch_id, customer_id, total_amount, transaction_date, cashier_id')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate.toISOString())
        .order('transaction_date', { ascending: false });

      if (strictError) {
        console.error('Strict filter error:', strictError);
        transactionsError = strictError;
      } else if (strictData && strictData.length > 0) {
        transactionsData = strictData;
        console.log('Branch Performance - Using strict filters, found:', strictData.length, 'transactions');
      } else {
        console.log('Branch Performance - No data with strict filters, trying fallback...');
        
        // Fallback 1: Remove status filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pos_transactions')
          .select('id, branch_id, customer_id, total_amount, transaction_date, cashier_id')
          .eq('transaction_type', 'sale')
          .eq('payment_status', 'completed')
          .gte('transaction_date', startDate.toISOString())
          .order('transaction_date', { ascending: false });

        if (fallbackError) {
          console.error('Fallback filter error:', fallbackError);
          transactionsError = fallbackError;
        } else if (fallbackData && fallbackData.length > 0) {
          transactionsData = fallbackData;
          console.log('Branch Performance - Using fallback filters, found:', fallbackData.length, 'transactions');
        } else {
          console.log('Branch Performance - No data with fallback filters, trying final fallback...');
          
          // Final fallback: Only transaction_type filter
          const { data: finalData, error: finalError } = await supabase
            .from('pos_transactions')
            .select('id, branch_id, customer_id, total_amount, transaction_date, cashier_id')
            .eq('transaction_type', 'sale')
            .gte('transaction_date', startDate.toISOString())
            .order('transaction_date', { ascending: false });

          if (finalError) {
            console.error('Final filter error:', finalError);
            transactionsError = finalError;
          } else {
            transactionsData = finalData;
            console.log('Branch Performance - Using final fallback, found:', finalData?.length || 0, 'transactions');
          }
        }
      }

      setBranches(branchesData || []);
      setStaff(staffData || []);
      setTransactions(transactionsData || []);
    } catch (err: any) {
      console.error('Error loading branch data:', err);
      setError(err.message || 'Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const branchPerformance = useMemo((): BranchPerformance[] => {
    const performance = new Map<string, BranchPerformance>();
    
    // Initialize branch performance
    branches.forEach((branch, index) => {
      performance.set(branch.id, {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        sales: 0,
        orders: 0,
        customers: 0,
        staff: 0,
        growth: 0,
        efficiency: 0,
        rank: 0,
        color: COLORS[index % COLORS.length],
        status: 'average'
      });
    });

    // Calculate staff per branch
    staff.forEach(staffMember => {
      const branch = performance.get(staffMember.branch_id);
      if (branch) {
        branch.staff += 1;
      }
    });

    // Calculate sales metrics
    const customerSet = new Set<string>();
    transactions.forEach(tx => {
      const branch = performance.get(tx.branch_id);
      if (branch) {
        branch.sales += tx.total_amount || 0;
        branch.orders += 1;
        if (tx.customer_id) {
          customerSet.add(tx.customer_id);
        }
      }
    });

    // Calculate customers per branch
    transactions.forEach(tx => {
      const branch = performance.get(tx.branch_id);
      if (branch && tx.customer_id) {
        branch.customers += 1;
      }
    });

    // Calculate efficiency (sales per staff member)
    performance.forEach(branch => {
      if (branch.staff > 0) {
        branch.efficiency = branch.sales / branch.staff;
      }
    });

    // Calculate growth (mock calculation - in real app, compare with previous period)
    performance.forEach(branch => {
      branch.growth = Math.random() * 40 - 20; // Random growth between -20% and +20%
    });

    // Rank branches by sales
    const sortedBranches = Array.from(performance.values())
      .sort((a, b) => b.sales - a.sales)
      .map((branch, index) => ({
        ...branch,
        rank: index + 1,
        status: index === 0 ? 'excellent' : 
                index < 2 ? 'good' : 
                index < 4 ? 'average' : 'needs_attention'
      }));

    return sortedBranches;
  }, [branches, transactions, staff]);

  const totalSales = useMemo(() => 
    branchPerformance.reduce((sum, branch) => sum + branch.sales, 0), 
    [branchPerformance]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'average':
        return 'text-orange-600 bg-orange-100';
      case 'needs_attention':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="w-4 h-4" />;
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'average':
        return <BarChart3 className="w-4 h-4" />;
      case 'needs_attention':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Branch Data</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
            <p className="text-sm text-gray-600">Performance comparison across all branches</p>
          </div>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {formatCurrencyPHP(totalSales)}
        </div>
        <div className="text-sm text-gray-600">Total Sales ({timeRange})</div>
      </div>

      <div className="space-y-4">
        {branchPerformance.map((branch) => {
          const percentage = totalSales > 0 ? (branch.sales / totalSales) * 100 : 0;
          
          return (
            <div key={branch.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-400">#{branch.rank}</span>
                    <div className={`w-3 h-3 rounded-full ${branch.color}`}></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{branch.name}</h4>
                    {branch.address && (
                      <p className="text-xs text-gray-500 truncate max-w-48">{branch.address}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(branch.status)}`}>
                    {getStatusIcon(branch.status)}
                    <span className="capitalize">{branch.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrencyPHP(branch.sales)}
                  </div>
                  <div className="text-xs text-gray-500">Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{branch.orders}</div>
                  <div className="text-xs text-gray-500">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{branch.customers}</div>
                  <div className="text-xs text-gray-500">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{branch.staff}</div>
                  <div className="text-xs text-gray-500">Staff</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${branch.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span>₱{formatCurrencyPHP(branch.efficiency)}/staff</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className={branch.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {branch.growth >= 0 ? '+' : ''}{branch.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  {percentage.toFixed(1)}% of total
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {branchPerformance.length === 0 && (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Branch Data</h3>
          <p className="text-gray-500">No performance data found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default BranchPerformance;
