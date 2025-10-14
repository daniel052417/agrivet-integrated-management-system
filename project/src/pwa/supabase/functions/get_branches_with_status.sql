-- Create a function to get branches with real-time status
CREATE OR REPLACE FUNCTION get_branches_with_status()
RETURNS TABLE (
  id uuid,
  name text,
  code text,
  address text,
  city text,
  province text,
  phone text,
  email text,
  branch_type text,
  open_time time,
  close_time time,
  is_open boolean,
  real_time_status text,
  payment_options text[]
) AS $$
BEGIN
  RETURN QUERY
  WITH current_time_info AS (
    SELECT 
      now()::time AS now_time,
      extract(dow FROM now())::int AS today_dow
  )
  SELECT 
    b.id,
    b.name,
    b.code,
    b.address,
    b.city,
    b.province,
    b.phone,
    b.email,
    b.branch_type,
    boh.open_time,
    boh.close_time,
    boh.is_open,
    -- Real-time status logic
    CASE
      WHEN boh.is_open = false THEN 'Closed Today'
      WHEN ct.now_time BETWEEN boh.open_time AND boh.close_time 
        THEN CASE 
          WHEN ct.now_time >= boh.close_time - interval '30 minutes' 
            THEN 'Closing Soon (30 mins)'
          ELSE 'Open'
        END
      WHEN ct.now_time < boh.open_time 
        THEN 'Opening in ' || extract(epoch FROM (boh.open_time - ct.now_time))/3600 || ' hours'
      ELSE 'Closed'
    END AS real_time_status,
    -- Payment options (for now static, can later be from another table)
    ARRAY['GCash', 'PayMaya', 'Cash at Pickup']::text[] AS payment_options
  FROM branches b
  JOIN branch_operating_hours boh 
    ON b.id = boh.branch_id
  JOIN current_time_info ct ON ct.today_dow = boh.day_of_week
  WHERE b.is_active = true;
END;
$$ LANGUAGE plpgsql;













