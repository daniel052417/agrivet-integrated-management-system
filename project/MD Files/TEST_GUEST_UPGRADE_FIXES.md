# Test Guest Upgrade Fixes

## Issues Fixed

### ✅ **Fix 1: Removed Duplicate Guest Session Creation**
- **Before**: `startSession()` called before every auth action, creating new guest sessions
- **After**: Guest check happens FIRST, no unnecessary session creation

### ✅ **Fix 2: Fixed Guest Check Timing**
- **Before**: Guest check happened AFTER creating new session
- **After**: Guest check happens BEFORE any auth changes

### ✅ **Fix 3: Added RLS Policy & Fixed Service**
- **Before**: Service tried to update customers directly, missing RLS policy
- **After**: Service uses triggers, proper RLS policies added

## Testing Steps

### 1. **Run Database Setup**
```sql
-- Run the RLS policy fix
\i project/fix_guest_upgrade_rls_policies.sql

-- Run the guest upgrade solution
\i project/guest_account_upgrade_solution.sql
```

### 2. **Test Guest Session Creation**
```typescript
// In your PWA console or test file
const { startGuestSession } = await import('./src/services/supabase')
const { guestUpgradeService } = await import('./src/services/guestUpgradeService')

// Start as guest
console.log('🔄 Starting guest session...')
const guestSuccess = await startGuestSession()
console.log('Guest session started:', guestSuccess)

// Check if user is guest
const isGuest = await guestUpgradeService.isCurrentUserGuest()
console.log('Is current user a guest?', isGuest)

// Get guest data
const guestData = await guestUpgradeService.getCurrentGuestData()
console.log('Guest data:', guestData)
```

### 3. **Test Registration Flow (Should Upgrade Guest)**
```typescript
// Try to register - this should detect guest and upgrade instead of creating new account
const { useAuth } = await import('./src/contexts/AuthContext')
const { upgradeGuestAccount } = useAuth()

const result = await upgradeGuestAccount({
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
})

console.log('Upgrade result:', result)
```

### 4. **Verify No Duplicates**
```sql
-- Check auth.users - should only be ONE record
SELECT id, email, created_at, raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';

-- Check customers - should only be ONE record
SELECT id, user_id, email, is_guest, first_name, last_name
FROM customers 
WHERE email = 'test@example.com';

-- Check for any duplicate emails
SELECT email, COUNT(*) as count
FROM customers 
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Expected Results

### ✅ **Successful Guest Upgrade**
1. **No 409 Conflict errors** - because no new sessions are created
2. **Single auth.users record** - existing record updated, not duplicated
3. **Single customers record** - existing record updated, not duplicated
4. **is_guest = false** - after successful upgrade
5. **All guest data preserved** - cart, preferences, analytics
6. **User can login** - with new credentials

### ❌ **If Still Failing**
1. **Check RLS policies** - run the policy verification query
2. **Check trigger function** - verify it exists and is working
3. **Check console logs** - look for specific error messages
4. **Check database logs** - look for trigger execution logs

## Debug Queries

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;
```

### Check Trigger Function
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_guest_upgrade';
```

### Check Trigger Exists
```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_guest_upgrade';
```

### Check Guest Accounts
```sql
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.is_guest,
  c.first_name,
  c.last_name,
  c.created_at,
  au.email as auth_email,
  au.created_at as auth_created
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
WHERE c.is_guest = true
ORDER BY c.created_at DESC;
```

## Common Issues & Solutions

### Issue: "No guest account found"
**Cause**: User not actually logged in as guest
**Solution**: Ensure `startGuestSession()` was called and user is authenticated

### Issue: "RLS policy violation"
**Cause**: Missing or incorrect RLS policy
**Solution**: Run `fix_guest_upgrade_rls_policies.sql`

### Issue: "Trigger failed to update customer record"
**Cause**: Trigger function not working or RLS blocking update
**Solution**: Check trigger exists and RLS policies allow updates

### Issue: "Auth update failed"
**Cause**: Supabase Auth configuration issue
**Solution**: Check environment variables and Supabase project settings

## Performance Monitoring

### Check Upgrade Success Rate
```sql
-- Count successful upgrades (is_guest = false)
SELECT COUNT(*) as upgraded_accounts
FROM customers 
WHERE is_guest = false 
AND created_at > NOW() - INTERVAL '1 day';

-- Count remaining guest accounts
SELECT COUNT(*) as remaining_guests
FROM customers 
WHERE is_guest = true;
```

### Check for Failed Upgrades
```sql
-- Look for customers with email but still marked as guest
SELECT id, email, is_guest, created_at, updated_at
FROM customers 
WHERE email IS NOT NULL 
AND email != '' 
AND is_guest = true
ORDER BY updated_at DESC;
```

## Success Criteria

The fix is working correctly when:

1. ✅ **No 409 Conflict errors** during registration
2. ✅ **Single record per email** in both auth.users and customers
3. ✅ **Guest data preserved** during upgrade
4. ✅ **is_guest = false** after upgrade
5. ✅ **User can login** with new credentials
6. ✅ **No duplicate sessions** created

If all criteria are met, the guest upgrade solution is working correctly!



