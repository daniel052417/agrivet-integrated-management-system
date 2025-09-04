import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Gift, 
  TrendingUp, 
  Download,
  Edit,
  Plus,
  Search,
  Eye,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';
import { 
  payrollPeriodApi, 
  payrollRecordsApi, 
  taxRatesApi, 
  payrollBenefitsApi, 
  payrollReportsApi,
  payrollUtils,
  type PayrollPeriod,
  type PayrollRecord,
  type TaxRate,
  type PayrollBenefit,
  type PayrollSummary
} from '../../../lib/payrollApi';

// Additional interfaces for UI state
interface PayrollFormData {
  periodName: string;
  periodType: 'monthly' | 'bi-weekly' | 'weekly' | 'custom';
  startDate: string;
  endDate: string;
  payDate: string;
}

// interface PayrollRecordFormData {
//   staffId: string;
//   baseSalary: number;
//   regularHours: number;
//   overtimeHours: number;
//   bonuses: number;
//   allowances: number;
//   notes?: string;
// }

const PayrollCompensation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payroll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for data
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [benefits, setBenefits] = useState<PayrollBenefit[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  
  // Form data
  const [periodFormData, setPeriodFormData] = useState<PayrollFormData>({
    periodName: '',
    periodType: 'monthly',
    startDate: '',
    endDate: '',
    payDate: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load payroll records when period changes
  useEffect(() => {
    if (selectedPeriod) {
      loadPayrollRecords(selectedPeriod);
      loadPayrollSummary(selectedPeriod);
    }
  }, [selectedPeriod]);

  // Data loading functions
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [periodsData, taxRatesData, benefitsData] = await Promise.all([
        payrollPeriodApi.getAll(),
        taxRatesApi.getAll(),
        payrollBenefitsApi.getAll()
      ]);
      
      setPayrollPeriods(periodsData);
      setTaxRates(taxRatesData);
      setBenefits(benefitsData);
      
      // Set first period as selected if available
      if (periodsData.length > 0) {
        setSelectedPeriod(periodsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollRecords = async (periodId: string) => {
    try {
      const records = await payrollRecordsApi.getByPeriod(periodId);
      setPayrollRecords(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll records');
    }
  };

  const loadPayrollSummary = async (periodId: string) => {
    try {
      const summary = await payrollPeriodApi.getSummary(periodId);
      setPayrollSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll summary');
    }
  };

  // Form handlers
  const handleCreatePeriod = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const validation = payrollUtils.validatePeriodDates(
        periodFormData.startDate,
        periodFormData.endDate,
        periodFormData.payDate
      );
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
      
      const periodName = payrollUtils.generatePeriodName(
        periodFormData.startDate,
        periodFormData.endDate,
        periodFormData.periodType
      );
      
      const newPeriod = await payrollPeriodApi.create({
        period_name: periodName,
        period_type: periodFormData.periodType,
        start_date: periodFormData.startDate,
        end_date: periodFormData.endDate,
        pay_date: periodFormData.payDate,
        status: 'draft',
        total_employees: 0,
        total_gross_pay: 0,
        total_tax_amount: 0,
        total_net_pay: 0
      });
      
      setPayrollPeriods(prev => [newPeriod, ...prev]);
      setShowNewPeriodForm(false);
      setPeriodFormData({
        periodName: '',
        periodType: 'monthly',
        startDate: '',
        endDate: '',
        payDate: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payroll period');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async (periodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await payrollPeriodApi.processPeriod(periodId);
      await loadPayrollRecords(periodId);
      await loadPayrollSummary(periodId);
      await loadInitialData(); // Refresh periods list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (periodId: string, reportType: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const period = payrollPeriods.find(p => p.id === periodId);
      const reportName = `${period?.period_name} - ${reportType.replace('_', ' ').toUpperCase()}`;
      
      await payrollReportsApi.generateReport(periodId, reportType, reportName);
      // In a real implementation, you would handle file download here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderPayrollTab = () => (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gross Pay</p>
              <p className="text-2xl font-bold text-green-600">
                {payrollUtils.formatCurrency(payrollSummary?.total_gross_pay || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-red-600">
                {payrollUtils.formatCurrency(payrollSummary?.total_tax_amount || 0)}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Net Pay</p>
              <p className="text-2xl font-bold text-blue-600">
                {payrollUtils.formatCurrency(payrollSummary?.total_net_pay || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-purple-600">
                {payrollSummary?.total_employees || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Payroll Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payroll Period</h3>
          <button 
            onClick={() => setShowNewPeriodForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Period
          </button>
        </div>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          disabled={loading}
        >
          <option value="">Select a payroll period</option>
          {payrollPeriods.map(period => (
            <option key={period.id} value={period.id}>
              {period.period_name} - {period.status}
            </option>
          ))}
        </select>

        {/* New Period Form */}
        {showNewPeriodForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-semibold mb-3">Create New Payroll Period</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Name</label>
                <input
                  type="text"
                  value={periodFormData.periodName}
                  onChange={(e) => setPeriodFormData(prev => ({ ...prev, periodName: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., December 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
                <select
                  value={periodFormData.periodType}
                  onChange={(e) => setPeriodFormData(prev => ({ ...prev, periodType: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="monthly">Monthly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={periodFormData.startDate}
                  onChange={(e) => setPeriodFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={periodFormData.endDate}
                  onChange={(e) => setPeriodFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
                <input
                  type="date"
                  value={periodFormData.payDate}
                  onChange={(e) => setPeriodFormData(prev => ({ ...prev, payDate: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreatePeriod}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Period'}
              </button>
              <button
                onClick={() => setShowNewPeriodForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payroll Records</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>
              {selectedPeriod && (
                <button
                  onClick={() => handleProcessPayroll(selectedPeriod)}
                  disabled={loading}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {loading ? 'Processing...' : 'Process Payroll'}
                </button>
              )}
              <button 
                onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'summary')}
                disabled={!selectedPeriod || loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading payroll records...</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No payroll records found for this period</p>
              {selectedPeriod && (
                <button
                  onClick={() => handleProcessPayroll(selectedPeriod)}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Process Payroll
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Base Salary</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Overtime</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bonuses</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gross Pay</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Pay</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrollRecords
                  .filter(record => 
                    record.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{record.employee_name}</p>
                          <p className="text-sm text-gray-500">{record.position} - {record.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{payrollUtils.formatCurrency(record.base_salary)}</td>
                      <td className="px-4 py-3 text-gray-900">{payrollUtils.formatCurrency(record.overtime_pay)}</td>
                      <td className="px-4 py-3 text-gray-900">{payrollUtils.formatCurrency(record.bonuses)}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{payrollUtils.formatCurrency(record.gross_pay)}</td>
                      <td className="px-4 py-3 text-red-600">{payrollUtils.formatCurrency(record.tax_amount)}</td>
                      <td className="px-4 py-3 text-green-600 font-bold">{payrollUtils.formatCurrency(record.net_pay)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' :
                          record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          record.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800" title="Download Pay Stub">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800" title="Edit Record">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderBenefitsTab = () => (
    <div className="space-y-6">
      {/* Benefits Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Benefits Cost</p>
              <p className="text-2xl font-bold text-purple-600">
                {payrollUtils.formatCurrency(benefits.reduce((sum, benefit) => sum + benefit.cost_value, 0))}
              </p>
            </div>
            <Gift className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employer Contribution</p>
              <p className="text-2xl font-bold text-green-600">
                {payrollUtils.formatCurrency(benefits.reduce((sum, benefit) => sum + benefit.employer_contribution, 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Benefits</p>
              <p className="text-2xl font-bold text-blue-600">
                {benefits.filter(benefit => benefit.is_active).length}
              </p>
            </div>
            <Gift className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Benefits Management */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Benefits Management</h3>
            <button 
              onClick={() => {/* TODO: Implement add benefit form */}}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Benefit
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading benefits...</p>
            </div>
          ) : benefits.length === 0 ? (
            <div className="p-8 text-center">
              <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No benefits configured</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Benefit Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employer Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {benefits.map(benefit => (
                  <tr key={benefit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{benefit.benefit_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {benefit.benefit_type.replace('_', ' ').charAt(0).toUpperCase() + benefit.benefit_type.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{payrollUtils.formatCurrency(benefit.cost_value)}</td>
                    <td className="px-4 py-3 text-green-600">{payrollUtils.formatCurrency(benefit.employer_contribution)}</td>
                    <td className="px-4 py-3 text-gray-600">{payrollUtils.formatCurrency(benefit.employee_contribution)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        benefit.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {benefit.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="Edit Benefit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderTaxTab = () => (
    <div className="space-y-6">
      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Withholding Tax</p>
              <p className="text-2xl font-bold text-red-600">
                {taxRates.find(rate => rate.tax_type === 'withholding')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SSS Contribution</p>
              <p className="text-2xl font-bold text-blue-600">
                {taxRates.find(rate => rate.tax_type === 'sss')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">PhilHealth</p>
              <p className="text-2xl font-bold text-green-600">
                {taxRates.find(rate => rate.tax_type === 'philhealth')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pag-IBIG</p>
              <p className="text-2xl font-bold text-purple-600">
                ₱{taxRates.find(rate => rate.tax_type === 'pagibig')?.rate_value || 0}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tax Rates Management */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tax Rates Configuration</h3>
            <button 
              onClick={() => {/* TODO: Implement add tax rate form */}}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Loading tax rates...</p>
            </div>
          ) : taxRates.length === 0 ? (
            <div className="p-8 text-center">
              <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No tax rates configured</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Min Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Max Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taxRates.map(taxRate => (
                  <tr key={taxRate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{taxRate.tax_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        {taxRate.tax_type.replace('_', ' ').charAt(0).toUpperCase() + taxRate.tax_type.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {taxRate.rate_type === 'percentage' ? `${taxRate.rate_value}%` : 
                       taxRate.rate_type === 'fixed' ? `₱${taxRate.rate_value}` : 
                       'Bracket'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{payrollUtils.formatCurrency(taxRate.min_amount)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {taxRate.max_amount ? payrollUtils.formatCurrency(taxRate.max_amount) : 'Unlimited'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        taxRate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {taxRate.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="Edit Tax Rate">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Payroll Reports</h3>
          <div className="space-y-3">
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'summary')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Monthly Payroll Summary</span>
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'pay_stubs')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Employee Pay Stubs</span>
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'tax_report')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Tax Reports</span>
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'benefits_report')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Benefits Summary</span>
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => selectedPeriod && handleProcessPayroll(selectedPeriod)}
              disabled={!selectedPeriod || loading}
              className="w-full bg-indigo-500 text-white px-4 py-3 rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>{loading ? 'Processing...' : 'Process Payroll'}</span>
              <Calculator className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'detailed')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Generate Detailed Report</span>
              <FileText className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'tax_report')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Tax Calculations</span>
              <Calculator className="h-4 w-4" />
            </button>
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'benefits_report')}
              disabled={!selectedPeriod || loading}
              className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-between"
            >
              <span>Benefits Audit</span>
              <Gift className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Reports</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">December 2024 Payroll Summary</p>
                  <p className="text-sm text-gray-500">Generated on Dec 31, 2024</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800">
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Q4 2024 Tax Report</p>
                  <p className="text-sm text-gray-500">Generated on Dec 15, 2024</p>
                </div>
              </div>
              <button className="text-green-600 hover:text-green-800">
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Annual Benefits Report 2024</p>
                  <p className="text-sm text-gray-500">Generated on Dec 1, 2024</p>
                </div>
              </div>
              <button className="text-purple-600 hover:text-purple-800">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll & Compensation</h1>
            <p className="text-gray-600">Manage employee payroll, benefits, and tax calculations</p>
            {loading && (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedPeriod && (
              <button 
                onClick={() => handleProcessPayroll(selectedPeriod)}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                {loading ? 'Processing...' : 'Process Payroll'}
              </button>
            )}
            <button 
              onClick={() => selectedPeriod && handleGenerateReport(selectedPeriod, 'summary')}
              disabled={!selectedPeriod || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Reports
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'payroll', label: 'Payroll', icon: DollarSign },
              { id: 'benefits', label: 'Benefits', icon: Gift },
              { id: 'tax', label: 'Tax Management', icon: Calculator },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payroll' && renderPayrollTab()}
          {activeTab === 'benefits' && renderBenefitsTab()}
          {activeTab === 'tax' && renderTaxTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </div>
      </div>
    </div>
  );
};

export default PayrollCompensation;

