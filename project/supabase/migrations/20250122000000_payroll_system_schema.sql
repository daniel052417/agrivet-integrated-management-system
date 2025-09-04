-- Payroll System Schema Migration
-- This migration creates comprehensive tables for payroll management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Payroll Periods Table
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'bi-weekly', 'weekly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'review', 'approved', 'paid', 'closed')),
    total_employees INTEGER DEFAULT 0,
    total_gross_pay DECIMAL(12,2) DEFAULT 0,
    total_tax_amount DECIMAL(12,2) DEFAULT 0,
    total_net_pay DECIMAL(12,2) DEFAULT 0,
    created_by UUID,
    approved_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(start_date, end_date)
);

-- 2. Payroll Records Table
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    employee_id VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    department VARCHAR(255),
    
    -- Basic Pay Components
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    regular_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(5,2) DEFAULT 1.5,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    
    -- Additional Pay
    bonuses DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    commissions DECIMAL(10,2) DEFAULT 0,
    holiday_pay DECIMAL(10,2) DEFAULT 0,
    night_differential DECIMAL(10,2) DEFAULT 0,
    
    -- Deductions
    tax_amount DECIMAL(10,2) DEFAULT 0,
    sss_contribution DECIMAL(10,2) DEFAULT 0,
    philhealth_contribution DECIMAL(10,2) DEFAULT 0,
    pagibig_contribution DECIMAL(10,2) DEFAULT 0,
    benefits_deduction DECIMAL(10,2) DEFAULT 0,
    loan_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    
    -- Totals
    gross_pay DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_pay DECIMAL(10,2) DEFAULT 0,
    
    -- Status and Tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'paid', 'disputed')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(period_id, staff_id)
);

-- 3. Tax Rates Configuration Table
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name VARCHAR(100) NOT NULL,
    tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN ('federal', 'state', 'local', 'sss', 'philhealth', 'pagibig', 'withholding')),
    rate_type VARCHAR(20) NOT NULL CHECK (rate_type IN ('percentage', 'fixed', 'bracket')),
    rate_value DECIMAL(8,4) NOT NULL,
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Payroll Benefits Table (links benefits to payroll)
CREATE TABLE IF NOT EXISTS payroll_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benefit_name VARCHAR(100) NOT NULL,
    benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('health', 'dental', 'vision', 'retirement', 'life_insurance', 'other')),
    cost_type VARCHAR(20) NOT NULL CHECK (cost_type IN ('fixed', 'percentage', 'per_employee')),
    cost_value DECIMAL(10,2) NOT NULL,
    employer_contribution DECIMAL(10,2) DEFAULT 0,
    employee_contribution DECIMAL(10,2) DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Employee Payroll Benefits (links employees to specific benefits)
CREATE TABLE IF NOT EXISTS employee_payroll_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES payroll_benefits(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    custom_contribution DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(staff_id, benefit_id)
);

-- 6. Payroll Components Table (for different types of pay/deductions)
CREATE TABLE IF NOT EXISTS payroll_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN ('earnings', 'deduction', 'tax', 'benefit')),
    calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN ('fixed', 'percentage', 'hourly', 'custom', 'bracket')),
    is_taxable BOOLEAN DEFAULT true,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Payroll Reports Table
CREATE TABLE IF NOT EXISTS payroll_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('summary', 'detailed', 'tax_report', 'benefits_report', 'pay_stubs')),
    report_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    generated_by UUID,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Payroll Audit Log Table
