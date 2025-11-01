import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Edit, Trash2, Bell, CheckCircle, XCircle, AlertCircle, FileText, Eye, User, Package, RefreshCw, Download, Printer, TrendingUp, TrendingDown, MoreVertical, X, ArrowUp, ArrowDown, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

import { supabase } from '../../lib/supabase'; // Import from your existing supabase.ts
import { useExpensesData } from '../../hooks/useExpensesData'; // RBAC-aware data fetching hook
import { simplifiedAuth, SYSTEM_ROLES } from '../../lib/simplifiedAuth'; // For RBAC checks in chart data

// Import types from your supabase.ts
import type { 
  ExpenseRequest, 
  ExpenseRequestWithRelations,
  ExpenseStatus,
  ExpenseRequestStatus,
  ExpensePriority,
  ExpenseRequestSource,
  ApprovalAction,
  ActivityAction,
  CategoryTotal,
  Notification
} from '../../lib/supabase';

// Additional interfaces
interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

type Period = 'today' | 'week' | 'month' | 'year';

const Expenses: React.FC = () => {
  // Data fetching with RBAC filtering - uses hook
  const {
    expenses,
    expenseRequests,
    payrollRequests,
    categories,
    branches,
    totalSales,
    previousPeriodTotalSales,
    loading,
    error: dataError,
    refreshData,
    fetchPayrollRequestItems: fetchPayrollItems
  } = useExpensesData();

  // Local error state for UI-specific errors
  const [localError, setError] = useState<string | null>(null);
  
  // UI State
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequestWithRelations | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [chartData, setChartData] = useState<{ date: string; amount: number; label?: string }[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Payroll Requests state (UI only)
  const [selectedPayrollRequest, setSelectedPayrollRequest] = useState<any | null>(null);
  const [payrollRequestItems, setPayrollRequestItems] = useState<any[]>([]);
  const [showPayrollModal, setShowPayrollModal] = useState<boolean>(false);

  // Form state for new expense
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    description: '',
    amount: '',
    reference: '',
    payment_method: ''
  });

  // Helper function to get user's display name
  const getUserDisplayName = (user: User | { id: string; first_name?: string | null; last_name?: string | null; email?: string } | undefined): string => {
    if (!user) return 'Unknown';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.email || 'Unknown';
  };

  const getPayrollStatusBadge = (status: 'pending'|'approved'|'rejected'|'processed') => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'processed': return 'bg-purple-100 text-purple-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(amount || 0);

  const setPayrollRequestStatus = async (id: string, status: 'approved'|'rejected') => {
    try {
      const { error } = await supabase
        .from('payroll_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await refreshData(); // Refresh all data via hook
      if (selectedPayrollRequest?.id === id) {
        setSelectedPayrollRequest({ ...selectedPayrollRequest, status });
      }
    } catch (err) {
      console.error('Error updating payroll request status:', err);
      setError('Failed to update payroll request status');
    }
  };

  const openPayrollRequest = async (req: any) => {
    setSelectedPayrollRequest(req);
    setShowPayrollModal(true);
    const items = await fetchPayrollItems(req.id);
    setPayrollRequestItems(items);
  };

  const exportPayrollRequestCSV = () => {
    if (!selectedPayrollRequest || payrollRequestItems.length === 0) return;
    const headers = ['Employee ID','Name','Position','Branch','Gross','Deductions','Net'];
    const rows = payrollRequestItems.map(i => [
      i.record?.employee_id || '',
      i.record?.staff_name || '',
      i.record?.position || '',
      i.record?.branch_name || '',
      (i.gross_pay || 0).toFixed(2),
      (i.total_deductions || 0).toFixed(2),
      (i.net_pay || 0).toFixed(2)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(x => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_request_${selectedPayrollRequest.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Data fetching functions are now handled by useExpensesData hook
  // Only keeping chart data fetching and UI-specific logic here

  // Fetch chart data for expense trends (with RBAC filtering)
  const fetchChartData = async () => {
    try {
      // Get RBAC filter config
      const currentUser = simplifiedAuth.getCurrentUser();
      const isSuperAdmin = currentUser?.role_name === SYSTEM_ROLES.SUPER_ADMIN;
      const branchId = currentUser?.branch_id || null;
      const shouldFilter = !isSuperAdmin && branchId !== null;

      let startDate = new Date();
      let dataPoints: { date: string; amount: number; label?: string }[] = [];

      if (chartPeriod === 'day') {
        // Last 30 days
        startDate.setDate(startDate.getDate() - 30);
        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          dataPoints.push({ 
            date: date.toISOString().split('T')[0], 
            amount: 0 
          });
        }
      } else if (chartPeriod === 'week') {
        // Last 12 weeks
        startDate.setDate(startDate.getDate() - 84);
        for (let i = 0; i < 12; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (i * 7));
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          dataPoints.push({ 
            date: `Week ${i + 1} (${date.toISOString().split('T')[0]})`, 
            amount: 0 
          });
        }
      } else {
        // Last 6 months (changed from 12)
        startDate.setMonth(startDate.getMonth() - 6);
        for (let i = 0; i < 6; i++) {
          const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
          dataPoints.push({ 
            date: date.toISOString().split('T')[0], // Store ISO date for calculation
            amount: 0,
            label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) // Store label separately
          });
        }
      }

      // Fetch approved expenses within the period (with RBAC filtering)
      let query = supabase
        .from('expenses')
        .select('date, amount, branch_id')
        .eq('status', 'approved')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Apply branch filter for non-super-admin users
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: expensesData, error } = await query;

      if (error) throw error;

      // Group expenses by period
      expensesData?.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (chartPeriod === 'day') {
          const dayIndex = Math.floor((expenseDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 30) {
            dataPoints[dayIndex].amount += expense.amount || 0;
          }
        } else if (chartPeriod === 'week') {
          const weekIndex = Math.floor((expenseDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
          if (weekIndex >= 0 && weekIndex < 12) {
            dataPoints[weekIndex].amount += expense.amount || 0;
          }
        } else {
          // For monthly, find which month this expense belongs to (6 months)
          const expenseMonth = expenseDate.getMonth();
          const expenseYear = expenseDate.getFullYear();
          for (let i = 0; i < dataPoints.length; i++) {
            const pointDate = new Date(dataPoints[i].date);
            if (pointDate.getMonth() === expenseMonth && pointDate.getFullYear() === expenseYear) {
              dataPoints[i].amount += expense.amount || 0;
              break;
            }
          }
        }
      });

      setChartData(dataPoints);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setChartData([]);
    }
  };

  // Data initialization is handled by useExpensesData hook
  // refreshData is provided by the hook

  // Fetch chart data when period changes
  useEffect(() => {
    if (!loading) {
      fetchChartData();
    }
  }, [chartPeriod, expenses]);

  // Create new expense
  const createExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          date: newExpense.date,
          category_id: newExpense.category_id || null,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          reference: newExpense.reference,
          payment_method: newExpense.payment_method || null,
          status: 'Pending' as ExpenseStatus,
          source: 'Manual Entry' // Expenses created from this screen are manual entries
        }])
        .select();

      if (error) throw error;

      // Log activity
      if (data && data[0]) {
        await supabase
          .from('expense_activities')
          .insert([{
            entity_type: 'expense',
            entity_id: data[0].id,
            action: 'created' as ActivityAction,
            details: { description: newExpense.description, amount: parseFloat(newExpense.amount) }
          }]);
      }

      await refreshData(); // Refresh via hook
      setShowAddExpense(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        description: '',
        amount: '',
        reference: '',
        payment_method: ''
      });
    } catch (err) {
      console.error('Error creating expense:', err);
      setError('Failed to create expense');
    }
  };

  // Approve expense request
  const approveRequest = async (requestId: string, reason?: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('expense_requests')
        .update({ 
          status: 'Approved' as ExpenseRequestStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: requestId,
          action: 'approved' as ApprovalAction,
          reason: reason || null
        }]);

      if (approvalError) throw approvalError;

      // Log activity
      await supabase
        .from('expense_activities')
        .insert([{
          entity_type: 'expense_request',
          entity_id: requestId,
          action: 'approved' as ActivityAction,
          details: { reason }
        }]);

      await refreshData(); // Refresh via hook
      setShowRequestModal(false);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request');
    }
  };

  // Reject expense request
  const rejectRequest = async (requestId: string, reason?: string) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('expense_requests')
        .update({ 
          status: 'Rejected' as ExpenseRequestStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: requestId,
          action: 'rejected' as ApprovalAction,
          reason: reason || null
        }]);

      if (approvalError) throw approvalError;

      // Log activity
      await supabase
        .from('expense_activities')
        .insert([{
          entity_type: 'expense_request',
          entity_id: requestId,
          action: 'rejected' as ActivityAction,
          details: { reason }
        }]);

      await refreshData(); // Refresh via hook
      setShowRequestModal(false);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    }
  };

  // Update expense status
  const updateExpenseStatus = async (expenseId: string, status: ExpenseStatus) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (error) throw error;

      // Log activity
      await supabase
        .from('expense_activities')
        .insert([{
          entity_type: 'expense',
          entity_id: expenseId,
          action: 'updated' as ActivityAction,
          details: { status }
        }]);

      await refreshData(); // Refresh via hook
    } catch (err) {
      console.error('Error updating expense status:', err);
      setError('Failed to update expense status');
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      await refreshData(); // Refresh via hook
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    }
  };

  // Create unfiltered unified rows for summary calculations (before filtering)
  type UnifiedRow = {
    kind: 'expense' | 'request' | 'payroll';
    id: string;
    date: string;
    description: string;
    category: string;
    branch: string;
    source: string;
    amount: number;
    status: string;
    raw: any;
  };

  // Unfiltered rows for summary calculations
  const allUnifiedRows: UnifiedRow[] = React.useMemo(() => {
    const expRows: UnifiedRow[] = expenses.map(e => ({
      kind: 'expense',
      id: e.id,
      date: e.date,
      description: e.description || '—',
      category: e.expense_categories?.name || 'Uncategorized',
      branch: (e as any).branches?.name || (e as any).branch_name || '—',
      source: (e as any).source || 'Manual Entry',
      amount: e.amount || 0,
      status: e.status || 'Pending',
      raw: e
    }));

    const reqRows: UnifiedRow[] = expenseRequests.map(r => ({
      kind: 'request',
      id: r.id,
      date: r.date,
      description: r.description || '—',
      category: r.expense_categories?.name || 'Uncategorized',
      branch: (r as any).branches?.name || (r as any).branch_name || '—',
      source: (r.source || 'Request').toString(),
      amount: r.amount || 0,
      status: r.status || 'Pending',
      raw: r
    }));

    const payrollRows: UnifiedRow[] = payrollRequests.map((p: any) => ({
      kind: 'payroll',
      id: p.id,
      date: p.created_at,
      description: `Payroll — ${p.branch_name}`,
      category: 'Payroll',
      branch: p.branch_name || 'All',
      source: 'HR',
      amount: Number(p.total_net) || 0,
      status: (p.status || '').toString(),
      raw: p
    }));

    return [...expRows, ...reqRows, ...payrollRows];
  }, [expenses, expenseRequests, payrollRequests]);

  // Computed values
  const notificationBadge: Notification = {
    count: expenseRequests.filter(req => req.status === 'Pending').length,
    hasUrgent: expenseRequests.some(req => req.status === 'Pending' && req.priority === 'High')
  };

  // Calculate expense summary - only approved expenses (except pending count)
  const expenseSummary = React.useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all approved expenses (all time) for Expense Status card
    const allApprovedRows = allUnifiedRows.filter(row => {
      const status = (row.status || '').toLowerCase();
      return status === 'approved' || status === 'paid' || status === 'processed';
    });

    // Get only approved expenses (current month) for Total Expenses card and comparison
    const approvedRows = allUnifiedRows.filter(row => {
      const status = (row.status || '').toLowerCase();
      const rowDate = new Date(row.date);
      return (status === 'approved' || status === 'paid' || status === 'processed') && 
             rowDate >= monthStart;
    });

    // Get previous month approved expenses for comparison
    const previousApprovedRows = allUnifiedRows.filter(row => {
      const status = (row.status || '').toLowerCase();
      const rowDate = new Date(row.date);
      return (status === 'approved' || status === 'paid' || status === 'processed') && 
             rowDate >= previousMonthStart && rowDate <= previousMonthEnd;
    });

    // Calculate totals
    const totalApprovedExpensesAllTime = allApprovedRows.reduce((sum, row) => sum + row.amount, 0);
    const totalApprovedExpenses = approvedRows.reduce((sum, row) => sum + row.amount, 0);
    const previousApprovedExpenses = previousApprovedRows.reduce((sum, row) => sum + row.amount, 0);

    // Calculate net income (Total Sales - Total Approved Expenses)
    const netIncome = totalSales - totalApprovedExpenses;
    const previousNetIncome = previousPeriodTotalSales - previousApprovedExpenses;

    // Count pending requests (all time)
    const pendingCount = allUnifiedRows.filter(row => {
      const status = (row.status || '').toLowerCase();
      return status === 'pending' || status === 'pending_approval' || status === 'under review';
    }).length;

    // Calculate pending total amount (for display)
    const pendingTotal = allUnifiedRows
      .filter(row => {
        const status = (row.status || '').toLowerCase();
        return status === 'pending' || status === 'pending_approval' || status === 'under review';
      })
      .reduce((sum, row) => sum + row.amount, 0);

    // Calculate percentage changes
    const expenseChangePercent = previousApprovedExpenses > 0 
      ? ((totalApprovedExpenses - previousApprovedExpenses) / previousApprovedExpenses) * 100 
      : 0;
    
    const netIncomeChangePercent = previousNetIncome !== 0 
      ? ((netIncome - previousNetIncome) / Math.abs(previousNetIncome)) * 100 
      : 0;

    return {
      totalExpenses: totalApprovedExpenses, // Current month approved expenses
      approvedExpenses: totalApprovedExpensesAllTime, // All-time approved expenses for Expense Status card
      pendingExpenses: pendingTotal,
      netIncome: netIncome,
      pendingCount: pendingCount,
      pendingAmount: pendingTotal,
      expenseChangePercent: expenseChangePercent,
      netIncomeChangePercent: netIncomeChangePercent
    };
  }, [allUnifiedRows, totalSales, previousPeriodTotalSales]);

  // Calculate category totals based on approved expenses only
  const categoryTotals: CategoryTotal[] = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    // Use allUnifiedRows but filter for approved expenses/requests only (not payroll)
    const approvedRows = allUnifiedRows.filter(row => {
      const status = (row.status || '').toLowerCase();
      const isApproved = status === 'approved' || status === 'paid' || status === 'processed';
      return (row.kind === 'expense' || row.kind === 'request') && isApproved;
    });

    const totalAmount = approvedRows.reduce((sum, row) => sum + row.amount, 0);
    
    approvedRows.forEach(row => {
      const categoryName = row.category || 'Uncategorized';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + row.amount);
    });

    const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-gray-500'];
    
    return Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [allUnifiedRows]);

  // Unified table replaces per-tab filtering
  // UnifiedRow type is already defined above

  const withinPeriod = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    if (selectedPeriod === 'today') return d.toDateString() === now.toDateString();
    if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (selectedPeriod === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return d >= monthAgo;
    }
    if (selectedPeriod === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return d >= yearAgo;
    }
    return true;
  };

  const unifiedRows: UnifiedRow[] = React.useMemo(() => {
    const expRows: UnifiedRow[] = expenses.map(e => ({
      kind: 'expense',
      id: e.id,
      date: e.date,
      description: e.description || '—',
      category: e.expense_categories?.name || 'Uncategorized',
      branch: (e as any).branches?.name || (e as any).branch_name || '—',
      source: (e as any).source || 'Manual Entry', // Use actual source from database, fallback to 'Manual Entry' for legacy records
      amount: e.amount || 0,
      status: e.status || 'Pending',
      raw: e
    }));

    const reqRows: UnifiedRow[] = expenseRequests.map(r => ({
      kind: 'request',
      id: r.id,
      date: r.date,
      description: r.description || '—',
      category: r.expense_categories?.name || 'Uncategorized',
      branch: (r as any).branches?.name || (r as any).branch_name || '—',
      source: (r.source || 'Request').toString(),
      amount: r.amount || 0,
      status: r.status || 'Pending',
      raw: r
    }));

    const payrollRows: UnifiedRow[] = payrollRequests.map((p: any) => ({
      kind: 'payroll',
      id: p.id,
      date: p.created_at,
      description: `Payroll — ${p.branch_name}`,
      category: 'Payroll',
      branch: p.branch_name || 'All',
      source: 'HR',
      amount: Number(p.total_net) || 0,
      status: (p.status || '').toString(),
      raw: p
    }));

    let rows = [...expRows, ...reqRows, ...payrollRows];
    const selectedCategoryName = selectedCategory === 'all' ? null : (categories.find(c => c.id === selectedCategory)?.name || null);

    rows = rows.filter(r => {
      const categoryOk = selectedCategory === 'all' || r.raw?.category_id === selectedCategory || r.category === selectedCategoryName;
      const search = searchTerm.toLowerCase();
      const searchOk = (r.description || '').toLowerCase().includes(search) || (r.raw?.reference || '').toLowerCase().includes(search) || r.category.toLowerCase().includes(search) || r.source.toLowerCase().includes(search);
      const periodOk = withinPeriod(r.date);
      const statusOk = statusFilter === 'all' || r.status.toLowerCase().replace(/\s/g, '_') === statusFilter;
      const sourceOk = sourceFilter === 'all' || r.source.toLowerCase() === sourceFilter;
      const branchOk = branchFilter === 'all' || r.raw?.branch_id === branchFilter || r.branch === ((branches as any[]).find(b => b.id === branchFilter)?.branch_name || r.branch);
      return categoryOk && searchOk && periodOk && statusOk && sourceOk && branchOk;
    });

    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows;
  }, [expenses, expenseRequests, payrollRequests, selectedCategory, searchTerm, selectedPeriod, statusFilter, sourceFilter, categories]);

  // Event handlers
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value as Period);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddExpenseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.amount || !newExpense.description) {
      setError('Please fill in required fields (Amount and Description are required)');
      return;
    }
    
    if (parseFloat(newExpense.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    await createExpense();
  };

  const handleCloseAddExpenseModal = () => {
    setShowAddExpense(false);
    setError(null);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category_id: '',
      description: '',
      amount: '',
      reference: '',
      payment_method: ''
    });
  };

  const handleRequestAction = (requestId: string, action: 'approve' | 'reject' | 'review') => {
    if (action === 'approve') {
      approveRequest(requestId);
    } else if (action === 'reject') {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason !== null) {
        rejectRequest(requestId, reason);
      }
    } else if (action === 'review') {
      // Update status to "Under Review"
      updateRequestStatus(requestId, 'Under Review');
    }
  };

  const updateRequestStatus = async (requestId: string, status: ExpenseRequestStatus) => {
    try {
      const { error } = await supabase
        .from('expense_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      await refreshData(); // Refresh via hook
    } catch (err) {
      console.error('Error updating request status:', err);
      setError('Failed to update request status');
    }
  };

  const handleViewRequest = (request: ExpenseRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
  };

  const handleBranchFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBranchFilter(event.target.value);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setSelectedPeriod('month');
    setStatusFilter('all');
    setSourceFilter('all');
    setBranchFilter('all');
    setCurrentPage(1);
  };

  // Format status with consistent casing
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'paid': 'Paid',
      'rejected': 'Rejected',
      'processed': 'Processed',
      'under review': 'Under Review',
      'under_review': 'Under Review'
    };
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  // Format description with employee name
  const formatDescription = (row: UnifiedRow): string => {
    let desc = row.description || '—';
    // Check if description contains employee info in parentheses
    if (desc.includes('(Employee:') && row.raw?.kind !== 'payroll') {
      return desc; // Already formatted
    }
    // For Cash Advance, try to extract employee from raw data
    if (row.category === 'Cash Advance' && row.raw) {
      // Description might already have employee info
      return desc;
    }
    return desc;
  };

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort unified rows
  const sortedUnifiedRows = React.useMemo(() => {
    if (!sortConfig) return unifiedRows;
    
    const sorted = [...unifiedRows].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof UnifiedRow];
      let bVal: any = b[sortConfig.key as keyof UnifiedRow];

      if (sortConfig.key === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortConfig.key === 'amount') {
        aVal = a.amount || 0;
        bVal = b.amount || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [unifiedRows, sortConfig]);

  // Pagination
  const paginatedRows = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUnifiedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUnifiedRows, currentPage]);

  const totalPages = Math.ceil(sortedUnifiedRows.length / itemsPerPage);

  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'pos':
        return <Receipt className="h-4 w-4 text-blue-600" />;
      case 'manual entry':
        return <FileText className="h-4 w-4 text-gray-600" />;
      case 'hr':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // Export unified rows to CSV
  const exportUnifiedCSV = () => {
    const headers = ['Date','Description','Category','Branch','Source','Amount','Status'];
    const rows = unifiedRows.map(r => [
      formatDate(r.date),
      r.description?.replace(/"/g, '""') || '',
      r.category,
      r.branch,
      r.source,
      r.amount.toFixed(2),
      r.status
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(x => `"${x}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_unified.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print unified table (simple PDF via browser print)
  const printUnified = () => {
    const html = `<!doctype html><html><head><title>Expenses</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f5f5f5}</style></head><body>
      <h2>Unified Expenses</h2>
      <table><thead><tr>
      <th>Date</th><th>Description</th><th>Category</th><th>Branch</th><th>Source</th><th>Amount</th><th>Status</th>
      </tr></thead><tbody>
      ${unifiedRows.map(r => `<tr><td>${formatDate(r.date)}</td><td>${(r.description||'').replace(/</g,'&lt;')}</td><td>${r.category}</td><td>${r.branch}</td><td>${r.source}</td><td>${r.amount.toLocaleString()}</td><td>${r.status}</td></tr>`).join('')}
      </tbody></table></body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  // Helper function for source icon in request modals (uses ExpenseRequestSource type)
  const getSourceIconForRequest = (source: ExpenseRequestSource) => {
    switch (source) {
      case 'POS': return <Receipt className="h-4 w-4" />;
      case 'HR': return <User className="h-4 w-4" />;
      case 'Inventory': return <Package className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: ExpensePriority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-2 text-lg text-gray-600">Loading expenses...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state - combine hook error and local error
  const displayError = localError || dataError;
  if (displayError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{displayError}</span>
              <button 
                onClick={() => {
                  setError(null);
                  refreshData();
                }}
                className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="h-8 w-8 text-orange-600" />
                Expenses
                {notificationBadge.count > 0 && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    notificationBadge.hasUrgent ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    <Bell className="h-3 w-3 mr-1" />
                    {notificationBadge.count} Pending
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">Record and monitor all business spending</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={refreshData}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button 
                onClick={exportUnifiedCSV}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                title="Export CSV"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button 
                onClick={printUnified}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                title="Print / Save as PDF"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button 
                onClick={() => setShowAddExpense(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Expense
              </button>
            </div>
          </div>
          {/* Unified Table - no tabs */}
        </div>

        {/* Unified Content */}
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Approved Expenses */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">💸 Approved Expenses</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{expenseSummary.approvedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {expenseSummary.expenseChangePercent !== 0 && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${expenseSummary.expenseChangePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {expenseSummary.expenseChangePercent > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        <span>{Math.abs(expenseSummary.expenseChangePercent).toFixed(1)}% vs last month</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Pending Expenses */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">🟡 Pending Expenses</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{expenseSummary.pendingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{expenseSummary.pendingCount} request{expenseSummary.pendingCount !== 1 ? 's' : ''} pending</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Net Income */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">💰 Net Income</p>
                    <p className={`text-xl font-bold ${expenseSummary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₱{expenseSummary.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {expenseSummary.netIncomeChangePercent !== 0 && (
                      <div className={`flex items-center gap-1 mt-1 text-xs ${expenseSummary.netIncomeChangePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {expenseSummary.netIncomeChangePercent > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        <span>{Math.abs(expenseSummary.netIncomeChangePercent).toFixed(1)}% vs last month</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg ${expenseSummary.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {expenseSummary.netIncome >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expense Trend Coverage */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">📊 Trend Coverage</p>
                    <p className="text-xl font-bold text-gray-900">
                      {chartData.length > 0 ? chartPeriod === 'day' ? '30 Days' : chartPeriod === 'week' ? '12 Weeks' : '6 Months' : 'No Data'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Approved expenses</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Pending Requests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">📬 Pending Requests</p>
                    <p className="text-xl font-bold text-gray-900">{expenseSummary.pendingCount}</p>
                    <p className="text-xs text-gray-500 mt-1">₱{expenseSummary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expenses List */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Filters - Pill Style */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Search className="h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    
                    {/* Reset Filters Button */}
                    {(selectedCategory !== 'all' || searchTerm || selectedPeriod !== 'month' || statusFilter !== 'all' || sourceFilter !== 'all' || branchFilter !== 'all') && (
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-white rounded-full border border-gray-300 transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Filter */}
                    <select 
                      value={selectedCategory} 
                      onChange={handleCategoryChange}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        selectedCategory !== 'all' 
                          ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>

                    {/* Branch Filter */}
                    <select 
                      value={branchFilter} 
                      onChange={handleBranchFilterChange}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        branchFilter !== 'all' 
                          ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <option value="all">All Branches</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.branch_name || b.name || 'Branch'}</option>
                      ))}
                    </select>

                    {/* Period Filter */}
                    <select 
                      value={selectedPeriod} 
                      onChange={handlePeriodChange}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        selectedPeriod !== 'month' 
                          ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>

                    {/* Status Filter */}
                    <select 
                      value={statusFilter} 
                      onChange={handleStatusFilterChange}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        statusFilter !== 'all' 
                          ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="paid">Paid</option>
                      <option value="processed">Processed</option>
                    </select>

                    {/* Source Filter - Badge Style */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Source:</span>
                      <div className="flex items-center gap-1">
                        {['all', 'manual entry', 'pos', 'hr'].map(source => (
                          <button
                            key={source}
                            onClick={() => setSourceFilter(source)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-1 ${
                              sourceFilter === source
                                ? source === 'all'
                                  ? 'bg-gray-200 border-gray-400 text-gray-700'
                                  : 'bg-orange-100 border-orange-300 text-orange-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {source !== 'all' && getSourceIcon(source)}
                            <span>{source === 'all' ? 'All' : source === 'manual entry' ? 'Manual' : source.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unified Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            {sortConfig?.key === 'date' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center gap-1">
                            Amount
                            {sortConfig?.key === 'amount' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No expenses found matching your filters</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, index) => (
                          <React.Fragment key={`${row.kind}-${row.id}`}>
                            <tr 
                              className={`hover:bg-gray-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                              onClick={() => toggleRowExpansion(`${row.kind}-${row.id}`)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.date)}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                  {getSourceIcon(row.source)}
                                  <div className="flex-1">
                                    <div className="font-medium">{formatDescription(row)}</div>
                                    {row.kind !== 'payroll' && row.raw?.reference && (
                                      <div className="text-xs text-gray-500">Ref: {row.raw.reference}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{row.category}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.branch}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ₱{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  row.status.toLowerCase() === 'paid' || row.status.toLowerCase() === 'approved'
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : row.status.toLowerCase() === 'rejected'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : row.status.toLowerCase() === 'processed'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : row.status.toLowerCase() === 'under review' || row.status.toLowerCase() === 'under_review'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                }`}>{formatStatus(row.status)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                  <button
                                    onClick={() => setActionMenuOpen(actionMenuOpen === `${row.kind}-${row.id}` ? null : `${row.kind}-${row.id}`)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  
                                  {/* Action Menu Dropdown */}
                                  {actionMenuOpen === `${row.kind}-${row.id}` && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                      {row.kind === 'expense' && (
                                        <>
                                          {(row.status === 'Pending' || row.status === 'pending') && (
                                            <button
                                              onClick={() => {
                                                setShowApproveConfirm(row.id);
                                                setActionMenuOpen(null);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                              Mark as Paid
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              // Handle view details
                                              setActionMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                          >
                                            <Eye className="h-4 w-4" />
                                            View Details
                                          </button>
                                          {row.raw?.receipt_url && (
                                            <a
                                              href={row.raw.receipt_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={() => setActionMenuOpen(null)}
                                              className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                                            >
                                              <FileText className="h-4 w-4" />
                                              View Receipt
                                            </a>
                                          )}
                                          <button
                                            onClick={() => {
                                              // Handle edit
                                              setActionMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => {
                                              setShowDeleteConfirm(row.id);
                                              setActionMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                          </button>
                                        </>
                                      )}
                                      {row.kind === 'request' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              handleViewRequest(row.raw);
                                              setActionMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                          >
                                            <Eye className="h-4 w-4" />
                                            View Details
                                          </button>
                                          {row.status === 'Pending' && (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setShowApproveConfirm(row.id);
                                                  setActionMenuOpen(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => {
                                                  handleRequestAction(row.id, 'reject');
                                                  setActionMenuOpen(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                              >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                      {row.kind === 'payroll' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              openPayrollRequest(row.raw);
                                              setActionMenuOpen(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                          >
                                            <Eye className="h-4 w-4" />
                                            View Details
                                          </button>
                                          {row.status === 'pending' && (
                                            <>
                                              <button
                                                onClick={() => {
                                                  setShowApproveConfirm(row.id);
                                                  setActionMenuOpen(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setPayrollRequestStatus(row.id, 'rejected');
                                                  setActionMenuOpen(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                              >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {/* Expanded Row Details */}
                            {expandedRows.has(`${row.kind}-${row.id}`) && (
                              <tr className="bg-gray-50">
                                <td colSpan={7} className="px-6 py-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Reference:</span>
                                      <p className="font-medium">{row.raw?.reference || '—'}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Source:</span>
                                      <div className="flex items-center gap-1">
                                        {getSourceIcon(row.source)}
                                        <p className="font-medium">{row.source}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Payment Method:</span>
                                      <p className="font-medium">{row.raw?.payment_method || '—'}</p>
                                    </div>
                                    {row.raw?.notes && (
                                      <div className="col-span-2 md:col-span-4">
                                        <span className="text-gray-500">Notes:</span>
                                        <p className="font-medium">{row.raw.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedUnifiedRows.length)} of {sortedUnifiedRows.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1.5 rounded-md text-sm ${
                                currentPage === pageNum
                                  ? 'bg-orange-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Top 3 Expense Categories */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Categories</h3>
                  <div className="space-y-3">
                    {categoryTotals.slice(0, 3).map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{category.category}</p>
                            <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-900">₱{category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
                    <button
                      onClick={() => {/* Navigate to analytics */}}
                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Analytics
                    </button>
                  </div>
                  <div className="space-y-4">
                    {categoryTotals.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No category data available</p>
                    ) : (
                      categoryTotals.map((category, index) => (
                        <div key={index} className="group relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{category.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</span>
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title={`${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${category.percentage.toFixed(1)}% of total approved expenses)`}>
                                ℹ️
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${category.color}`} 
                                style={{ width: `${category.percentage}%` }}
                                title={`${category.category}: ₱${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${category.percentage.toFixed(1)}%)`}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">₱{category.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Expense Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">📈 Expense Trend</h3>
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value as 'day' | 'week' | 'month')}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="day">Daily</option>
                      <option value="week">Weekly</option>
                      <option value="month">Monthly</option>
                    </select>
                  </div>
                  <div className="mt-6">
                    {chartData.length > 0 ? (
                      <div className="space-y-2">
                        {/* Chart bars */}
                        <div className="flex items-end justify-between gap-1 h-64">
                          {chartData.map((item, index) => {
                            const maxAmount = Math.max(...chartData.map(d => d.amount), 1);
                            const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                            return (
                              <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                                  <div 
                                    className="w-full bg-orange-500 rounded-t hover:bg-orange-600 transition-colors relative group"
                                    style={{ height: `${height}%`, minHeight: item.amount > 0 ? '4px' : '0' }}
                                    title={`${item.date}: ₱${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                  >
                                    {item.amount > 0 && (
                                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                        ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-2 text-center truncate w-full" title={item.date}>
                                  {chartPeriod === 'day' 
                                    ? new Date(item.date).getDate()
                                    : chartPeriod === 'week'
                                    ? `W${index + 1}`
                                    : (item.label || new Date(item.date).toLocaleDateString('en-US', { month: 'short' }))
                                  }
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total: </span>
                            <span className="font-semibold text-gray-900">
                              ₱{chartData.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Average: </span>
                            <span className="font-semibold text-gray-900">
                              ₱{(chartData.reduce((sum, item) => sum + item.amount, 0) / (chartData.length || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => {/* Navigate to detailed analytics */}}
                              className="w-full px-4 py-2 text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-md transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Detailed Analytics
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No expense data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>

        {/* Request Detail Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Expense Request Details</h2>
                <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getSourceIconForRequest(selectedRequest.source)}
                      <span>{selectedRequest.source} - {selectedRequest.source_details}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.expense_categories?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">₱{selectedRequest.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested By</label>
                    <p className="mt-1 text-sm text-gray-900">{getUserDisplayName(selectedRequest.users)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedRequest.submitted_at)}</p>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">{selectedRequest.notes}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.expense_request_attachments && selectedRequest.expense_request_attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                    <div className="space-y-2">
                      {selectedRequest.expense_request_attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{attachment.file_name}</span>
                          <a 
                            href={attachment.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm ml-auto"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.approvals && selectedRequest.approvals.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Approval History</label>
                    <div className="space-y-2">
                      {selectedRequest.approvals.map((approval) => (
                        <div key={approval.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              approval.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {approval.action.charAt(0).toUpperCase() + approval.action.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">{formatDateTime(approval.acted_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            By: {getUserDisplayName(approval.users)}
                          </p>
                          {approval.reason && (
                            <p className="text-sm text-gray-600 mt-1">Reason: {approval.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'Pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, 'approve')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, 'reject')}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payroll Request Details Modal */}
        {showPayrollModal && selectedPayrollRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Payroll Request Details</h2>
                  <p className="text-sm text-gray-500">{selectedPayrollRequest.period_name} • {selectedPayrollRequest.scope} • {selectedPayrollRequest.branch_name}</p>
                </div>
                <button onClick={() => setShowPayrollModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPayrollStatusBadge(selectedPayrollRequest.status)}`}>{selectedPayrollRequest.status.toUpperCase()}</span>
                  <span className="text-sm text-gray-700">Employees: <strong>{selectedPayrollRequest.total_employees}</strong></span>
                  <span className="text-sm text-gray-700">Gross: <strong>{formatCurrency(selectedPayrollRequest.total_gross)}</strong></span>
                  <span className="text-sm text-gray-700">Deductions: <strong>{formatCurrency(selectedPayrollRequest.total_deductions)}</strong></span>
                  <span className="text-sm text-gray-700">Net: <strong>{formatCurrency(selectedPayrollRequest.total_net)}</strong></span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={exportPayrollRequestCSV} className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                      <Download className="h-4 w-4" /> Export CSV
                    </button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Printer className="h-4 w-4" /> Print
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollRequestItems.map(i => (
                        <tr key={i.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i.record?.staff_name} <span className="text-gray-400">({i.record?.employee_id})</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i.record?.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(i.gross_pay)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(i.total_deductions)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(i.net_pay)}</td>
                        </tr>
                      ))}
                      {payrollRequestItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedPayrollRequest.status === 'pending' && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setPayrollRequestStatus(selectedPayrollRequest.id, 'rejected')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Reject</button>
                    <button onClick={() => setPayrollRequestStatus(selectedPayrollRequest.id, 'approved')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Approve</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(null)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete this expense record? This will permanently remove it from the system.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteExpense(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowApproveConfirm(null)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Approve Expense</h3>
                  <p className="text-sm text-gray-600">Confirm approval</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to approve this expense? Once approved, it will be included in financial reports.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowApproveConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const row = paginatedRows.find(r => r.id === showApproveConfirm);
                    if (row) {
                      if (row.kind === 'expense') {
                        updateExpenseStatus(row.id, 'Paid');
                      } else if (row.kind === 'request') {
                        handleRequestAction(row.id, 'approve');
                      } else if (row.kind === 'payroll') {
                        setPayrollRequestStatus(row.id, 'approved');
                      }
                    }
                    setShowApproveConfirm(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
                <button 
                  onClick={handleCloseAddExpenseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {localError}
                </div>
              )}

              <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newExpense.category_id}
                      onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select category (optional)</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Enter expense description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={newExpense.payment_method}
                      onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="gcash">GCash</option>
                      <option value="paymaya">PayMaya</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={newExpense.reference}
                    onChange={(e) => setNewExpense({ ...newExpense, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Invoice number, receipt number, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseAddExpenseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;