import { supabase } from './supabase';

// Types for payroll system
export interface PayrollPeriod {
  id: string;
  period_name: string;
  period_type: 'monthly' | 'bi-weekly' | 'weekly' | 'custom';
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'draft' | 'processing' | 'review' | 'approved' | 'paid' | 'closed';
  total_employees: number;
  total_gross_pay: number;
  total_tax_amount: number;
  total_net_pay: number;
  created_by?: string;
  approved_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollRecord {
  id: string;
  period_id: string;
  staff_id: string;
  employee_id: string;
  employee_name: string;
  position?: string;
  department?: string;
  base_salary: number;
  regular_hours: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  bonuses: number;
  allowances: number;
  commissions: number;
  holiday_pay: number;
  night_differential: number;
  tax_amount: number;
  sss_contribution: number;
  philhealth_contribution: number;
  pagibig_contribution: number;
  benefits_deduction: number;
  loan_deduction: number;
  other_deductions: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'pending' | 'reviewed' | 'approved' | 'paid' | 'disputed';
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  tax_name: string;
  tax_type: 'federal' | 'state' | 'local' | 'sss' | 'philhealth' | 'pagibig' | 'withholding';
  rate_type: 'percentage' | 'fixed' | 'bracket';
  rate_value: number;
  min_amount: number;
  max_amount?: number;
  is_active: boolean;
  effective_date: string;
  end_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollBenefit {
  id: string;
  benefit_name: string;
  benefit_type: 'health' | 'dental' | 'vision' | 'retirement' | 'life_insurance' | 'other';
  cost_type: 'fixed' | 'percentage' | 'per_employee';
  cost_value: number;
  employer_contribution: number;
  employee_contribution: number;
  is_taxable: boolean;
  is_active: boolean;
  effective_date: string;
  end_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeePayrollBenefit {
  id: string;
  staff_id: string;
  benefit_id: string;
  enrollment_date: string;
  status: 'active' | 'inactive' | 'suspended';
  custom_contribution?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollComponent {
  id: string;
  component_name: string;
  component_type: 'earnings' | 'deduction' | 'tax' | 'benefit';
  calculation_type: 'fixed' | 'percentage' | 'hourly' | 'custom' | 'bracket';
  is_taxable: boolean;
  is_mandatory: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PayrollReport {
  id: string;
  period_id: string;
  report_type: 'summary' | 'detailed' | 'tax_report' | 'benefits_report' | 'pay_stubs';
  report_name: string;
  file_path?: string;
  file_size?: number;
  generated_by?: string;
  generated_at: string;
  status: 'generating' | 'generated' | 'failed';
  parameters: Record<string, any>;
  created_at: string;
}

export interface PayrollSummary {
  total_employees: number;
  total_gross_pay: number;
  total_tax_amount: number;
  total_net_pay: number;
  total_benefits_cost: number;
  average_salary: number;
}

// Payroll Period API Functions
export const payrollPeriodApi = {
  // Get all payroll periods
  async getAll(): Promise<PayrollPeriod[]> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get payroll period by ID
  async getById(id: string): Promise<PayrollPeriod | null> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new payroll period
  async create(period: Omit<PayrollPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<PayrollPeriod> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .insert(period)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update payroll period
  async update(id: string, updates: Partial<PayrollPeriod>): Promise<PayrollPeriod> {
    const { data, error } = await supabase
      .from('payroll_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete payroll period
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payroll_periods')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Process payroll period (calculate all records)
  async processPeriod(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('process_payroll_period', {
      p_period_id: id
    });
    
    if (error) throw error;
    return data;
  },

  // Get payroll summary for a period
  async getSummary(id: string): Promise<PayrollSummary> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('gross_pay, tax_amount, net_pay, benefits_deduction')
      .eq('period_id', id);
    
    if (error) throw error;
    
    const summary = data?.reduce((acc, record) => ({
      total_employees: acc.total_employees + 1,
      total_gross_pay: acc.total_gross_pay + record.gross_pay,
      total_tax_amount: acc.total_tax_amount + record.tax_amount,
      total_net_pay: acc.total_net_pay + record.net_pay,
      total_benefits_cost: acc.total_benefits_cost + record.benefits_deduction,
      average_salary: 0
    }), {
      total_employees: 0,
      total_gross_pay: 0,
      total_tax_amount: 0,
      total_net_pay: 0,
      total_benefits_cost: 0,
      average_salary: 0
    }) || {
      total_employees: 0,
      total_gross_pay: 0,
      total_tax_amount: 0,
      total_net_pay: 0,
      total_benefits_cost: 0,
      average_salary: 0
    };

    summary.average_salary = summary.total_employees > 0 ? summary.total_gross_pay / summary.total_employees : 0;
    return summary;
  }
};

// Payroll Records API Functions
export const payrollRecordsApi = {
  // Get all payroll records for a period
  async getByPeriod(periodId: string): Promise<PayrollRecord[]> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('period_id', periodId)
      .order('employee_name');
    
    if (error) throw error;
    return data || [];
  },

  // Get payroll record by ID
  async getById(id: string): Promise<PayrollRecord | null> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new payroll record
  async create(record: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at'>): Promise<PayrollRecord> {
    const { data, error } = await supabase
      .from('payroll_records')
      .insert(record)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update payroll record
  async update(id: string, updates: Partial<PayrollRecord>): Promise<PayrollRecord> {
    const { data, error } = await supabase
      .from('payroll_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete payroll record
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payroll_records')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Calculate payroll for a specific employee
  async calculatePayroll(
    staffId: string,
    periodId: string,
    baseSalary: number,
    regularHours: number = 0,
    overtimeHours: number = 0,
    bonuses: number = 0,
    allowances: number = 0
  ): Promise<{
    gross_pay: number;
    tax_amount: number;
    sss_contribution: number;
    philhealth_contribution: number;
    pagibig_contribution: number;
    benefits_deduction: number;
    total_deductions: number;
    net_pay: number;
  }> {
    const { data, error } = await supabase.rpc('calculate_payroll_record', {
      p_staff_id: staffId,
      p_period_id: periodId,
      p_base_salary: baseSalary,
      p_regular_hours: regularHours,
      p_overtime_hours: overtimeHours,
      p_bonuses: bonuses,
      p_allowances: allowances
    });
    
    if (error) throw error;
    return data[0];
  },

  // Get employee's payroll history
  async getEmployeeHistory(staffId: string, limit: number = 12): Promise<PayrollRecord[]> {
    const { data, error } = await supabase
      .from('payroll_records')
      .select(`
        *,
        payroll_periods!inner(period_name, start_date, end_date, pay_date)
      `)
      .eq('staff_id', staffId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
};

// Tax Rates API Functions
export const taxRatesApi = {
  // Get all tax rates
  async getAll(): Promise<TaxRate[]> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('is_active', true)
      .order('tax_type', { ascending: true })
      .order('effective_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get tax rates by type
  async getByType(taxType: string): Promise<TaxRate[]> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('tax_type', taxType)
      .eq('is_active', true)
      .order('effective_date');
    
    if (error) throw error;
    return data || [];
  },

  // Create new tax rate
  async create(taxRate: Omit<TaxRate, 'id' | 'created_at' | 'updated_at'>): Promise<TaxRate> {
    const { data, error } = await supabase
      .from('tax_rates')
      .insert(taxRate)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update tax rate
  async update(id: string, updates: Partial<TaxRate>): Promise<TaxRate> {
    const { data, error } = await supabase
      .from('tax_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete tax rate
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tax_rates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Payroll Benefits API Functions
export const payrollBenefitsApi = {
  // Get all payroll benefits
  async getAll(): Promise<PayrollBenefit[]> {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .select('*')
      .eq('is_active', true)
      .order('benefit_type', { ascending: true })
      .order('benefit_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get benefits by type
  async getByType(benefitType: string): Promise<PayrollBenefit[]> {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .select('*')
      .eq('benefit_type', benefitType)
      .eq('is_active', true)
      .order('benefit_name');
    
    if (error) throw error;
    return data || [];
  },

  // Create new payroll benefit
  async create(benefit: Omit<PayrollBenefit, 'id' | 'created_at' | 'updated_at'>): Promise<PayrollBenefit> {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .insert(benefit)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update payroll benefit
  async update(id: string, updates: Partial<PayrollBenefit>): Promise<PayrollBenefit> {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete payroll benefit
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payroll_benefits')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Employee Payroll Benefits API Functions
export const employeePayrollBenefitsApi = {
  // Get employee's benefits
  async getByStaffId(staffId: string): Promise<(EmployeePayrollBenefit & { benefit: PayrollBenefit })[]> {
    const { data, error } = await supabase
      .from('employee_payroll_benefits')
      .select(`
        *,
        payroll_benefits!inner(*)
      `)
      .eq('staff_id', staffId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data?.map(item => ({
      ...item,
      benefit: item.payroll_benefits
    })) || [];
  },

  // Enroll employee in benefit
  async enroll(staffId: string, benefitId: string, customContribution?: number): Promise<EmployeePayrollBenefit> {
    const { data, error } = await supabase
      .from('employee_payroll_benefits')
      .insert({
        staff_id: staffId,
        benefit_id: benefitId,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        custom_contribution: customContribution
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update employee benefit
  async update(id: string, updates: Partial<EmployeePayrollBenefit>): Promise<EmployeePayrollBenefit> {
    const { data, error } = await supabase
      .from('employee_payroll_benefits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove employee from benefit
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_payroll_benefits')
      .update({ status: 'inactive' })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Payroll Reports API Functions
export const payrollReportsApi = {
  // Get reports for a period
  async getByPeriod(periodId: string): Promise<PayrollReport[]> {
    const { data, error } = await supabase
      .from('payroll_reports')
      .select('*')
      .eq('period_id', periodId)
      .order('generated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Generate payroll report
  async generateReport(
    periodId: string,
    reportType: string,
    reportName: string,
    parameters: Record<string, any> = {}
  ): Promise<PayrollReport> {
    const { data, error } = await supabase
      .from('payroll_reports')
      .insert({
        period_id: periodId,
        report_type: reportType,
        report_name: reportName,
        status: 'generating',
        parameters: parameters
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update report status
  async updateReportStatus(id: string, status: string, filePath?: string, fileSize?: number): Promise<PayrollReport> {
    const updates: any = { status };
    if (filePath) updates.file_path = filePath;
    if (fileSize) updates.file_size = fileSize;

    const { data, error } = await supabase
      .from('payroll_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Payroll Components API Functions
export const payrollComponentsApi = {
  // Get all payroll components
  async getAll(): Promise<PayrollComponent[]> {
    const { data, error } = await supabase
      .from('payroll_components')
      .select('*')
      .eq('is_active', true)
      .order('component_type', { ascending: true })
      .order('component_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get components by type
  async getByType(componentType: string): Promise<PayrollComponent[]> {
    const { data, error } = await supabase
      .from('payroll_components')
      .select('*')
      .eq('component_type', componentType)
      .eq('is_active', true)
      .order('component_name');
    
    if (error) throw error;
    return data || [];
  }
};

// Utility functions
export const payrollUtils = {
  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  },

  // Calculate tax bracket
  calculateTaxBracket(grossPay: number, brackets: Array<{min: number, max: number, rate: number}>): number {
    let tax = 0;
    for (const bracket of brackets) {
      if (grossPay > bracket.min) {
        const taxableAmount = Math.min(grossPay, bracket.max || Infinity) - bracket.min;
        tax += taxableAmount * bracket.rate;
      }
    }
    return tax;
  },

  // Generate payroll period name
  generatePeriodName(startDate: string, endDate: string, periodType: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (periodType === 'monthly') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (periodType === 'bi-weekly') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  },

  // Validate payroll period dates
  validatePeriodDates(startDate: string, endDate: string, payDate: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const pay = new Date(payDate);

    if (start >= end) {
      errors.push('Start date must be before end date');
    }

    if (pay < end) {
      errors.push('Pay date must be on or after end date');
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      errors.push('Payroll period cannot exceed 31 days');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