CREATE TABLE IF NOT EXISTS payroll_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID REFERENCES payroll_periods(id) ON DELETE SET NULL,
    record_id UUID REFERENCES payroll_records(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON payroll_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_period_id ON payroll_records(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_id ON payroll_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_benefits_type ON payroll_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_payroll_benefits_active ON payroll_benefits(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_payroll_benefits_staff_id ON employee_payroll_benefits(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_components_type ON payroll_components(component_type);
CREATE INDEX IF NOT EXISTS idx_payroll_reports_period_id ON payroll_reports(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_reports_type ON payroll_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_log_period_id ON payroll_audit_log(period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_audit_log_created_at ON payroll_audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payroll_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_payroll_periods_updated_at 
    BEFORE UPDATE ON payroll_periods 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at 
    BEFORE UPDATE ON payroll_records 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at 
    BEFORE UPDATE ON tax_rates 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

CREATE TRIGGER update_payroll_benefits_updated_at 
    BEFORE UPDATE ON payroll_benefits 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

CREATE TRIGGER update_employee_payroll_benefits_updated_at 
    BEFORE UPDATE ON employee_payroll_benefits 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

CREATE TRIGGER update_payroll_components_updated_at 
    BEFORE UPDATE ON payroll_components 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at_column();

-- Insert default tax rates (Philippines)
INSERT INTO tax_rates (tax_name, tax_type, rate_type, rate_value, min_amount, max_amount, is_active, effective_date, description) VALUES
    ('SSS Employee Contribution', 'sss', 'percentage', 0.11, 0, 25000, true, '2024-01-01', 'Social Security System employee contribution'),
    ('SSS Employer Contribution', 'sss', 'percentage', 0.08, 0, 25000, true, '2024-01-01', 'Social Security System employer contribution'),
    ('PhilHealth Employee', 'philhealth', 'percentage', 0.05, 0, 100000, true, '2024-01-01', 'PhilHealth employee contribution'),
    ('PhilHealth Employer', 'philhealth', 'percentage', 0.05, 0, 100000, true, '2024-01-01', 'PhilHealth employer contribution'),
    ('Pag-IBIG Employee', 'pagibig', 'fixed', 100.00, 0, 5000, true, '2024-01-01', 'Pag-IBIG employee contribution'),
    ('Pag-IBIG Employer', 'pagibig', 'fixed', 100.00, 0, 5000, true, '2024-01-01', 'Pag-IBIG employer contribution'),
    ('Withholding Tax', 'withholding', 'bracket', 0.00, 0, 250000, true, '2024-01-01', 'Income tax withholding')
ON CONFLICT DO NOTHING;

-- Insert default payroll benefits
INSERT INTO payroll_benefits (benefit_name, benefit_type, cost_type, cost_value, employer_contribution, employee_contribution, is_taxable, is_active, effective_date, description) VALUES
    ('Health Insurance', 'health', 'fixed', 2000.00, 1500.00, 500.00, true, true, '2024-01-01', 'Comprehensive health insurance coverage'),
    ('Dental Insurance', 'dental', 'fixed', 500.00, 300.00, 200.00, true, true, '2024-01-01', 'Dental care coverage'),
    ('Life Insurance', 'life_insurance', 'fixed', 300.00, 200.00, 100.00, true, true, '2024-01-01', 'Life insurance coverage'),
    ('Retirement Plan', 'retirement', 'percentage', 0.03, 0.02, 0.01, true, true, '2024-01-01', 'Company retirement plan contribution')
ON CONFLICT DO NOTHING;

-- Insert default payroll components
INSERT INTO payroll_components (component_name, component_type, calculation_type, is_taxable, is_mandatory, is_active, description) VALUES
    ('Basic Salary', 'earnings', 'fixed', true, true, true, 'Base salary amount'),
    ('Overtime Pay', 'earnings', 'hourly', true, false, true, 'Overtime hours compensation'),
    ('Holiday Pay', 'earnings', 'fixed', true, false, true, 'Holiday compensation'),
    ('Night Differential', 'earnings', 'hourly', true, false, true, 'Night shift differential pay'),
    ('Bonuses', 'earnings', 'fixed', true, false, true, 'Performance and other bonuses'),
    ('Allowances', 'earnings', 'fixed', true, false, true, 'Transportation and meal allowances'),
    ('SSS Contribution', 'deduction', 'percentage', false, true, true, 'Social Security System contribution'),
    ('PhilHealth Contribution', 'deduction', 'percentage', false, true, true, 'PhilHealth contribution'),
    ('Pag-IBIG Contribution', 'deduction', 'fixed', false, true, true, 'Pag-IBIG contribution'),
    ('Withholding Tax', 'tax', 'bracket', false, true, true, 'Income tax withholding'),
    ('Health Insurance', 'benefit', 'fixed', true, false, true, 'Health insurance premium'),
    ('Loan Deduction', 'deduction', 'fixed', false, false, true, 'Employee loan payments')
ON CONFLICT DO NOTHING;

-- Create function to calculate payroll
CREATE OR REPLACE FUNCTION calculate_payroll_record(
    p_staff_id UUID,
    p_period_id UUID,
    p_base_salary DECIMAL,
    p_regular_hours DECIMAL DEFAULT 0,
    p_overtime_hours DECIMAL DEFAULT 0,
    p_bonuses DECIMAL DEFAULT 0,
    p_allowances DECIMAL DEFAULT 0
)
RETURNS TABLE (
    gross_pay DECIMAL,
    tax_amount DECIMAL,
    sss_contribution DECIMAL,
    philhealth_contribution DECIMAL,
    pagibig_contribution DECIMAL,
    benefits_deduction DECIMAL,
    total_deductions DECIMAL,
    net_pay DECIMAL
) AS $$
DECLARE
    v_hourly_rate DECIMAL;
    v_overtime_pay DECIMAL;
    v_gross_pay DECIMAL;
    v_tax_amount DECIMAL;
    v_sss_contribution DECIMAL;
    v_philhealth_contribution DECIMAL;
    v_pagibig_contribution DECIMAL;
    v_benefits_deduction DECIMAL;
    v_total_deductions DECIMAL;
    v_net_pay DECIMAL;
BEGIN
    -- Calculate hourly rate (assuming 8 hours per day, 22 working days per month)
    v_hourly_rate := p_base_salary / (8 * 22);
    
    -- Calculate overtime pay
    v_overtime_pay := p_overtime_hours * v_hourly_rate * 1.5;
    
    -- Calculate gross pay
    v_gross_pay := p_base_salary + v_overtime_pay + p_bonuses + p_allowances;
    
    -- Calculate SSS contribution (11% of salary, max 25000)
    v_sss_contribution := LEAST(p_base_salary * 0.11, 25000 * 0.11);
    
    -- Calculate PhilHealth contribution (5% of salary, max 100000)
    v_philhealth_contribution := LEAST(p_base_salary * 0.05, 100000 * 0.05);
    
    -- Calculate Pag-IBIG contribution (fixed 100)
    v_pagibig_contribution := 100.00;
    
    -- Calculate benefits deduction (sum of employee contributions)
    SELECT COALESCE(SUM(employee_contribution), 0)
    INTO v_benefits_deduction
    FROM employee_payroll_benefits epb
    JOIN payroll_benefits pb ON epb.benefit_id = pb.id
    WHERE epb.staff_id = p_staff_id AND epb.status = 'active' AND pb.is_active = true;
    
    -- Calculate withholding tax (simplified - 20% of gross pay above 250000 annually)
    -- For monthly: if gross pay > 20833.33 (250000/12), tax = (gross_pay - 20833.33) * 0.20
    IF v_gross_pay > 20833.33 THEN
        v_tax_amount := (v_gross_pay - 20833.33) * 0.20;
    ELSE
        v_tax_amount := 0;
    END IF;
    
    -- Calculate total deductions
    v_total_deductions := v_tax_amount + v_sss_contribution + v_philhealth_contribution + v_pagibig_contribution + v_benefits_deduction;
    
    -- Calculate net pay
    v_net_pay := v_gross_pay - v_total_deductions;
    
    RETURN QUERY SELECT 
        v_gross_pay,
        v_tax_amount,
        v_sss_contribution,
        v_philhealth_contribution,
        v_pagibig_contribution,
        v_benefits_deduction,
        v_total_deductions,
        v_net_pay;
END;
$$ LANGUAGE plpgsql;

-- Create function to process payroll period
CREATE OR REPLACE FUNCTION process_payroll_period(p_period_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_period payroll_periods%ROWTYPE;
    v_staff staff%ROWTYPE;
    v_calculations RECORD;
    v_total_gross DECIMAL := 0;
    v_total_tax DECIMAL := 0;
    v_total_net DECIMAL := 0;
    v_employee_count INTEGER := 0;
BEGIN
    -- Get period information
    SELECT * INTO v_period FROM payroll_periods WHERE id = p_period_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payroll period not found';
    END IF;
    
    IF v_period.status != 'draft' THEN
        RAISE EXCEPTION 'Payroll period is not in draft status';
    END IF;
    
    -- Process each active staff member
    FOR v_staff IN 
        SELECT * FROM staff WHERE is_active = true
    LOOP
        -- Calculate payroll for this staff member
        SELECT * INTO v_calculations
        FROM calculate_payroll_record(
            v_staff.id,
            p_period_id,
            COALESCE(v_staff.salary, 0),
            176, -- 22 days * 8 hours
            0,   -- overtime hours
            0,   -- bonuses
            0    -- allowances
        );
        
        -- Insert or update payroll record
        INSERT INTO payroll_records (
            period_id, staff_id, employee_id, employee_name, position, department,
            base_salary, regular_hours, overtime_hours, overtime_pay,
            bonuses, allowances, gross_pay, tax_amount,
            sss_contribution, philhealth_contribution, pagibig_contribution,
            benefits_deduction, total_deductions, net_pay, status
        ) VALUES (
            p_period_id, v_staff.id, v_staff.employee_id, 
            CONCAT(v_staff.first_name, ' ', v_staff.last_name),
            v_staff.position, v_staff.department,
            COALESCE(v_staff.salary, 0), 176, 0, 0,
            0, 0, v_calculations.gross_pay, v_calculations.tax_amount,
            v_calculations.sss_contribution, v_calculations.philhealth_contribution, 
            v_calculations.pagibig_contribution, v_calculations.benefits_deduction,
            v_calculations.total_deductions, v_calculations.net_pay, 'pending'
        )
        ON CONFLICT (period_id, staff_id) 
        DO UPDATE SET
            base_salary = EXCLUDED.base_salary,
            gross_pay = EXCLUDED.gross_pay,
            tax_amount = EXCLUDED.tax_amount,
            sss_contribution = EXCLUDED.sss_contribution,
            philhealth_contribution = EXCLUDED.philhealth_contribution,
            pagibig_contribution = EXCLUDED.pagibig_contribution,
            benefits_deduction = EXCLUDED.benefits_deduction,
            total_deductions = EXCLUDED.total_deductions,
            net_pay = EXCLUDED.net_pay,
            updated_at = now();
        
        -- Accumulate totals
        v_total_gross := v_total_gross + v_calculations.gross_pay;
        v_total_tax := v_total_tax + v_calculations.tax_amount;
        v_total_net := v_total_net + v_calculations.net_pay;
        v_employee_count := v_employee_count + 1;
    END LOOP;
    
    -- Update period totals
    UPDATE payroll_periods 
    SET 
        total_employees = v_employee_count,
        total_gross_pay = v_total_gross,
        total_tax_amount = v_total_tax,
        total_net_pay = v_total_net,
        status = 'processing',
        processed_at = now(),
        updated_at = now()
    WHERE id = p_period_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "HR and Admin can manage payroll periods" ON payroll_periods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'hr', 'manager')
        )
    );

CREATE POLICY "HR and Admin can manage payroll records" ON payroll_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'hr', 'manager')
        )
    );

CREATE POLICY "Staff can view their own payroll records" ON payroll_records
    FOR SELECT USING (
        staff_id IN (
            SELECT s.id FROM staff s
            JOIN staff_user_links sul ON s.id = sul.staff_id
            WHERE sul.user_id = auth.uid() AND sul.link_status = 'active'
        )
    );

CREATE POLICY "HR and Admin can manage tax rates" ON tax_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'hr')
        )
    );

