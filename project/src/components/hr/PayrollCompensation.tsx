import React, { useState, useEffect } from 'react';
import { 
  Edit, Plus, Search, Eye, X, Save, User, Download, FileText,
  DollarSign, Calendar, TrendingUp, Calculator, Printer, CheckCircle,
  AlertCircle, RefreshCw, Building, Mail, Phone
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePayrollCompensationData } from '../../hooks/usePayrollCompensationData';
interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  period_type: 'monthly' | 'semi-monthly';
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
  updated_at: string;
}

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  employee_id: string;
  position: string;
  department: string;
  branch_id: string;
  branch_name: string;
  base_salary: number;
  days_present: number;
  daily_allowance: number;
  total_allowance: number;
  overtime_pay: number;
  bonuses: number;
  other_earnings: number;
  gross_pay: number;
  tax_deduction: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  cash_advances: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  period_id: string;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
  updated_at: string;
  adjustments: Adjustment[];
}

interface Adjustment {
  id: string;
  type: 'bonus' | 'deduction' | 'cash_advance' | 'other';
  description: string;
  amount: number;
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  position: string;
  department: string;
  branch_id: string;
  branch_name: string;
  base_salary: number;
  daily_allowance: number;
  email: string;
  phone: string;
}

const PayrollCompensation: React.FC = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'periods' | 'records'>('periods');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkScope, setBulkScope] = useState<'all' | 'branch' | 'individual'>('all');
  const [bulkBranchId, setBulkBranchId] = useState<string>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

  // Data fetching with RBAC filtering - uses hook
  const {
    payrollPeriods,
    payrollRecords: hookPayrollRecords,
    branches,
    hrSettings,
    loading: hookLoading,
    error: hookError,
    refreshPeriods,
    refreshRecords,
    loadBranches,
    loadHRSettings
  } = usePayrollCompensationData();

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  // Sync hook data to local state for compatibility
  useEffect(() => {
    setPayrollRecords(hookPayrollRecords);
  }, [hookPayrollRecords]);
  // Period form
  const [periodForm, setPeriodForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    period_type: 'monthly' as 'monthly' | 'semi-monthly'
  });


  // Adjustment form
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'bonus' as 'bonus' | 'deduction' | 'cash_advance' | 'other',
    description: '',
    amount: 0
  });

  useEffect(() => {
    if (selectedPeriod) {
      refreshRecords(selectedPeriod);
    }
  }, [selectedPeriod, refreshRecords]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('payroll_periods')
        .insert({
          name: periodForm.name,
          start_date: periodForm.start_date,
          end_date: periodForm.end_date,
          period_type: periodForm.period_type,
          status: 'draft'
        });

      if (insertError) throw insertError;

      setSuccess('Payroll period created successfully!');
      setShowNewPeriodModal(false);
      setPeriodForm({
        name: '',
        start_date: '',
        end_date: '',
        period_type: 'monthly'
      });
      await refreshPeriods();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error creating period:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async (periodId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Call stored procedure to generate payroll
      const { data, error: generateError } = await supabase
        .rpc('generate_payroll_for_period', {
          p_period_id: periodId
        });

      if (generateError) throw generateError;

      setSuccess(`Payroll generated for ${data.total_records} employees!`);
      await refreshRecords(periodId);
      setShowGeneratePayrollModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error generating payroll:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase
        .from('payroll_adjustments')
        .insert({
          payroll_record_id: selectedRecord.id,
          type: adjustmentForm.type,
          description: adjustmentForm.description,
          amount: adjustmentForm.amount
        });

      if (insertError) throw insertError;

      // Recalculate payroll record
      await recalculatePayrollRecord(selectedRecord.id);

      setSuccess('Adjustment added successfully!');
      setShowAdjustmentModal(false);
      setAdjustmentForm({
        type: 'bonus',
        description: '',
        amount: 0
      });
      await refreshRecords(selectedRecord.period_id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding adjustment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const recalculatePayrollRecord = async (recordId: string) => {
    try {
      await supabase.rpc('recalculate_payroll_record', {
        p_record_id: recordId
      });
    } catch (err: any) {
      console.error('Error recalculating record:', err);
    }
  };

  const handleApprovePayroll = async (recordId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payroll_records')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', recordId);

      if (error) throw error;

      setSuccess('Payroll approved successfully!');
      await refreshRecords(selectedPeriod);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error approving payroll:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payroll_records')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', recordId);

      if (error) throw error;

      setSuccess('Payroll marked as paid!');
      await refreshRecords(selectedPeriod);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error marking as paid:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const period = payrollPeriods.find(p => p.id === selectedPeriod);
      if (!period) return;

      // Generate CSV
      const headers = ['Employee ID', 'Name', 'Position', 'Department', 'Branch', 
        'Base Salary', 'Days Present', 'Allowance', 'Gross Pay', 'Deductions', 'Net Pay', 'Status'];
      
      const rows = filteredRecords.map(record => [
        record.employee_id,
        record.staff_name,
        record.position,
        record.department,
        record.branch_name,
        record.base_salary.toFixed(2),
        record.days_present,
        record.total_allowance.toFixed(2),
        record.gross_pay.toFixed(2),
        record.total_deductions.toFixed(2),
        record.net_pay.toFixed(2),
        record.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${period.name.replace(/\s+/g, '_')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setSuccess('Payroll exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error exporting payroll:', err);
      setError('Failed to export payroll');
    }
  };

  const handlePrintPayslip = () => {
    if (!selectedRecord) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const payslipHTML = generatePayslipHTML(selectedRecord);
    printWindow.document.write(payslipHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePayslipHTML = (record: PayrollRecord) => {
    const period = payrollPeriods.find(p => p.id === record.period_id);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${record.staff_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .payslip { max-width: 800px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 15px 0; }
          .row { display: flex; justify-between; margin: 5px 0; }
          .label { font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="payslip">
          <div class="header">
            <h1>AGRIVET SUPPLY CO.</h1>
            <h2>PAYSLIP</h2>
            <p>${period?.name || 'N/A'}</p>
          </div>
          
          <div class="section">
            <h3>Employee Information</h3>
            <div class="row"><span class="label">Employee ID:</span><span>${record.employee_id}</span></div>
            <div class="row"><span class="label">Name:</span><span>${record.staff_name}</span></div>
            <div class="row"><span class="label">Position:</span><span>${record.position}</span></div>
            <div class="row"><span class="label">Department:</span><span>${record.department}</span></div>
            <div class="row"><span class="label">Branch:</span><span>${record.branch_name}</span></div>
          </div>

          <div class="section">
            <h3>Earnings</h3>
            <div class="row"><span class="label">Base Salary:</span><span>₱${record.base_salary.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            <div class="row"><span class="label">Days Present:</span><span>${record.days_present} days</span></div>
            <div class="row"><span class="label">Daily Allowance (₱${record.daily_allowance}):</span><span>₱${record.total_allowance.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            ${record.overtime_pay > 0 ? `<div class="row"><span class="label">Overtime Pay:</span><span>₱${record.overtime_pay.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>` : ''}
            ${record.bonuses > 0 ? `<div class="row"><span class="label">Bonuses:</span><span>₱${record.bonuses.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>` : ''}
            ${record.other_earnings > 0 ? `<div class="row"><span class="label">Other Earnings:</span><span>₱${record.other_earnings.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>` : ''}
            <div class="row total"><span class="label">Gross Pay:</span><span>₱${record.gross_pay.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
          </div>

          <div class="section">
            <h3>Deductions</h3>
            <div class="row"><span class="label">Tax:</span><span>₱${record.tax_deduction.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            <div class="row"><span class="label">SSS:</span><span>₱${record.sss_deduction.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            <div class="row"><span class="label">PhilHealth:</span><span>₱${record.philhealth_deduction.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            <div class="row"><span class="label">Pag-IBIG:</span><span>₱${record.pagibig_deduction.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
            ${record.cash_advances > 0 ? `<div class="row"><span class="label">Cash Advances:</span><span>₱${record.cash_advances.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>` : ''}
            ${record.other_deductions > 0 ? `<div class="row"><span class="label">Other Deductions:</span><span>₱${record.other_deductions.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>` : ''}
            <div class="row total"><span class="label">Total Deductions:</span><span>₱${record.total_deductions.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></div>
          </div>

          <div class="section">
            <div class="row total" style="font-size: 20px; color: green;">
              <span class="label">NET PAY:</span>
              <span>₱${record.net_pay.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="section" style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            <p>This is a computer-generated payslip. No signature required.</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const filteredRecords = payrollRecords.filter(record => {
    const matchesBranch = selectedBranch === 'all' || record.branch_id === selectedBranch;
    const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'processing': 'bg-blue-100 text-blue-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'paid': 'bg-green-100 text-green-800',
      'approved': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  const calculateBranchSummary = () => {
    const summary: Record<string, {name: string, employees: number, total: number}> = {};
    
    filteredRecords.forEach(record => {
      if (!summary[record.branch_id]) {
        summary[record.branch_id] = {
          name: record.branch_name,
          employees: 0,
          total: 0
        };
      }
      summary[record.branch_id].employees++;
      summary[record.branch_id].total += record.net_pay;
    });
    
    return Object.values(summary);
  };

  // Bulk request helpers (placed after filteredRecords to avoid use-before-declaration)
  const selectedBulkRecords = (() => {
    if (!selectedPeriod) return [] as PayrollRecord[];
    const base = filteredRecords.filter(r => r.status === 'approved');
    if (bulkScope === 'all') return base;
    if (bulkScope === 'branch') {
      const branchFilter = bulkBranchId !== 'all' ? bulkBranchId : selectedBranch !== 'all' ? selectedBranch : 'all';
      return branchFilter === 'all' ? base : base.filter(r => r.branch_id === branchFilter);
    }
    // individual selection
    return base.filter(r => selectedEmployeeIds.includes(r.id));
  })();

  const bulkTotals = selectedBulkRecords.reduce(
    (acc, r) => {
      acc.employees += 1;
      acc.gross += r.gross_pay;
      acc.deductions += r.total_deductions;
      acc.net += r.net_pay;
      return acc;
    },
    { employees: 0, gross: 0, deductions: 0, net: 0 }
  );

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreateBulkRequest = async () => {
    if (!selectedPeriod) return;
    if (bulkTotals.employees === 0 || bulkTotals.net <= 0) {
      setError('Please select at least one approved record with valid amounts.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const scopeBranch = bulkScope === 'branch' ? (bulkBranchId !== 'all' ? bulkBranchId : (selectedBranch !== 'all' ? selectedBranch : null)) : null;
      const { data: requestRows, error: reqErr } = await supabase
        .from('payroll_requests')
        .insert([
          {
            period_id: selectedPeriod,
            scope: bulkScope,
            branch_id: scopeBranch,
            total_employees: bulkTotals.employees,
            total_gross: bulkTotals.gross,
            total_deductions: bulkTotals.deductions,
            total_net: bulkTotals.net,
            status: 'pending'
          }
        ])
        .select();
      if (reqErr) throw reqErr;
      const request = requestRows?.[0];
      if (!request) throw new Error('Failed to create payroll request.');

      const items = selectedBulkRecords.map(r => ({
        request_id: request.id,
        payroll_record_id: r.id,
        // Use the employee UUID (staff_id) instead of the human-readable employee code
        employee_id: r.staff_id,
        gross_pay: r.gross_pay,
        total_deductions: r.total_deductions,
        net_pay: r.net_pay,
        status: 'pending'
      }));
      if (items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('payroll_request_items')
          .insert(items);
        if (itemsErr) throw itemsErr;
      }

      setShowBulkModal(false);
      setSelectedEmployeeIds([]);
      setBulkScope('all');
      setSuccess('Bulk payroll request created.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create bulk payroll request');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = (record: PayrollRecord) => {
    const html = generatePayslipHTML(record);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${record.employee_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportBranchSummaryCSV = () => {
    const summary = selectedBranch === 'all' ? calculateBranchSummary() : calculateBranchSummary().filter(b => b.name === branches.find(br => br.id === selectedBranch)?.name);
    if (summary.length === 0) return;
    const headers = ['Branch','Employees','Total Net'];
    const rows = summary.map(s => [s.name, String(s.employees), s.total.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedBranch === 'all' ? 'branch_summary_all.csv' : `branch_summary_${branches.find(br => br.id === selectedBranch)?.name || 'branch'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printBranchSummary = () => {
    const summary = selectedBranch === 'all' ? calculateBranchSummary() : calculateBranchSummary().filter(b => b.name === branches.find(br => br.id === selectedBranch)?.name);
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = summary.map(s => `<tr><td>${s.name}</td><td>${s.employees}</td><td>₱${s.total.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Branch Summary</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h2>Branch Summary</h2><table><thead><tr><th>Branch</th><th>Employees</th><th>Total Net</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  if (loading && payrollPeriods.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="payroll-compensation space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll & Compensation</h1>
          <p className="text-gray-600">Automated salary computation with attendance-based allowances</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Bulk Payroll Request Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Payroll Request</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select value={bulkScope} onChange={e => setBulkScope(e.target.value as any)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="all">All Approved (filtered)</option>
                    <option value="branch">By Branch</option>
                    <option value="individual">Individual Selection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select value={bulkBranchId} onChange={e => setBulkBranchId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" disabled={bulkScope !== 'branch'}>
                    <option value="all">All Branches</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="text-sm text-gray-700">Summary</div>
                  <div className="text-xs text-gray-500">Employees: {bulkTotals.employees}</div>
                  <div className="text-xs text-gray-500">Gross: {formatCurrency(bulkTotals.gross)}</div>
                  <div className="text-xs text-gray-500">Deductions: {formatCurrency(bulkTotals.deductions)}</div>
                  <div className="text-sm font-semibold text-blue-700">Net: {formatCurrency(bulkTotals.net)}</div>
                </div>
              </div>

              {bulkScope === 'individual' && (
                <div className="border border-gray-200 rounded-md">
                  <div className="px-4 py-2 border-b text-sm font-medium text-gray-700">Select Employees</div>
                  <div className="max-h-64 overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2"></th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.map(r => (
                          <tr key={r.id}>
                            <td className="px-4 py-2">
                              <input type="checkbox" checked={selectedEmployeeIds.includes(r.id)} onChange={() => handleToggleEmployee(r.id)} />
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">{r.staff_name} <span className="text-gray-400">({r.employee_id})</span></td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{formatCurrency(r.net_pay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleCreateBulkRequest} disabled={bulkTotals.employees === 0 || bulkTotals.net <= 0} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Create Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'periods'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payroll Periods
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payroll Records
          </button>
        </nav>
      </div>

      {/* Periods Tab */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Payroll Periods</h2>
            <button 
              onClick={() => setShowNewPeriodModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Period</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payrollPeriods.map((period) => (
              <div key={period.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{period.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(period.status)}`}>
                    {period.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Period Type:</span>
                    <span className="font-medium">{period.period_type === 'monthly' ? 'Monthly' : 'Semi-Monthly'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start:</span>
                    <span>{new Date(period.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End:</span>
                    <span>{new Date(period.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employees:</span>
                    <span className="font-semibold">{period.total_employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Net:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(period.total_net)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {period.status === 'draft' && (
                    <button 
                      onClick={() => {
                        setSelectedPeriod(period.id);
                        setShowGeneratePayrollModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      <Calculator className="w-4 h-4 inline mr-1" />
                      Generate
                    </button>
                  )}
                  {/* ✅ ADD THIS ENTIRE SECTION */}
                    {(period.status === 'processing' || period.status === 'completed') && (
                      <button 
                        onClick={() => {
                          setSelectedPeriod(period.id);
                          setShowGeneratePayrollModal(true);
                        }}
                        className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 flex items-center justify-center"
                        title="Regenerate with current HR settings"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </button>
                    )}
                    {/* ✅ END OF NEW SECTION */}
                  <button 
                    onClick={() => {
                      setSelectedPeriod(period.id);
                      setActiveTab('records');
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {payrollPeriods.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Periods</h3>
              <p className="text-gray-500 mb-4">Create your first payroll period to get started</p>
              <button
                onClick={() => setShowNewPeriodModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Period
              </button>
            </div>
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">Payroll Records</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Period</option>
                {payrollPeriods.map(period => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <button
                onClick={handleExportToExcel}
                disabled={!selectedPeriod || filteredRecords.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                disabled={!selectedPeriod || filteredRecords.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Bulk Payroll Request"
              >
                <Calculator className="w-4 h-4" />
                <span>Bulk Request</span>
              </button>
              <button
                onClick={exportBranchSummaryCSV}
                disabled={!selectedPeriod}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                title="Export Branch Summary"
              >
                <Download className="w-4 h-4" />
                <span>Branch CSV</span>
              </button>
              <button
                onClick={printBranchSummary}
                disabled={!selectedPeriod}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                title="Print Branch Summary"
              >
                <Printer className="w-4 h-4" />
                <span>Print Branch</span>
              </button>
            </div>
          </div>

          {/* Branch Summary */}
          {selectedPeriod && calculateBranchSummary().length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {calculateBranchSummary().map((branch, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">{branch.employees} employees</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{branch.name}</h4>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(branch.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, employee ID, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payroll Records Table */}
          {selectedPeriod ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{record.staff_name}</div>
                            <div className="text-sm text-gray-500">{record.employee_id}</div>
                            <div className="text-xs text-gray-400">{record.position}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.base_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {record.days_present} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(record.total_allowance)}</div>
                          <div className="text-xs text-gray-500">₱{record.daily_allowance} × {record.days_present}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(record.gross_pay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(record.total_deductions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(record.net_pay)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowPayslipModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Payslip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => downloadPayslip(record)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Download Payslip"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowAdjustmentModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Add Adjustment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            {record.status === 'pending' && (
                              <button
                                onClick={() => handleApprovePayroll(record.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {record.status === 'approved' && (
                              <button
                                onClick={() => handleMarkAsPaid(record.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payroll Records</h3>
                  <p className="text-gray-500">No payroll records found for the selected period and filters.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Payroll Period</h3>
              <p className="text-gray-500">Choose a payroll period from the dropdown to view records</p>
            </div>
          )}
        </div>
      )}

      {/* New Period Modal */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Payroll Period</h2>
              <button onClick={() => setShowNewPeriodModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Name *</label>
                <input
                  type="text"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({...periodForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., January 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Type *</label>
                <select
                  value={periodForm.period_type}
                  onChange={(e) => setPeriodForm({...periodForm, period_type: e.target.value as 'monthly' | 'semi-monthly'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="semi-monthly">Semi-Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({...periodForm, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({...periodForm, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPeriodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
{showGeneratePayrollModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        {/* ✅ UPDATED: Dynamic title based on period status */}
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {payrollPeriods.find(p => p.id === selectedPeriod)?.status === 'draft' 
            ? 'Generate Payroll' 
            : 'Regenerate Payroll'}
        </h2>
        
        {/* ✅ UPDATED: Dynamic description */}
        <p className="text-gray-600 text-center mb-6">
          {payrollPeriods.find(p => p.id === selectedPeriod)?.status === 'draft'
            ? 'This will automatically calculate payroll for all active employees based on their attendance records and salary information.'
            : 'This will recalculate payroll using the CURRENT HR settings. Existing records will be updated with new calculations.'}
        </p>
        
        {/* ✅ NEW: Show current HR settings */}
        {hrSettings && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-blue-900 mb-3">Current HR Settings:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <div className="flex items-center">
                {hrSettings.include_allowance_in_pay ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>Allowance</span>
              </div>
              <div className="flex items-center">
                {hrSettings.enable_deduction_for_absences ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>Absence Deduction</span>
              </div>
              <div className="flex items-center">
                {hrSettings.enable_overtime_tracking ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>Overtime</span>
              </div>
              <div className="flex items-center">
                {hrSettings.enable_tax_computation ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>Tax</span>
              </div>
              <div className="flex items-center">
                {hrSettings.include_sss_deductions ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>SSS</span>
              </div>
              <div className="flex items-center">
                {hrSettings.include_philhealth_deductions ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>PhilHealth</span>
              </div>
              <div className="flex items-center">
                {hrSettings.include_pagibig_deductions ? (
                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <X className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span>Pag-IBIG</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGeneratePayrollModal(false)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => handleGeneratePayroll(selectedPeriod)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {payrollPeriods.find(p => p.id === selectedPeriod)?.status === 'draft'
              ? 'Generate Now'
              : 'Regenerate Now'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Payslip Modal */}
      {showPayslipModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Payslip Details</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrintPayslip}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button onClick={() => setShowPayslipModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Employee Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-600">Employee ID:</span> <span className="font-medium">{selectedRecord.employee_id}</span></div>
                  <div><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedRecord.staff_name}</span></div>
                  <div><span className="text-gray-600">Position:</span> <span className="font-medium">{selectedRecord.position}</span></div>
                  <div><span className="text-gray-600">Department:</span> <span className="font-medium">{selectedRecord.department}</span></div>
                  <div className="col-span-2"><span className="text-gray-600">Branch:</span> <span className="font-medium">{selectedRecord.branch_name}</span></div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Base Salary</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.base_salary)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Daily Allowance (₱{selectedRecord.daily_allowance} × {selectedRecord.days_present} days)</span>
                    <span className="font-medium text-blue-600">{formatCurrency(selectedRecord.total_allowance)}</span>
                  </div>
                  {selectedRecord.overtime_pay > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Overtime Pay</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.overtime_pay)}</span>
                    </div>
                  )}
                  {selectedRecord.bonuses > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Bonuses</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.bonuses)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 bg-green-50 px-3 rounded">
                    <span className="font-semibold text-gray-900">Gross Pay</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedRecord.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Deductions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.tax_deduction)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">SSS</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.sss_deduction)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">PhilHealth</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.philhealth_deduction)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Pag-IBIG</span>
                    <span className="font-medium">{formatCurrency(selectedRecord.pagibig_deduction)}</span>
                  </div>
                  {selectedRecord.cash_advances > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600">Cash Advances</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.cash_advances)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 bg-red-50 px-3 rounded">
                    <span className="font-semibold text-gray-900">Total Deductions</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedRecord.total_deductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">NET PAY</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedRecord.net_pay)}</span>
                </div>
              </div>

              {/* Adjustments */}
              {selectedRecord.adjustments && selectedRecord.adjustments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Adjustments</h3>
                  <div className="space-y-2">
                    {selectedRecord.adjustments.map((adj) => (
                      <div key={adj.id} className="flex justify-between py-2 px-3 bg-yellow-50 rounded text-sm">
                        <div>
                          <span className="font-medium">{adj.description}</span>
                          <span className="text-gray-500 ml-2">({adj.type})</span>
                        </div>
                        <span className="font-medium">{formatCurrency(adj.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Adjustment Modal */}
      {showAdjustmentModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Adjustment</h2>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustment} className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Employee:</strong> {selectedRecord.staff_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bonus">Bonus (Add)</option>
                  <option value="deduction">Deduction (Subtract)</option>
                  <option value="cash_advance">Cash Advance (Subtract)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={adjustmentForm.description}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Performance Bonus"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({...adjustmentForm, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollCompensation;