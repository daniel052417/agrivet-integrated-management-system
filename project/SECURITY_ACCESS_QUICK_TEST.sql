-- ============================================================================
-- Security & Access Tab - Quick Test SQL Queries
-- ============================================================================
-- Copy and paste these queries into Supabase SQL Editor for quick testing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK CURRENT SECURITY SETTINGS
-- ----------------------------------------------------------------------------
SELECT 
  key,
  value->'security' as security_settings,
  updated_by,
  updated_at
FROM system_settings
WHERE key = 'app_settings';

-- ----------------------------------------------------------------------------
-- 2. CHECK ACTIVE USER SESSIONS (Before Logout All)
-- ----------------------------------------------------------------------------
SELECT 
  id,
  user_id,
  is_active,
  status,
  logout_time,
  created_at,
  last_activity,
  ip_address
FROM user_sessions
WHERE is_active = true
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 3. CHECK ONLINE USERS (Before Logout All)
-- ----------------------------------------------------------------------------
SELECT 
  u.id,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  u.status,
  u.current_session_id,
  u.last_activity
FROM users u
WHERE u.status != 'offline'
ORDER BY u.last_activity DESC;

-- ----------------------------------------------------------------------------
-- 4. COUNT ACTIVE SESSIONS BY USER
-- ----------------------------------------------------------------------------
SELECT 
  u.email,
  COUNT(us.id) as active_sessions,
  MAX(us.last_activity) as last_activity
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
GROUP BY u.email
ORDER BY active_sessions DESC;

-- ----------------------------------------------------------------------------
-- 5. VERIFY LOGOUT ALL SESSIONS (After clicking "Logout All Sessions")
-- ----------------------------------------------------------------------------
-- Should return 0 rows if successful
SELECT 
  COUNT(*) as remaining_active_sessions
FROM user_sessions
WHERE is_active = true;

-- Should return 0 rows if successful
SELECT 
  COUNT(*) as remaining_online_users
FROM users
WHERE status != 'offline';

-- Should return 0 rows if successful (POS sessions closed)
SELECT 
  COUNT(*) as remaining_active_pos_sessions
FROM pos_sessions
WHERE closed_at IS NULL 
  AND status = 'open';

-- ----------------------------------------------------------------------------
-- 6. CHECK RECENTLY LOGGED OUT SESSIONS
-- ----------------------------------------------------------------------------
SELECT 
  us.id,
  u.email,
  us.is_active,
  us.status,
  us.logout_time,
  us.created_at,
  us.logout_time - us.created_at as session_duration
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.logout_time IS NOT NULL
ORDER BY us.logout_time DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 6.1. CHECK RECENTLY CLOSED POS SESSIONS
-- ----------------------------------------------------------------------------
SELECT 
  ps.id,
  ps.session_number,
  u.email as cashier_email,
  ps.status,
  ps.closed_at,
  ps.opened_at,
  ps.closed_at - ps.opened_at as session_duration
FROM pos_sessions ps
JOIN users u ON ps.cashier_id = u.id
WHERE ps.closed_at IS NOT NULL
  AND ps.status = 'closed'
ORDER BY ps.closed_at DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 7. CHECK MFA SETTINGS
-- ----------------------------------------------------------------------------
SELECT 
  value->'security'->'requireMFA' as require_mfa,
  value->'security'->'mfaAppliesTo' as mfa_applies_to,
  value->'security'->'mfaAppliesTo'->'superAdmin' as super_admin_enabled,
  value->'security'->'mfaAppliesTo'->'cashier' as cashier_enabled
FROM system_settings
WHERE key = 'app_settings';

-- ----------------------------------------------------------------------------
-- 8. CHECK PASSWORD POLICY SETTINGS
-- ----------------------------------------------------------------------------
SELECT 
  value->'security'->'passwordMinLength' as min_length,
  value->'security'->'passwordRequireSpecial' as require_special,
  value->'security'->'passwordRequireMixedCase' as require_mixed_case
FROM system_settings
WHERE key = 'app_settings';

-- ----------------------------------------------------------------------------
-- 9. CHECK SESSION TIMEOUT & LOGIN ATTEMPTS
-- ----------------------------------------------------------------------------
SELECT 
  value->'security'->'sessionTimeout' as session_timeout_minutes,
  value->'security'->'loginAttempts' as max_login_attempts,
  value->'security'->'lockoutDuration' as lockout_duration_minutes
FROM system_settings
WHERE key = 'app_settings';

-- ----------------------------------------------------------------------------
-- 10. CHECK ALL SECURITY SETTINGS AT ONCE
-- ----------------------------------------------------------------------------
SELECT 
  value->'security'->'sessionTimeout' as session_timeout,
  value->'security'->'loginAttempts' as login_attempts,
  value->'security'->'lockoutDuration' as lockout_duration,
  value->'security'->'requireEmailVerification' as require_email_verification,
  value->'security'->'requireMFA' as require_mfa,
  value->'security'->'mfaAppliesTo' as mfa_applies_to,
  value->'security'->'passwordMinLength' as password_min_length,
  value->'security'->'passwordRequireSpecial' as password_require_special,
  value->'security'->'passwordRequireMixedCase' as password_require_mixed_case,
  value->'security'->'allowLoginOnlyVerifiedBrowsers' as allow_only_verified_browsers,
  value->'security'->'notifyOwnerOnNewDevice' as notify_on_new_device
FROM system_settings
WHERE key = 'app_settings';

-- ----------------------------------------------------------------------------
-- 11. CHECK SETTINGS UPDATE HISTORY
-- ----------------------------------------------------------------------------
SELECT 
  updated_by,
  updated_at,
  value->'security'->'sessionTimeout' as session_timeout,
  value->'security'->'requireMFA' as require_mfa
FROM system_settings
WHERE key = 'app_settings'
ORDER BY updated_at DESC;

-- ----------------------------------------------------------------------------
-- 12. TEST: CREATE A TEST ACTIVE SESSION (For Testing)
-- ----------------------------------------------------------------------------
-- WARNING: Only use for testing! Creates a fake session record
-- Uncomment and modify user_id if needed for testing
/*
INSERT INTO user_sessions (
  id,
  user_id,
  session_token,
  ip_address,
  user_agent,
  status,
  is_active,
  created_at,
  expires_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users LIMIT 1), -- Replace with actual user_id
  'test-session-token-' || gen_random_uuid(),
  '127.0.0.1',
  'Test Browser/1.0',
  'active',
  true,
  NOW(),
  NOW() + INTERVAL '24 hours'
);
*/

-- ----------------------------------------------------------------------------
-- 13. TEST: MANUALLY SET OLD MFA FORMAT (For Backward Compatibility Test)
-- ----------------------------------------------------------------------------
-- WARNING: This will overwrite current settings!
-- Uncomment to test backward compatibility migration
/*
UPDATE system_settings
SET value = jsonb_set(
  value,
  '{security,mfaAppliesTo}',
  '{"owner": true, "admin": true, "manager": false}'::jsonb
)
WHERE key = 'app_settings';
*/

-- ----------------------------------------------------------------------------
-- 14. VERIFY SETTINGS TABLE STRUCTURE
-- ----------------------------------------------------------------------------
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 15. VERIFY USER_SESSIONS TABLE STRUCTURE
-- ----------------------------------------------------------------------------
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_sessions'
AND column_name IN ('is_active', 'status', 'logout_time', 'updated_at')
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 16. VERIFY USERS TABLE STRUCTURE (for logout functionality)
-- ----------------------------------------------------------------------------
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('status', 'current_session_id')
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- 17. CHECK RLS POLICIES (Important for functionality)
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('system_settings', 'user_sessions', 'users')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 18. QUICK STATUS CHECK (All-in-one)
-- ----------------------------------------------------------------------------
SELECT 
  'Security Settings' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Found'
    ELSE '❌ Missing'
  END as status,
  MAX(updated_at) as last_updated
FROM system_settings
WHERE key = 'app_settings'

UNION ALL

SELECT 
  'Active Sessions' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' active'
    ELSE '✅ None active'
  END as status,
  MAX(created_at) as last_updated
FROM user_sessions
WHERE is_active = true

UNION ALL

SELECT 
  'Online Users' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' online'
    ELSE '✅ None online'
  END as status,
  MAX(last_activity) as last_updated
FROM users
WHERE status != 'offline'

UNION ALL

SELECT 
  'Active POS Sessions' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ ' || COUNT(*)::text || ' open'
    ELSE '✅ None open'
  END as status,
  MAX(opened_at) as last_updated
FROM pos_sessions
WHERE closed_at IS NULL 
  AND status = 'open';

-- ============================================================================
-- END OF QUICK TEST QUERIES
-- ============================================================================

