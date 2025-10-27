import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  growth: number;
  color: string;
};

const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500', 'bg-teal-500'];

function formatCurrencyPHP(value: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

const SalesByBranch: React.FC = () => {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
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

      // Load branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      if (branchesError) throw branchesError;

      // Load transactions for the last 30 days with fallback logic
      let transactionsData = null;
      let transactionsError = null;

      // Try strict filters first
      const { data: strictData, error: strictError } = await supabase
        .from('pos_transactions')
        .select('id, branch_id, customer_id, total_amount, transaction_date')
        .eq('transaction_type', 'sale')
        .eq('payment_status', 'completed')
        .eq('status', 'active')
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (strictError) {
        console.error('SalesByBranch - Strict filter error:', strictError);
        transactionsError = strictError;
      } else if (strictData && strictData.length > 0) {
        transactionsData = strictData;
        console.log('SalesByBranch - Using strict filters, found:', strictData.length, 'transactions');
      } else {
        console.log('SalesByBranch - No data with strict filters, trying fallback...');
        
        // Fallback 1: Remove status filter
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('pos_transactions')
          .select('id, branch_id, customer_id, total_amount, transaction_date')
          .eq('transaction_type', 'sale')
          .eq('payment_status', 'completed')
          .gte('transaction_date', startDate.toISOString())
          .lte('transaction_date', endDate.toISOString());

        if (fallbackError) {
          console.error('SalesByBranch - Fallback filter error:', fallbackError);
          transactionsError = fallbackError;
        } else if (fallbackData && fallbackData.length > 0) {
          transactionsData = fallbackData;
          console.log('SalesByBranch - Using fallback filters, found:', fallbackData.length, 'transactions');
        } else {
          console.log('SalesByBranch - No data with fallback filters, trying final fallback...');
          
          // Final fallback: Only transaction_type filter
          const { data: finalData, error: finalError } = await supabase
            .from('pos_transactions')
            .select('id, branch_id, customer_id, total_amount, transaction_date')
            .eq('transaction_type', 'sale')
            .gte('transaction_date', startDate.toISOString())
            .lte('transaction_date', endDate.toISOString());

          if (finalError) {
            console.error('SalesByBranch - Final filter error:', finalError);
            transactionsError = finalError;
          } else {
            transactionsData = finalData;
            console.log('SalesByBranch - Using final fallback, found:', finalData?.length || 0, 'transactions');
          }
        }
      }

      setBranches(branchesData || []);
      setTransactions(transactionsData || []);
    } catch (err: any) {
      console.error('Error loading sales data:', err);
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const branchMetrics = useMemo(() => {
    const branchMap = new Map<string, BranchMetric>();
    
    // Initialize branches
    branches.forEach((branch, index) => {
      branchMap.set(branch.id, {
        id: branch.id,
        name: branch.name,
        sales: 0,
        orders: 0,
        customers: 0,
        growth: 0,
        color: COLORS[index % COLORS.length]
      });
    });

    // Calculate metrics from transactions
    const customerSet = new Set<string>();
    transactions.forEach(transaction => {
      const branch = branchMap.get(transaction.branch_id);
      if (branch) {
        branch.sales += transaction.total_amount || 0;
        branch.orders += 1;
        if (transaction.customer_id) {
          customerSet.add(transaction.customer_id);
          branch.customers += 1;
        }
      }
    });

    return Array.from(branchMap.values()).sort((a, b) => b.sales - a.sales);
  }, [branches, transactions]);

  const totalSales = useMemo(() => 
    branchMetrics.reduce((sum, branch) => sum + branch.sales, 0), 
    [branchMetrics]
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sales Data</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sales by Branch</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{branches.length} branches</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrencyPHP(totalSales)}
          </div>
          <div className="text-sm text-gray-600">Total Sales (Last 30 Days)</div>
        </div>

        <div className="space-y-4">
          {branchMetrics.map((branch, index) => {
            const percentage = totalSales > 0 ? (branch.sales / totalSales) * 100 : 0;
            
            return (
              <div key={branch.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${branch.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrencyPHP(branch.sales)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${branch.color}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{branch.customers} customers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{branch.orders} orders</span>
                    </div>
                  </div>
                  <div>
                    {branch.growth > 0 ? '+' : ''}{branch.growth.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {branchMetrics.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
            <p className="text-gray-500">No sales transactions found for the selected period.</p>
          </div>
        )}
      </div>
  );
};

export default SalesByBranch;


