-- Migration: Update Payroll Functions to Use HR Settings from system_settings
-- This migration updates payroll generation to read and apply HR settings

-- Create or replace function to generate payroll for a period with HR settings
CREATE OR REPLACE FUNCTION generate_payroll_for_period(p_period_id UUID)
RETURNS TABLE (
    total_records INTEGER,
    total_gross DECIMAL,
    total_deductions DECIMAL,
    total_net DECIMAL
) AS $$
DECLARE
    v_period RECORD;
    v_staff RECORD;
    v_attendance RECORD;
    v_hr_settings JSONB;
    v_settings JSONB;
    
    -- HR Settings variables
    v_include_allowance_in_pay BOOLEAN := true;
    v_enable_deduction_for_absences BOOLEAN := true;
    v_enable_overtime_tracking BOOLEAN := true;
    v_enable_tax_computation BOOLEAN := true;
    v_include_sss_deductions BOOLEAN := true;
    v_include_philhealth_deductions BOOLEAN := true;
    v_include_pagibig_deductions BOOLEAN := true;
    
    -- Payroll calculation variables
    v_base_salary DECIMAL := 0;
    v_days_present INTEGER := 0;
    v_daily_allowance DECIMAL := 0;
    v_total_allowance DECIMAL := 0;
    v_overtime_hours DECIMAL := 0;
    v_overtime_pay DECIMAL := 0;
    v_absent_days INTEGER := 0;
    v_gross_pay DECIMAL := 0;
    v_tax_deduction DECIMAL := 0;
    v_sss_deduction DECIMAL := 0;
    v_philhealth_deduction DECIMAL := 0;
    v_pagibig_deduction DECIMAL := 0;
    v_total_deductions DECIMAL := 0;
    v_net_pay DECIMAL := 0;
    
    -- Totals
    v_total_records INTEGER := 0;
    v_total_gross DECIMAL := 0;
    v_total_deductions_sum DECIMAL := 0;
    v_total_net DECIMAL := 0;
    
    -- Period dates
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Get period information
    SELECT 
        id, 
        start_date, 
        end_date, 
        status,
        name,
        period_type
    INTO v_period
    FROM payroll_periods 
    WHERE id = p_period_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payroll period not found';
    END IF;
    
    -- Allow regeneration for processing/completed periods (for regenerate functionality)
    -- Only block if status is 'paid' or 'closed'
    IF v_period.status IN ('paid', 'closed') THEN
        RAISE EXCEPTION 'Cannot regenerate payroll for paid or closed periods';
    END IF;
    
    v_start_date := v_period.start_date;
    v_end_date := v_period.end_date;
    
    -- Load HR settings from system_settings table
    SELECT value INTO v_settings
    FROM system_settings
    WHERE key = 'app_settings'
    LIMIT 1;
    
    IF v_settings IS NOT NULL THEN
        -- Extract HR settings from nested structure
        v_hr_settings := COALESCE(v_settings->'hr', '{}'::jsonb);
        
        -- Extract HR settings with proper boolean handling
        -- Use -> to get JSONB value, then cast to boolean (handles both true and false correctly)
        -- Priority: nested hr object first, then flat keys, then default to true
        IF v_hr_settings ? 'includeAllowanceInPay' THEN
            v_include_allowance_in_pay := (v_hr_settings->'includeAllowanceInPay')::boolean;
        ELSIF v_settings ? 'include_allowance_in_pay' THEN
            v_include_allowance_in_pay := (v_settings->'include_allowance_in_pay')::boolean;
        END IF;
        
        IF v_hr_settings ? 'enableDeductionForAbsences' THEN
            v_enable_deduction_for_absences := (v_hr_settings->'enableDeductionForAbsences')::boolean;
        ELSIF v_settings ? 'enable_deduction_for_absences' THEN
            v_enable_deduction_for_absences := (v_settings->'enable_deduction_for_absences')::boolean;
        END IF;
        
        IF v_hr_settings ? 'enableOvertimeTracking' THEN
            v_enable_overtime_tracking := (v_hr_settings->'enableOvertimeTracking')::boolean;
        ELSIF v_settings ? 'enable_overtime_tracking' THEN
            v_enable_overtime_tracking := (v_settings->'enable_overtime_tracking')::boolean;
        END IF;
        
        IF v_hr_settings ? 'enableTaxComputation' THEN
            v_enable_tax_computation := (v_hr_settings->'enableTaxComputation')::boolean;
        ELSIF v_settings ? 'enable_tax_computation' THEN
            v_enable_tax_computation := (v_settings->'enable_tax_computation')::boolean;
        END IF;
        
        IF v_hr_settings ? 'includeSSSDeductions' THEN
            v_include_sss_deductions := (v_hr_settings->'includeSSSDeductions')::boolean;
        ELSIF v_settings ? 'include_sss_deductions' THEN
            v_include_sss_deductions := (v_settings->'include_sss_deductions')::boolean;
        END IF;
        
        IF v_hr_settings ? 'includePhilHealthDeductions' THEN
            v_include_philhealth_deductions := (v_hr_settings->'includePhilHealthDeductions')::boolean;
        ELSIF v_settings ? 'include_philhealth_deductions' THEN
            v_include_philhealth_deductions := (v_settings->'include_philhealth_deductions')::boolean;
        END IF;
        
        IF v_hr_settings ? 'includePagIBIGDeductions' THEN
            v_include_pagibig_deductions := (v_hr_settings->'includePagIBIGDeductions')::boolean;
        ELSIF v_settings ? 'include_pagibig_deductions' THEN
            v_include_pagibig_deductions := (v_settings->'include_pagibig_deductions')::boolean;
        END IF;
    END IF;
    
    -- Process each active staff member
    FOR v_staff IN 
        SELECT 
            s.id,
            s.employee_id,
            s.first_name,
            s.last_name,
            s.position,
            s.department,
            s.branch_id,
            COALESCE(s.salary, 0) as base_salary,
            COALESCE(s.daily_allowance, 100.00) as daily_allowance
        FROM staff s
        WHERE s.is_active = true
    LOOP
        -- Initialize variables for this staff member
        v_base_salary := v_staff.base_salary;
        v_daily_allowance := v_staff.daily_allowance;
        v_days_present := 0;
        v_overtime_hours := 0;
        v_absent_days := 0;
        v_total_allowance := 0;
        v_overtime_pay := 0;
        v_gross_pay := v_base_salary;
        v_tax_deduction := 0;
        v_sss_deduction := 0;
        v_philhealth_deduction := 0;
        v_pagibig_deduction := 0;
        v_total_deductions := 0;
        v_net_pay := 0;
        
        -- Get attendance data for this period
        SELECT 
            COUNT(*) FILTER (WHERE status = 'present') as days_present,
            COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
            COALESCE(SUM(overtime_hours), 0) as total_overtime_hours
        INTO v_attendance
        FROM attendance
        WHERE staff_id = v_staff.id
            AND attendance_date >= v_start_date
            AND attendance_date <= v_end_date;
        
        IF v_attendance IS NOT NULL THEN
            v_days_present := COALESCE(v_attendance.days_present, 0);
            v_absent_days := COALESCE(v_attendance.absent_days, 0);
            v_overtime_hours := COALESCE(v_attendance.total_overtime_hours, 0);
        END IF;
        
        -- Calculate allowances if enabled
        IF v_include_allowance_in_pay AND v_days_present > 0 THEN
            v_total_allowance := v_days_present * v_daily_allowance;
            v_gross_pay := v_gross_pay + v_total_allowance;
        END IF;
        
        -- Deduct for absences if enabled
        IF v_enable_deduction_for_absences AND v_absent_days > 0 THEN
            DECLARE
                v_daily_rate DECIMAL;
            BEGIN
                -- For semi-monthly: base_salary / 15 days
                -- For monthly: base_salary / 26 days
                IF v_period.period_type = 'semi-monthly' OR v_period.period_type = 'bi-weekly' THEN
                    v_daily_rate := v_base_salary / 15.0;
                ELSE
                    v_daily_rate := v_base_salary / 26.0;
                END IF;
                
                v_gross_pay := v_gross_pay - (v_absent_days * v_daily_rate);
            END;
        END IF;
        
        -- Calculate overtime pay if enabled
        IF v_enable_overtime_tracking AND v_overtime_hours > 0 THEN
            DECLARE
                v_hourly_rate DECIMAL;
            BEGIN
                -- Calculate hourly rate: base_salary / (8 hours * working days)
                -- For semi-monthly: 15 days * 8 hours = 120 hours
                -- For monthly: 26 days * 8 hours = 208 hours
                IF v_period.period_type = 'semi-monthly' OR v_period.period_type = 'bi-weekly' THEN
                    v_hourly_rate := v_base_salary / 120.0;
                ELSE
                    v_hourly_rate := v_base_salary / 208.0;
                END IF;
                
                -- Overtime pay: hours * hourly_rate * 1.25 (25% premium)
                v_overtime_pay := v_overtime_hours * v_hourly_rate * 1.25;
                v_gross_pay := v_gross_pay + v_overtime_pay;
            END;
        END IF;
        
        -- Calculate deductions based on HR settings
        
        -- Tax deduction
        IF v_enable_tax_computation THEN
            -- Philippine tax brackets (simplified)
            IF v_gross_pay <= 20833.33 THEN
                v_tax_deduction := 0;
            ELSIF v_gross_pay <= 33333.33 THEN
                v_tax_deduction := (v_gross_pay - 20833.33) * 0.20;
            ELSIF v_gross_pay <= 66666.67 THEN
                v_tax_deduction := 2500 + ((v_gross_pay - 33333.33) * 0.25);
            ELSE
                v_tax_deduction := v_gross_pay * 0.15;
            END IF;
        END IF;
        
        -- SSS deduction
        IF v_include_sss_deductions THEN
            -- SSS: 4.5% of gross pay, max 900
            v_sss_deduction := LEAST(v_gross_pay * 0.045, 900);
        END IF;
        
        -- PhilHealth deduction
        IF v_include_philhealth_deductions THEN
            -- PhilHealth: 2.5% of gross pay, max 2400
            v_philhealth_deduction := LEAST(v_gross_pay * 0.025, 2400);
        END IF;
        
        -- Pag-IBIG deduction
        IF v_include_pagibig_deductions THEN
            -- Pag-IBIG: 1% if gross <= 1500, else 2%
            IF v_gross_pay <= 1500 THEN
                v_pagibig_deduction := v_gross_pay * 0.01;
            ELSE
                v_pagibig_deduction := v_gross_pay * 0.02;
            END IF;
        END IF;
        
        -- Calculate total deductions
        v_total_deductions := v_tax_deduction + v_sss_deduction + v_philhealth_deduction + v_pagibig_deduction;
        
        -- Calculate net pay
        v_net_pay := v_gross_pay - v_total_deductions;
        
        -- Ensure net pay is not negative
        IF v_net_pay < 0 THEN
            v_net_pay := 0;
        END IF;
        
        -- Insert or update payroll record
        -- Match actual table schema (no employee_id, employee_name, position, department, overtime_hours)
        INSERT INTO payroll_records (
            period_id,
            staff_id,
            base_salary,
            days_present,
            daily_allowance,
            total_allowance,
            overtime_pay,
            bonuses,
            other_earnings,
            gross_pay,
            tax_deduction,
            sss_deduction,
            philhealth_deduction,
            pagibig_deduction,
            cash_advances,
            other_deductions,
            total_deductions,
            net_pay,
            status
        ) VALUES (
            p_period_id,
            v_staff.id,
            v_base_salary,
            v_days_present,
            v_daily_allowance,
            v_total_allowance,
            v_overtime_pay,
            0, -- bonuses (can be added via adjustments)
            0, -- other_earnings
            v_gross_pay,
            v_tax_deduction,
            v_sss_deduction,
            v_philhealth_deduction,
            v_pagibig_deduction,
            0, -- cash_advances
            0, -- other_deductions
            v_total_deductions,
            v_net_pay,
            CASE 
                WHEN v_period.status = 'draft' THEN 'pending'
                ELSE 'pending' -- Keep as pending for regeneration
            END
        )
        ON CONFLICT (period_id, staff_id)
        DO UPDATE SET
            base_salary = EXCLUDED.base_salary,
            days_present = EXCLUDED.days_present,
            daily_allowance = EXCLUDED.daily_allowance,
            total_allowance = EXCLUDED.total_allowance,
            overtime_pay = EXCLUDED.overtime_pay,
            gross_pay = EXCLUDED.gross_pay,
            tax_deduction = EXCLUDED.tax_deduction,
            sss_deduction = EXCLUDED.sss_deduction,
            philhealth_deduction = EXCLUDED.philhealth_deduction,
            pagibig_deduction = EXCLUDED.pagibig_deduction,
            total_deductions = EXCLUDED.total_deductions,
            net_pay = EXCLUDED.net_pay,
            updated_at = now();
        
        -- Accumulate totals
        v_total_records := v_total_records + 1;
        v_total_gross := v_total_gross + v_gross_pay;
        v_total_deductions_sum := v_total_deductions_sum + v_total_deductions;
        v_total_net := v_total_net + v_net_pay;
    END LOOP;
    
    -- Update period totals and status
    -- Use dynamic SQL to handle field name variations
    DECLARE
        v_update_sql TEXT;
        v_has_total_gross BOOLEAN;
        v_has_total_gross_pay BOOLEAN;
        v_has_total_deductions BOOLEAN;
        v_has_total_tax_amount BOOLEAN;
        v_has_total_net BOOLEAN;
        v_has_total_net_pay BOOLEAN;
    BEGIN
        -- Check which columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_gross'
        ) INTO v_has_total_gross;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_gross_pay'
        ) INTO v_has_total_gross_pay;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_deductions'
        ) INTO v_has_total_deductions;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_tax_amount'
        ) INTO v_has_total_tax_amount;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_net'
        ) INTO v_has_total_net;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payroll_periods' 
            AND column_name = 'total_net_pay'
        ) INTO v_has_total_net_pay;
        
        -- Build and execute UPDATE statement based on which columns exist
        -- Try to update with most common field names first
        IF v_has_total_gross OR v_has_total_gross_pay OR v_has_total_deductions OR v_has_total_tax_amount OR v_has_total_net OR v_has_total_net_pay THEN
            -- Build SQL with only fields that exist
            v_update_sql := 'UPDATE payroll_periods SET total_employees = $1';
            
            IF v_has_total_gross THEN
                v_update_sql := v_update_sql || ', total_gross = $2';
            ELSIF v_has_total_gross_pay THEN
                v_update_sql := v_update_sql || ', total_gross_pay = $2';
            END IF;
            
            IF v_has_total_deductions THEN
                v_update_sql := v_update_sql || ', total_deductions = $' || (CASE WHEN (v_has_total_gross OR v_has_total_gross_pay) THEN '3' ELSE '2' END);
            ELSIF v_has_total_tax_amount THEN
                v_update_sql := v_update_sql || ', total_tax_amount = $' || (CASE WHEN (v_has_total_gross OR v_has_total_gross_pay) THEN '3' ELSE '2' END);
            END IF;
            
            IF v_has_total_net THEN
                v_update_sql := v_update_sql || ', total_net = $' || (
                    CASE 
                        WHEN (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount) THEN '4'
                        WHEN (v_has_total_gross OR v_has_total_gross_pay) OR (v_has_total_deductions OR v_has_total_tax_amount) THEN '3'
                        ELSE '2'
                    END
                );
            ELSIF v_has_total_net_pay THEN
                v_update_sql := v_update_sql || ', total_net_pay = $' || (
                    CASE 
                        WHEN (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount) THEN '4'
                        WHEN (v_has_total_gross OR v_has_total_gross_pay) OR (v_has_total_deductions OR v_has_total_tax_amount) THEN '3'
                        ELSE '2'
                    END
                );
            END IF;
            
            v_update_sql := v_update_sql || ', status = CASE WHEN status = ''draft'' THEN ''processing'' ELSE status END, updated_at = now() WHERE id = $' || (
                CASE 
                    WHEN (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount) AND (v_has_total_net OR v_has_total_net_pay) THEN '5'
                    WHEN ((v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount)) OR 
                         ((v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_net OR v_has_total_net_pay)) OR
                         ((v_has_total_deductions OR v_has_total_tax_amount) AND (v_has_total_net OR v_has_total_net_pay)) THEN '4'
                    WHEN (v_has_total_gross OR v_has_total_gross_pay) OR (v_has_total_deductions OR v_has_total_tax_amount) OR (v_has_total_net OR v_has_total_net_pay) THEN '3'
                    ELSE '2'
                END
            );
            
            -- Execute with correct number of parameters
            IF (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount) AND (v_has_total_net OR v_has_total_net_pay) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_gross, v_total_deductions_sum, v_total_net, p_period_id;
            ELSIF (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_deductions OR v_has_total_tax_amount) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_gross, v_total_deductions_sum, p_period_id;
            ELSIF (v_has_total_gross OR v_has_total_gross_pay) AND (v_has_total_net OR v_has_total_net_pay) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_gross, v_total_net, p_period_id;
            ELSIF (v_has_total_deductions OR v_has_total_tax_amount) AND (v_has_total_net OR v_has_total_net_pay) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_deductions_sum, v_total_net, p_period_id;
            ELSIF (v_has_total_gross OR v_has_total_gross_pay) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_gross, p_period_id;
            ELSIF (v_has_total_deductions OR v_has_total_tax_amount) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_deductions_sum, p_period_id;
            ELSIF (v_has_total_net OR v_has_total_net_pay) THEN
                EXECUTE v_update_sql USING v_total_records, v_total_net, p_period_id;
            ELSE
                EXECUTE v_update_sql USING v_total_records, p_period_id;
            END IF;
        ELSE
            -- No total fields exist, just update basic fields
            UPDATE payroll_periods
            SET
                total_employees = v_total_records,
                status = CASE WHEN status = 'draft' THEN 'processing' ELSE status END,
                updated_at = now()
            WHERE id = p_period_id;
        END IF;
    END;
    
    -- Return summary
    RETURN QUERY SELECT
        v_total_records,
        v_total_gross,
        v_total_deductions_sum,
        v_total_net;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION generate_payroll_for_period(UUID) IS 
'Generates payroll records for a period using HR settings from system_settings. 
Applies settings for allowances, absences, overtime, tax, SSS, PhilHealth, and Pag-IBIG deductions.';

