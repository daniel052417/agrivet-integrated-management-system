# Guest Account Upgrade Test Guide

## Testing the Integration

### 1. **Start as Guest**
```typescript
// In your PWA, start a guest session
await startGuestSession()
// This creates an anonymous auth.users record and guest customer record
```

### 2. **Add Some Guest Data**
- Add items to cart
- Set user preferences
- Browse products
- Any guest session data

### 3. **Test Registration (Should Upgrade Guest)**
```typescript
// When user clicks "Register" in AuthSelection
// The system should:
// 1. Detect that current user is a guest
// 2. Call upgradeGuestAccount() instead of register()
// 3. Update existing auth.users record
// 4. Update existing customer record (set is_guest = false)
// 5. Preserve all guest session data
```

### 4. **Verify No Duplicates**
```sql
-- Check that only one auth.users record exists
SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';

-- Check that only one customer record exists
SELECT id, user_id, email, is_guest FROM customers WHERE email = 'test@example.com';

-- Verify guest data was preserved
SELECT * FROM customers WHERE email = 'test@example.com';
```

## Expected Behavior

### ✅ **Before Integration (Current Issue)**
- Guest session creates `auth.users` record
- Registration creates **new** `auth.users` record
- **Result**: Duplicate records, 409 Conflict error

### ✅ **After Integration (Fixed)**
- Guest session creates `auth.users` record
- Registration **updates existing** `auth.users` record
- **Result**: No duplicates, seamless upgrade

## Debug Steps

### 1. **Check Current User Status**
```typescript
const { guestUpgradeService } = await import('./services/guestUpgradeService')
const isGuest = await guestUpgradeService.isCurrentUserGuest()
console.log('Is current user a guest?', isGuest)
```

### 2. **Check Guest Data**
```typescript
const guestData = await guestUpgradeService.getCurrentGuestData()
console.log('Current guest data:', guestData)
```

### 3. **Test Upgrade Manually**
```typescript
const result = await guestUpgradeService.upgradeGuestAccount({
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
})
console.log('Upgrade result:', result)
```

## Common Issues & Solutions

### Issue: "Guest account not found"
**Solution**: Ensure user is actually logged in as guest
```typescript
// Check if user has a guest session
const { data: { user } } = await supabase.auth.getUser()
console.log('Current user:', user)
```

### Issue: "Email already registered"
**Solution**: Email is taken by another account
- Use a different email for testing
- Or check for existing accounts

### Issue: "Auth update failed"
**Solution**: Check Supabase Auth configuration
- Verify RLS policies
- Check user permissions
- Ensure proper environment variables

### Issue: "Customer update failed"
**Solution**: Check database constraints
- Verify RLS policies on customers table
- Check for constraint violations
- Ensure proper foreign key relationships

## Database Verification Queries

```sql
-- Check all guest accounts
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.is_guest,
  c.created_at,
  au.email as auth_email
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
WHERE c.is_guest = true;

-- Check for duplicate emails
SELECT email, COUNT(*) as count
FROM customers 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check auth.users for duplicates
SELECT email, COUNT(*) as count
FROM auth.users 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Success Indicators

### ✅ **Successful Upgrade**
1. No 409 Conflict errors
2. Only one `auth.users` record per email
3. Only one `customers` record per email
4. `is_guest = false` after upgrade
5. All guest session data preserved
6. User can login with new credentials

### ❌ **Failed Upgrade**
1. 409 Conflict errors
2. Multiple records for same email
3. Guest data lost
4. User cannot login after upgrade
5. Database constraint violations

## Next Steps After Testing

1. **If successful**: Deploy to production
2. **If issues found**: Check error logs and debug queries
3. **If duplicates exist**: Clean up existing duplicates first
4. **If RLS issues**: Update RLS policies as needed

## Production Considerations

1. **Monitor logs** for upgrade attempts
2. **Track success rates** of guest upgrades
3. **Set up alerts** for failed upgrades
4. **Regular cleanup** of old guest accounts
5. **Performance monitoring** of upgrade process