CREATE POLICY "HR and Admin can manage payroll benefits" ON payroll_benefits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'hr')
        )
    );

CREATE POLICY "Staff can view their own benefits" ON employee_payroll_benefits
    FOR SELECT USING (
        staff_id IN (
            SELECT s.id FROM staff s
            JOIN staff_user_links sul ON s.id = sul.staff_id
            WHERE sul.user_id = auth.uid() AND sul.link_status = 'active'
        )
    );

CREATE POLICY "HR and Admin can manage employee benefits" ON employee_payroll_benefits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'hr')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE payroll_periods IS 'Payroll periods for processing employee payments';
COMMENT ON TABLE payroll_records IS 'Individual payroll records for each employee per period';
COMMENT ON TABLE tax_rates IS 'Configurable tax rates and brackets for payroll calculations';
COMMENT ON TABLE payroll_benefits IS 'Available benefits that can be linked to payroll';
COMMENT ON TABLE employee_payroll_benefits IS 'Employee-specific benefit enrollments';
COMMENT ON TABLE payroll_components IS 'Different types of payroll components (earnings, deductions, etc.)';
COMMENT ON TABLE payroll_reports IS 'Generated payroll reports and documents';
COMMENT ON TABLE payroll_audit_log IS 'Audit trail for all payroll operations';
