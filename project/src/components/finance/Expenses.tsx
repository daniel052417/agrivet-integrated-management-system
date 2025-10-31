import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Calendar, Filter, Search, Edit, Trash2, Tag, Bell, CheckCircle, XCircle, AlertCircle, FileText, Eye, User, Package, RefreshCw, Download, Printer } from 'lucide-react';

import { supabase } from '../../lib/supabase'; // Import from your existing supabase.ts

// Import types from your supabase.ts
import type { 
  Expense, 
  ExpenseRequest, 
  ExpenseCategory, 
  Branch, 
  ExpenseWithRelations,
  ExpenseRequestWithRelations,
  ExpenseStatus,
  ExpenseRequestStatus,
  ExpensePriority,
  ExpenseRequestSource,
  ApprovalAction,
  ActivityAction,
  ExpenseSummary,
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
  // State management
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequestWithRelations[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Payroll Requests state
  const [payrollRequests, setPayrollRequests] = useState<any[]>([]);
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
      await fetchPayrollRequests();
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
    await fetchPayrollRequestItems(req.id);
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

  // Data fetching functions
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  // Payroll Requests: fetch list
  const fetchPayrollRequests = async () => {
    try {
      let query = supabase
        .from('payroll_requests')
        .select(`
          id, period_id, scope, branch_id, total_employees, total_gross, total_deductions, total_net,
          status, requested_by, notes, created_at, updated_at
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const periodIds = Array.from(new Set((data || []).map(r => r.period_id).filter(Boolean)));
      const branchIds = Array.from(new Set((data || []).map(r => r.branch_id).filter(Boolean)));

      let periodsMap: Record<string, any> = {};
      let branchesMap: Record<string, any> = {};

      if (periodIds.length > 0) {
        const { data: periodRows } = await supabase
          .from('payroll_periods')
          .select('id,name')
          .in('id', periodIds);
        (periodRows || []).forEach(p => { periodsMap[p.id] = p; });
      }
      if (branchIds.length > 0) {
        const { data: branchRows } = await supabase
          .from('branches')
          .select('id,branch_name')
          .in('id', branchIds);
        (branchRows || []).forEach(b => { branchesMap[b.id] = b; });
      }

      const enriched = (data || []).map(r => ({
        ...r,
        period_name: periodsMap[r.period_id]?.name || '—',
        branch_name: r.branch_id ? (branchesMap[r.branch_id]?.branch_name || '—') : 'All'
      }));

      setPayrollRequests(enriched);
    } catch (err) {
      console.error('Error fetching payroll requests:', err);
      setError('Failed to load payroll requests');
    }
  };

  // Payroll Requests: fetch items for selected request
  const fetchPayrollRequestItems = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('payroll_request_items')
        .select(`id, payroll_record_id, employee_id, gross_pay, total_deductions, net_pay, status, created_at`)
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const recordIds = Array.from(new Set((data || []).map(i => i.payroll_record_id)));
      let recordMap: Record<string, any> = {};
      if (recordIds.length > 0) {
        const { data: recRows } = await supabase
          .from('payroll_records')
          .select('id, employee_id, staff_name, position, branch_name')
          .in('id', recordIds);
        (recRows || []).forEach(r => { recordMap[r.id] = r; });
      }
      const withLabels = (data || []).map(i => ({
        ...i,
        record: recordMap[i.payroll_record_id] || null
      }));
      setPayrollRequestItems(withLabels);
    } catch (err) {
      console.error('Error fetching payroll request items:', err);
      setError('Failed to load payroll request items');
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories(id, name),
          branches(id, name),
          users(id, first_name, last_name, email)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    }
  };

  const fetchExpenseRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_requests')
        .select(`
          *,
          expense_categories(id, name),
          branches(id, name),
          users(id, first_name, last_name, email),
          expense_request_attachments(*),
          approvals(*, users(id, first_name, last_name, email))
        `)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      setExpenseRequests(data || []);
    } catch (err) {
      console.error('Error fetching expense requests:', err);
      setError('Failed to load expense requests');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCategories(),
        fetchBranches(),
        fetchExpenses(),
        fetchExpenseRequests()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Load payroll requests
  useEffect(() => {
    fetchPayrollRequests();
  }, []);

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
          status: 'Pending' as ExpenseStatus
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

      await fetchExpenses();
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

      await fetchExpenseRequests();
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

      await fetchExpenseRequests();
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

      await fetchExpenses();
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
      await fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    }
  };

  // Computed values
  const notificationBadge: Notification = {
    count: expenseRequests.filter(req => req.status === 'Pending').length,
    hasUrgent: expenseRequests.some(req => req.status === 'Pending' && req.priority === 'High')
  };

  const expenseSummary: ExpenseSummary = {
    today: expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const today = new Date();
        return expenseDate.toDateString() === today.toDateString();
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
    week: expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return expenseDate >= weekAgo;
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
    month: expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return expenseDate >= monthAgo;
      })
      .reduce((sum, expense) => sum + expense.amount, 0),
    pending: expenses
      .filter(expense => expense.status === 'Pending')
      .reduce((sum, expense) => sum + expense.amount, 0)
  };

  const categoryTotals: CategoryTotal[] = React.useMemo(() => {
    const categoryMap = new Map<string, number>();
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    expenses.forEach(expense => {
      const categoryName = expense.expense_categories?.name || 'Uncategorized';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + expense.amount);
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
  }, [expenses]);

  // Unified table replaces per-tab filtering

  // Unified table rows
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
      source: 'Manual Entry',
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

  const handleAddExpenseSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.amount || !newExpense.description) {
      setError('Please fill in required fields');
      return;
    }
    createExpense();
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
      await fetchExpenseRequests();
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

  const handleSourceFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceFilter(event.target.value);
  };

  const handleBranchFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBranchFilter(event.target.value);
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

  // Helper functions
  const getSourceIcon = (source: ExpenseRequestSource) => {
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

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">₱{expenseSummary.today.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Receipt className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">₱{expenseSummary.week.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">₱{expenseSummary.month.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                    <p className="text-2xl font-bold text-gray-900">₱{expenseSummary.pending.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Filter className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expenses List */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <select 
                        value={selectedCategory} 
                        onChange={handleCategoryChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <select 
                        value={branchFilter} 
                        onChange={handleBranchFilterChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Branches</option>
                        {branches.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.branch_name || b.name || 'Branch'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <select 
                        value={selectedPeriod} 
                        onChange={handlePeriodChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <select 
                        value={statusFilter} 
                        onChange={handleStatusFilterChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Paid</option>
                        <option value="processed">Processed</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <select 
                        value={sourceFilter} 
                        onChange={handleSourceFilterChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="all">All Sources</option>
                        <option value="manual entry">Manual Entry</option>
                        <option value="pos">POS</option>
                        <option value="hr">HR</option>
                        <option value="inventory">Inventory</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Unified Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unifiedRows.map((row) => (
                        <tr key={`${row.kind}-${row.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(row.date)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>{row.description}</div>
                            {row.kind !== 'payroll' && row.raw?.reference && (
                              <div className="text-xs text-gray-500">{row.raw.reference}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{row.category}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.branch}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.source}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{row.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.status.toLowerCase() === 'paid' || row.status.toLowerCase() === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : row.status.toLowerCase() === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : row.status.toLowerCase() === 'processed'
                                ? 'bg-purple-100 text-purple-800'
                                : row.status.toLowerCase() === 'under review'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>{row.status}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              {row.kind === 'expense' && row.status === 'Pending' && (
                                <button onClick={() => updateExpenseStatus(row.id, 'Paid')} className="text-green-600 hover:text-green-800" title="Mark as Paid">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {row.kind === 'expense' && (
                                <>
                                  <button className="text-blue-600 hover:text-blue-800" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => deleteExpense(row.id)} className="text-red-600 hover:text-red-800" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {row.kind === 'request' && (
                                <>
                                  <button onClick={() => handleViewRequest(row.raw)} className="text-blue-600 hover:text-blue-800" title="View">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {row.status === 'Pending' && (
                                    <>
                                      <button onClick={() => handleRequestAction(row.id, 'approve')} className="text-green-600 hover:text-green-800" title="Approve">
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => handleRequestAction(row.id, 'reject')} className="text-red-600 hover:text-red-800" title="Reject">
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {row.kind === 'payroll' && (
                                <>
                                  <button onClick={() => openPayrollRequest(row.raw)} className="text-blue-600 hover:text-blue-800" title="View Details">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {row.status === 'pending' && (
                                    <>
                                      <button onClick={() => setPayrollRequestStatus(row.id, 'approved')} className="text-green-600 hover:text-green-800" title="Approve">
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setPayrollRequestStatus(row.id, 'rejected')} className="text-red-600 hover:text-red-800" title="Reject">
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Category Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                  <div className="space-y-4">
                    {categoryTotals.map((category, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{category.category}</span>
                          <span className="text-sm text-gray-500">{category.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${category.color}`} 
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">₱{category.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-gray-900">Export Expenses</div>
                      <div className="text-sm text-gray-500">Download as Excel or PDF</div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-gray-900">Recurring Expenses</div>
                      <div className="text-sm text-gray-500">Set up automatic entries</div>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-gray-900">Expense Report</div>
                      <div className="text-sm text-gray-500">Generate detailed analysis</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Payment Processed</div>
                        <div className="text-gray-500">Supplier payment ₱15,500</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Payment Pending</div>
                        <div className="text-gray-500">Maintenance bill ₱3,500</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">New Expense Added</div>
                        <div className="text-gray-500">Utility bill ₱2,800</div>
                      </div>
                    </div>
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
                      {getSourceIcon(selectedRequest.source)}
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
      </div>
    </div>
  );
};

export default Expenses;