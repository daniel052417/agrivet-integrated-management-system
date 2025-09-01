import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Gift, 
  TrendingUp, 
  Calendar,
  Download,
  Edit,
  Plus,
  Search,
  Filter,
  Eye
} from 'lucide-react';

// Interfaces for payroll data
interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  employmentType: 'full-time' | 'part-time' | 'contract';
  joinDate: string;
  taxId: string;
}

interface PayrollPeriod {
  id: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'processing' | 'completed' | 'paid';
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  periodId: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  allowances: number;
  deductions: number;
  grossPay: number;
  taxAmount: number;
  netPay: number;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
}

interface Benefit {
  id: string;
  name: string;
  type: 'health' | 'dental' | 'vision' | 'retirement' | 'other';
  cost: number;
  employerContribution: number;
  employeeContribution: number;
  isActive: boolean;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'federal' | 'state' | 'local' | 'social_security' | 'medicare';
  minAmount: number;
  maxAmount: number;
}

const PayrollCompensation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payroll');
  const [employees] = useState<Employee[]>([
    {
      id: '1',
      name: 'John Smith',
      position: 'Software Engineer',
      department: 'Engineering',
      baseSalary: 75000,
      employmentType: 'full-time',
      joinDate: '2023-01-15',
      taxId: '123-45-6789'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      position: 'HR Manager',
      department: 'Human Resources',
      baseSalary: 65000,
      employmentType: 'full-time',
      joinDate: '2022-08-20',
      taxId: '987-65-4321'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      position: 'Marketing Specialist',
      department: 'Marketing',
      baseSalary: 55000,
      employmentType: 'full-time',
      joinDate: '2023-03-10',
      taxId: '456-78-9012'
    }
  ]);

  const [payrollPeriods] = useState<PayrollPeriod[]>([
    {
      id: '1',
      month: 12,
      year: 2024,
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      status: 'draft'
    },
    {
      id: '2',
      month: 11,
      year: 2024,
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      status: 'completed'
    }
  ]);

  const [payrollRecords] = useState<PayrollRecord[]>([
    {
      id: '1',
      employeeId: '1',
      periodId: '1',
      baseSalary: 75000,
      overtime: 500,
      bonuses: 2000,
      allowances: 300,
      deductions: 150,
      grossPay: 77800,
      taxAmount: 15560,
      netPay: 62240,
      status: 'pending'
    },
    {
      id: '2',
      employeeId: '2',
      periodId: '1',
      baseSalary: 65000,
      overtime: 0,
      bonuses: 1500,
      allowances: 250,
      deductions: 100,
      grossPay: 66750,
      taxAmount: 13350,
      netPay: 53400,
      status: 'pending'
    }
  ]);

  const [benefits] = useState<Benefit[]>([
    {
      id: '1',
      name: 'Health Insurance',
      type: 'health',
      cost: 800,
      employerContribution: 600,
      employeeContribution: 200,
      isActive: true
    },
    {
      id: '2',
      name: 'Dental Insurance',
      type: 'dental',
      cost: 150,
      employerContribution: 100,
      employeeContribution: 50,
      isActive: true
    },
    {
      id: '3',
      name: '401(k) Retirement',
      type: 'retirement',
      cost: 0,
      employerContribution: 300,
      employeeContribution: 0,
      isActive: true
    }
  ]);

  const [taxRates] = useState<TaxRate[]>([
    {
      id: '1',
      name: 'Federal Income Tax',
      rate: 22,
      type: 'federal',
      minAmount: 0,
      maxAmount: 999999
    },
    {
      id: '2',
      name: 'Social Security',
      rate: 6.2,
      type: 'social_security',
      minAmount: 0,
      maxAmount: 160200
    },
    {
      id: '3',
      name: 'Medicare',
      rate: 1.45,
      type: 'medicare',
      minAmount: 0,
      maxAmount: 999999
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1');

  // Calculate payroll summary
  const calculatePayrollSummary = () => {
    const currentPeriod = payrollRecords.filter(record => record.periodId === selectedPeriod);
    const totalGross = currentPeriod.reduce((sum, record) => sum + record.grossPay, 0);
    const totalTax = currentPeriod.reduce((sum, record) => sum + record.taxAmount, 0);
    const totalNet = currentPeriod.reduce((sum, record) => sum + record.netPay, 0);
    const totalBenefits = currentPeriod.reduce((sum, record) => sum + record.deductions, 0);

    return {
      totalGross,
      totalTax,
      totalNet,
      totalBenefits,
      employeeCount: currentPeriod.length
    };
  };

  const summary = calculatePayrollSummary();

  const renderPayrollTab = () => (
    <div className="space-y-6">
      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gross Pay</p>
              <p className="text-2xl font-bold text-green-600">
                ${summary.totalGross.toLocaleString()}
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
                ${summary.totalTax.toLocaleString()}
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
                ${summary.totalNet.toLocaleString()}
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
                {summary.employeeCount}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Payroll Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payroll Period</h3>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Period
          </button>
        </div>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          {payrollPeriods.map(period => (
            <option key={period.id} value={period.id}>
              {new Date(period.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {period.status}
            </option>
          ))}
        </select>
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
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
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
                .filter(record => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  return employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map(record => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{employee?.name}</p>
                          <p className="text-sm text-gray-500">{employee?.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">${record.baseSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-900">${record.overtime.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-900">${record.bonuses.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">${record.grossPay.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600">${record.taxAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600 font-bold">${record.netPay.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.status === 'paid' ? 'bg-green-100 text-green-800' :
                          record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
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
                ${benefits.reduce((sum, benefit) => sum + benefit.cost, 0).toLocaleString()}
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
                ${benefits.reduce((sum, benefit) => sum + benefit.employerContribution, 0).toLocaleString()}
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
                {benefits.filter(benefit => benefit.isActive).length}
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
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Benefit
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
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
                  <td className="px-4 py-3 font-medium text-gray-900">{benefit.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {benefit.type.charAt(0).toUpperCase() + benefit.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">${benefit.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">${benefit.employerContribution.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">${benefit.employeeContribution.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      benefit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {benefit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye className="h-4 w-4" />
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
  );

  const renderTaxTab = () => (
    <div className="space-y-6">
      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Federal Tax Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {taxRates.find(rate => rate.type === 'federal')?.rate}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Social Security</p>
              <p className="text-2xl font-bold text-blue-600">
                {taxRates.find(rate => rate.type === 'social_security')?.rate}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medicare</p>
              <p className="text-2xl font-bold text-green-600">
                {taxRates.find(rate => rate.type === 'medicare')?.rate}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tax Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {taxRates.reduce((sum, rate) => sum + rate.rate, 0).toFixed(2)}%
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
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate (%)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Min Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Max Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taxRates.map(taxRate => (
                <tr key={taxRate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{taxRate.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {taxRate.type.replace('_', ' ').charAt(0).toUpperCase() + taxRate.type.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{taxRate.rate}%</td>
                  <td className="px-4 py-3 text-gray-600">${taxRate.minAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {taxRate.maxAmount === 999999 ? 'Unlimited' : `$${taxRate.maxAmount.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye className="h-4 w-4" />
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
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Payroll Reports</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-between">
              <span>Monthly Payroll Summary</span>
              <Download className="h-4 w-4" />
            </button>
            <button className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 flex items-center justify-between">
              <span>Employee Pay Stubs</span>
              <Download className="h-4 w-4" />
            </button>
            <button className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 flex items-center justify-between">
              <span>Tax Reports</span>
              <Download className="h-4 w-4" />
            </button>
            <button className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 flex items-center justify-between">
              <span>Benefits Summary</span>
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-indigo-500 text-white px-4 py-3 rounded-lg hover:bg-indigo-600 flex items-center justify-between">
              <span>Process Payroll</span>
              <Calculator className="h-4 w-4" />
            </button>
            <button className="w-full bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 flex items-center justify-between">
              <span>Generate Pay Stubs</span>
              <FileText className="h-4 w-4" />
            </button>
            <button className="w-full bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 flex items-center justify-between">
              <span>Tax Calculations</span>
              <Calculator className="h-4 w-4" />
            </button>
            <button className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 flex items-center justify-between">
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
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Process Payroll
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
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

