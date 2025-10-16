import React, { useState, useEffect } from 'react';
import { 
  Edit,
  Plus,
  Search,
  Eye,
  X,
  Save,
  User
} from 'lucide-react';

interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
}

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: string;
  department: string;
  basic_salary: number;
  overtime_pay: number;
  bonuses: number;
  allowances: number;
  gross_pay: number;
  tax_deduction: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  period_id: string;
  status: 'pending' | 'approved' | 'paid';
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  basic_salary: number;
  email: string;
  phone: string;
}

interface PayrollRecordFormData {
  staff_id: string;
  basic_salary: number;
  overtime_pay: number;
  bonuses: number;
  allowances: number;
  tax_deduction: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  other_deductions: number;
  period_id: string;
  status: 'pending' | 'approved' | 'paid';
}

const PayrollCompensation: React.FC = () => {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'periods' | 'records'>('periods');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal and form states
  const [showNewRecordModal, setShowNewRecordModal] = useState<boolean>(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<PayrollRecordFormData>({
    staff_id: '',
    basic_salary: 0,
    overtime_pay: 0,
    bonuses: 0,
    allowances: 0,
    tax_deduction: 0,
    sss_deduction: 0,
    philhealth_deduction: 0,
    pagibig_deduction: 0,
    other_deductions: 0,
    period_id: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mock data for demonstration
  const mockPayrollPeriods: PayrollPeriod[] = [
    {
      id: 'period_001',
      name: 'January 2025',
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      status: 'completed',
      total_employees: 8,
      total_gross: 320000,
      total_deductions: 48000,
      total_net: 272000,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'period_002',
      name: 'December 2024',
      start_date: '2024-12-01',
      end_date: '2024-12-31',
      status: 'completed',
      total_employees: 8,
      total_gross: 340000,
      total_deductions: 51000,
      total_net: 289000,
      created_at: '2024-12-01T00:00:00Z'
    },
    {
      id: 'period_003',
      name: 'February 2025',
      start_date: '2025-02-01',
      end_date: '2025-02-28',
      status: 'processing',
      total_employees: 8,
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      created_at: '2025-02-01T00:00:00Z'
    }
  ];

  const mockPayrollRecords: PayrollRecord[] = [
    {
      id: 'record_001',
      staff_id: 'staff_001',
      staff_name: 'John Smith',
      position: 'Sales Manager',
      department: 'Sales',
      basic_salary: 50000,
      overtime_pay: 5000,
      bonuses: 2000,
      allowances: 3000,
      gross_pay: 60000,
      tax_deduction: 9000,
      sss_deduction: 2000,
      philhealth_deduction: 1500,
      pagibig_deduction: 1000,
      other_deductions: 500,
      total_deductions: 14000,
      net_pay: 46000,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_002',
      staff_id: 'staff_002',
      staff_name: 'Maria Garcia',
      position: 'HR Specialist',
      department: 'Human Resources',
      basic_salary: 35000,
      overtime_pay: 2000,
      bonuses: 1000,
      allowances: 2000,
      gross_pay: 40000,
      tax_deduction: 6000,
      sss_deduction: 1400,
      philhealth_deduction: 1000,
      pagibig_deduction: 700,
      other_deductions: 300,
      total_deductions: 9400,
      net_pay: 30600,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_003',
      staff_id: 'staff_003',
      staff_name: 'Robert Johnson',
      position: 'Accountant',
      department: 'Finance',
      basic_salary: 45000,
      overtime_pay: 3000,
      bonuses: 1500,
      allowances: 2500,
      gross_pay: 52000,
      tax_deduction: 7800,
      sss_deduction: 1800,
      philhealth_deduction: 1300,
      pagibig_deduction: 900,
      other_deductions: 400,
      total_deductions: 12200,
      net_pay: 39800,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_004',
      staff_id: 'staff_004',
      staff_name: 'Sarah Wilson',
      position: 'Marketing Coordinator',
      department: 'Marketing',
      basic_salary: 30000,
      overtime_pay: 1500,
      bonuses: 800,
      allowances: 1500,
      gross_pay: 34800,
      tax_deduction: 5220,
      sss_deduction: 1200,
      philhealth_deduction: 900,
      pagibig_deduction: 600,
      other_deductions: 200,
      total_deductions: 8120,
      net_pay: 26680,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_005',
      staff_id: 'staff_005',
      staff_name: 'Michael Brown',
      position: 'IT Support',
      department: 'IT',
      basic_salary: 40000,
      overtime_pay: 4000,
      bonuses: 1200,
      allowances: 2000,
      gross_pay: 47200,
      tax_deduction: 7080,
      sss_deduction: 1600,
      philhealth_deduction: 1200,
      pagibig_deduction: 800,
      other_deductions: 350,
      total_deductions: 11030,
      net_pay: 36170,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_006',
      staff_id: 'staff_006',
      staff_name: 'Lisa Davis',
      position: 'Customer Service Rep',
      department: 'Customer Service',
      basic_salary: 25000,
      overtime_pay: 1000,
      bonuses: 500,
      allowances: 1000,
      gross_pay: 27500,
      tax_deduction: 4125,
      sss_deduction: 1000,
      philhealth_deduction: 750,
      pagibig_deduction: 500,
      other_deductions: 150,
      total_deductions: 6525,
      net_pay: 20975,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_007',
      staff_id: 'staff_007',
      staff_name: 'David Lee',
      position: 'Operations Manager',
      department: 'Operations',
      basic_salary: 48000,
      overtime_pay: 6000,
      bonuses: 2500,
      allowances: 3000,
      gross_pay: 59500,
      tax_deduction: 8925,
      sss_deduction: 1900,
      philhealth_deduction: 1400,
      pagibig_deduction: 950,
      other_deductions: 450,
      total_deductions: 13625,
      net_pay: 45875,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    },
    {
      id: 'record_008',
      staff_id: 'staff_008',
      staff_name: 'Jennifer Taylor',
      position: 'Administrative Assistant',
      department: 'Administration',
      basic_salary: 22000,
      overtime_pay: 800,
      bonuses: 300,
      allowances: 800,
      gross_pay: 23900,
      tax_deduction: 3585,
      sss_deduction: 880,
      philhealth_deduction: 660,
      pagibig_deduction: 440,
      other_deductions: 120,
      total_deductions: 5685,
      net_pay: 18215,
      period_id: 'period_001',
      status: 'paid',
      created_at: '2025-01-31T00:00:00Z'
    }
  ];

  // Mock employee data
  const mockEmployees: Employee[] = [
    {
      id: 'staff_001',
      name: 'John Smith',
      position: 'Sales Manager',
      department: 'Sales',
      basic_salary: 50000,
      email: 'john.smith@company.com',
      phone: '+63 912 345 6789'
    },
    {
      id: 'staff_002',
      name: 'Maria Garcia',
      position: 'HR Specialist',
      department: 'Human Resources',
      basic_salary: 35000,
      email: 'maria.garcia@company.com',
      phone: '+63 912 345 6788'
    },
    {
      id: 'staff_003',
      name: 'Robert Johnson',
      position: 'Accountant',
      department: 'Finance',
      basic_salary: 45000,
      email: 'robert.johnson@company.com',
      phone: '+63 912 345 6787'
    },
    {
      id: 'staff_004',
      name: 'Sarah Wilson',
      position: 'Marketing Coordinator',
      department: 'Marketing',
      basic_salary: 30000,
      email: 'sarah.wilson@company.com',
      phone: '+63 912 345 6786'
    },
    {
      id: 'staff_005',
      name: 'Michael Brown',
      position: 'IT Support',
      department: 'IT',
      basic_salary: 40000,
      email: 'michael.brown@company.com',
      phone: '+63 912 345 6785'
    },
    {
      id: 'staff_006',
      name: 'Lisa Davis',
      position: 'Customer Service Rep',
      department: 'Customer Service',
      basic_salary: 25000,
      email: 'lisa.davis@company.com',
      phone: '+63 912 345 6784'
    },
    {
      id: 'staff_007',
      name: 'David Lee',
      position: 'Operations Manager',
      department: 'Operations',
      basic_salary: 48000,
      email: 'david.lee@company.com',
      phone: '+63 912 345 6783'
    },
    {
      id: 'staff_008',
      name: 'Jennifer Taylor',
      position: 'Administrative Assistant',
      department: 'Administration',
      basic_salary: 22000,
      email: 'jennifer.taylor@company.com',
      phone: '+63 912 345 6782'
    }
  ];

  useEffect(() => {
    loadPayrollData();
    loadEmployees();
  }, []);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data for demonstration
      setPayrollPeriods(mockPayrollPeriods);
      setPayrollRecords(mockPayrollRecords);
    } catch (err: any) {
      console.error('Error loading payroll data:', err);
      setError(err.message || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // Use mock data for demonstration
      setEmployees(mockEmployees);
    } catch (err: any) {
      console.error('Error loading employees:', err);
    }
  };

  const filteredRecords = payrollRecords.filter(record => {
    const matchesPeriod = !selectedPeriod || record.period_id === selectedPeriod;
    const matchesSearch = record.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPeriod && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      minimumFractionDigits: 2 
    }).format(amount);
  };

  // Form handling functions
  const openNewRecordModal = () => {
    setShowNewRecordModal(true);
    setFormData({
      staff_id: '',
      basic_salary: 0,
      overtime_pay: 0,
      bonuses: 0,
      allowances: 0,
      tax_deduction: 0,
      sss_deduction: 0,
      philhealth_deduction: 0,
      pagibig_deduction: 0,
      other_deductions: 0,
      period_id: selectedPeriod || (payrollPeriods.length > 0 ? payrollPeriods[0].id : ''),
      status: 'pending'
    });
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setFormErrors({});
  };

  const closeNewRecordModal = () => {
    setShowNewRecordModal(false);
    setSelectedEmployee(null);
    setEmployeeSearchTerm('');
    setFormData({
      staff_id: '',
      basic_salary: 0,
      overtime_pay: 0,
      bonuses: 0,
      allowances: 0,
      tax_deduction: 0,
      sss_deduction: 0,
      philhealth_deduction: 0,
      pagibig_deduction: 0,
      other_deductions: 0,
      period_id: '',
      status: 'pending'
    });
    setFormErrors({});
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      staff_id: employee.id,
      basic_salary: employee.basic_salary
    }));
    setEmployeeSearchTerm(employee.name);
    setFormErrors(prev => ({ ...prev, staff_id: '' }));
  };

  const handleInputChange = (field: keyof PayrollRecordFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const calculateGrossPay = () => {
    return formData.basic_salary + formData.overtime_pay + formData.bonuses + formData.allowances;
  };

  const calculateTotalDeductions = () => {
    return formData.tax_deduction + formData.sss_deduction + formData.philhealth_deduction + 
           formData.pagibig_deduction + formData.other_deductions;
  };

  const calculateNetPay = () => {
    return calculateGrossPay() - calculateTotalDeductions();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.staff_id) {
      errors.staff_id = 'Please select an employee';
    }
    if (!formData.period_id) {
      errors.period_id = 'Please select a payroll period';
    }
    if (formData.basic_salary < 0) {
      errors.basic_salary = 'Basic salary cannot be negative';
    }
    if (formData.overtime_pay < 0) {
      errors.overtime_pay = 'Overtime pay cannot be negative';
    }
    if (formData.bonuses < 0) {
      errors.bonuses = 'Bonuses cannot be negative';
    }
    if (formData.allowances < 0) {
      errors.allowances = 'Allowances cannot be negative';
    }
    if (formData.tax_deduction < 0) {
      errors.tax_deduction = 'Tax deduction cannot be negative';
    }
    if (formData.sss_deduction < 0) {
      errors.sss_deduction = 'SSS deduction cannot be negative';
    }
    if (formData.philhealth_deduction < 0) {
      errors.philhealth_deduction = 'PhilHealth deduction cannot be negative';
    }
    if (formData.pagibig_deduction < 0) {
      errors.pagibig_deduction = 'Pag-IBIG deduction cannot be negative';
    }
    if (formData.other_deductions < 0) {
      errors.other_deductions = 'Other deductions cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const grossPay = calculateGrossPay();
      const totalDeductions = calculateTotalDeductions();
      const netPay = calculateNetPay();
      
      const selectedEmp = employees.find(emp => emp.id === formData.staff_id);
      
      if (!selectedEmp) {
        throw new Error('Selected employee not found');
      }

      const newRecord: PayrollRecord = {
        id: `record_${Date.now()}`,
        staff_id: formData.staff_id,
        staff_name: selectedEmp.name,
        position: selectedEmp.position,
        department: selectedEmp.department,
        basic_salary: formData.basic_salary,
        overtime_pay: formData.overtime_pay,
        bonuses: formData.bonuses,
        allowances: formData.allowances,
        gross_pay: grossPay,
        tax_deduction: formData.tax_deduction,
        sss_deduction: formData.sss_deduction,
        philhealth_deduction: formData.philhealth_deduction,
        pagibig_deduction: formData.pagibig_deduction,
        other_deductions: formData.other_deductions,
        total_deductions: totalDeductions,
        net_pay: netPay,
        period_id: formData.period_id,
        status: formData.status,
        created_at: new Date().toISOString()
      };

      // Add to existing records
      setPayrollRecords(prev => [newRecord, ...prev]);
      
      // Close modal
      closeNewRecordModal();
      
      // Show success message (you can add a toast notification here)
      console.log('Payroll record created successfully');
      
    } catch (err: any) {
      console.error('Error creating payroll record:', err);
      setError(err.message || 'Failed to create payroll record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Payroll Data</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadPayrollData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="payroll-compensation">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll & Compensation</h1>
          <p className="text-gray-600">Manage payroll periods, records, and compensation</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
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
            {/* <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reports
            </button> */}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'periods' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payroll Periods</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
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
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>{new Date(period.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span>{new Date(period.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Employees:</span>
                      <span>{period.total_employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Gross:</span>
                      <span className="font-semibold">{formatCurrency(period.total_gross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Net:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(period.total_net)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                    <button className="flex-1 text-gray-600 hover:text-gray-800 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Payroll Records</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Periods</option>
                  {payrollPeriods.map(period => (
                    <option key={period.id} value={period.id}>{period.name}</option>
                  ))}
                </select>
                <button 
                  onClick={openNewRecordModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Record</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payroll records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Basic Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Pay
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.staff_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.position} • {record.department}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.basic_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.gross_pay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(record.total_deductions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(record.net_pay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payroll Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Payroll Summary</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Generate comprehensive payroll summary reports</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Tax Reports</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Generate tax deduction and compliance reports</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Export payroll data to Excel or CSV</p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* New Record Modal */}
        {showNewRecordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Create New Payroll Record</h2>
                <button
                  onClick={closeNewRecordModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employee Selection */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Employee *
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search employees by name, position, or department..."
                        value={employeeSearchTerm}
                        onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {formErrors.staff_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.staff_id}</p>
                    )}
                    
                    {/* Employee List */}
                    {employeeSearchTerm && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                        {filteredEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            onClick={() => handleEmployeeSelect(employee)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {employee.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {employee.position} • {employee.department}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Basic Salary: {formatCurrency(employee.basic_salary)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredEmployees.length === 0 && (
                          <div className="p-3 text-center text-gray-500 text-sm">
                            No employees found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Employee Display */}
                    {selectedEmployee && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedEmployee.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedEmployee.position} • {selectedEmployee.department}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(null);
                              setFormData(prev => ({ ...prev, staff_id: '', basic_salary: 0 }));
                              setEmployeeSearchTerm('');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payroll Period */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payroll Period *
                    </label>
                    <select
                      value={formData.period_id}
                      onChange={(e) => handleInputChange('period_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a period</option>
                      {payrollPeriods.map(period => (
                        <option key={period.id} value={period.id}>
                          {period.name} ({new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    {formErrors.period_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.period_id}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as 'pending' | 'approved' | 'paid')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {/* Earnings Section */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Basic Salary *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.basic_salary}
                          onChange={(e) => handleInputChange('basic_salary', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.basic_salary && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.basic_salary}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overtime Pay
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.overtime_pay}
                          onChange={(e) => handleInputChange('overtime_pay', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.overtime_pay && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.overtime_pay}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bonuses
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.bonuses}
                          onChange={(e) => handleInputChange('bonuses', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.bonuses && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.bonuses}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Allowances
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.allowances}
                          onChange={(e) => handleInputChange('allowances', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.allowances && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.allowances}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deductions Section */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Deductions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Deduction
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.tax_deduction}
                          onChange={(e) => handleInputChange('tax_deduction', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.tax_deduction && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.tax_deduction}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SSS Deduction
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.sss_deduction}
                          onChange={(e) => handleInputChange('sss_deduction', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.sss_deduction && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.sss_deduction}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PhilHealth Deduction
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.philhealth_deduction}
                          onChange={(e) => handleInputChange('philhealth_deduction', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.philhealth_deduction && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.philhealth_deduction}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pag-IBIG Deduction
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.pagibig_deduction}
                          onChange={(e) => handleInputChange('pagibig_deduction', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.pagibig_deduction && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.pagibig_deduction}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Other Deductions
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.other_deductions}
                          onChange={(e) => handleInputChange('other_deductions', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {formErrors.other_deductions && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.other_deductions}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Summary</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Gross Pay</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(calculateGrossPay())}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total Deductions</p>
                          <p className="text-lg font-semibold text-red-600">
                            {formatCurrency(calculateTotalDeductions())}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Net Pay</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {formatCurrency(calculateNetPay())}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeNewRecordModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create Record</span>
                      </>
                    )}
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

























