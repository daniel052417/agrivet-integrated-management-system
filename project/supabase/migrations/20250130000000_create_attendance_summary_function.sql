-- Create function to get attendance summary per staff member for a date range
-- This function calculates: total days, present, absent, late, leave days, total hours, overtime, and allowance eligible days

CREATE OR REPLACE FUNCTION get_attendance_summary(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    staff_id UUID,
    staff_name TEXT,
    total_days INTEGER,
    present_days INTEGER,
    absent_days INTEGER,
    late_days INTEGER,
    leave_days INTEGER,
    total_hours NUMERIC(10, 2),
    overtime_hours NUMERIC(10, 2),
    allowance_eligible_days INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff RECORD;
    v_date DATE;
    v_total_days INTEGER;
    v_present_days INTEGER;
    v_absent_days INTEGER;
    v_late_days INTEGER;
    v_leave_days INTEGER;
    v_total_hours NUMERIC(10, 2);
    v_overtime_hours NUMERIC(10, 2);
    v_allowance_eligible_days INTEGER;
    v_attendance_record RECORD;
    v_working_days INTEGER;
    v_hours_calculated NUMERIC(10, 2);
BEGIN
    -- Calculate total working days in the period (excluding weekends)
    SELECT COUNT(*)::INTEGER
    INTO v_working_days
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS day
    WHERE EXTRACT(DOW FROM day) NOT IN (0, 6); -- Exclude Sunday (0) and Saturday (6)

    -- Loop through all active staff members
    FOR v_staff IN 
        SELECT s.id, s.first_name, s.last_name
        FROM staff s
        WHERE s.is_active = true
        ORDER BY s.first_name, s.last_name
    LOOP
        -- Initialize counters
        v_total_days := 0;
        v_present_days := 0;
        v_absent_days := 0;
        v_late_days := 0;
        v_leave_days := 0;
        v_total_hours := 0;
        v_overtime_hours := 0;
        v_allowance_eligible_days := 0;

        -- Loop through each date in the range
        FOR v_date IN 
            SELECT day::DATE
            FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS day
            WHERE EXTRACT(DOW FROM day) NOT IN (0, 6) -- Exclude weekends
        LOOP
            v_total_days := v_total_days + 1;

            -- Check if there's an attendance record for this date
            SELECT *
            INTO v_attendance_record
            FROM attendance a
            WHERE a.staff_id = v_staff.id
              AND a.attendance_date = v_date
            LIMIT 1;

            IF FOUND THEN
                -- Attendance record exists
                CASE v_attendance_record.status
                    WHEN 'present' THEN
                        v_present_days := v_present_days + 1;
                        -- Check if late
                        IF v_attendance_record.is_late = true THEN
                            v_late_days := v_late_days + 1;
                        ELSE
                            -- Only count as allowance eligible if not late
                            v_allowance_eligible_days := v_allowance_eligible_days + 1;
                        END IF;
                    WHEN 'late' THEN
                        v_present_days := v_present_days + 1;
                        v_late_days := v_late_days + 1;
                    WHEN 'absent' THEN
                        v_absent_days := v_absent_days + 1;
                    WHEN 'on_leave' THEN
                        v_leave_days := v_leave_days + 1;
                    WHEN 'half_day' THEN
                        v_present_days := v_present_days + 1;
                        v_allowance_eligible_days := v_allowance_eligible_days + 1;
                    ELSE
                        -- Unknown status, count as absent
                        v_absent_days := v_absent_days + 1;
                END CASE;

                -- Accumulate hours
                -- Use total_hours if available, otherwise calculate from time_in and time_out
                IF v_attendance_record.total_hours IS NOT NULL THEN
                    v_total_hours := v_total_hours + COALESCE(v_attendance_record.total_hours, 0);
                ELSIF v_attendance_record.time_in IS NOT NULL AND v_attendance_record.time_out IS NOT NULL THEN
                    -- Calculate hours from time_in and time_out
                    v_hours_calculated := EXTRACT(EPOCH FROM (v_attendance_record.time_out - v_attendance_record.time_in)) / 3600.0;
                    v_total_hours := v_total_hours + COALESCE(v_hours_calculated, 0);
                END IF;

                -- Accumulate overtime hours
                IF v_attendance_record.overtime_hours IS NOT NULL THEN
                    v_overtime_hours := v_overtime_hours + COALESCE(v_attendance_record.overtime_hours, 0);
                END IF;
            ELSE
                -- No attendance record = absent
                v_absent_days := v_absent_days + 1;
            END IF;
        END LOOP;

        -- Return the summary for this staff member
        RETURN QUERY SELECT
            v_staff.id,
            (v_staff.first_name || ' ' || v_staff.last_name)::TEXT,
            v_total_days,
            v_present_days,
            v_absent_days,
            v_late_days,
            v_leave_days,
            COALESCE(v_total_hours, 0),
            COALESCE(v_overtime_hours, 0),
            v_allowance_eligible_days;
    END LOOP;

    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_attendance_summary(DATE, DATE) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_attendance_summary(DATE, DATE) IS 
'Calculates attendance summary per staff member for a date range. Returns total days, present, absent, late, leave days, total hours, overtime hours, and allowance eligible days.';

