# Debug Authentication Integration Guide

## Overview
This debug system provides detailed logging for every step of the authentication flow to help identify exactly where issues are occurring.

## Files Created

### 1. Debug Auth Service
**File**: `src/pwa/src/services/authServiceDebug.ts`
- Detailed logging at every step
- Retry logic for customer record fetching
- Manual fallback customer creation
- Database access testing
- RLS policy testing

### 2. Debug Test Page
**File**: `src/pwa/src/pages/AuthDebugTest.tsx`
- Interactive test interface
- Real-time log display
- Database access testing
- Registration and login testing

## How to Use

### Step 1: Replace Your Auth Service (Temporarily)
In your main auth context or wherever you're calling the auth service, temporarily replace:

```typescript
// Instead of:
import { authService } from './services/authService'

// Use:
import { authServiceDebug as authService } from './services/authServiceDebug'
```

### Step 2: Use the Debug Test Page
Add the debug test page to your routing:

```typescript
// In your App.tsx or routing file
import { AuthDebugTest } from './pages/AuthDebugTest'

// Add route:
<Route path="/debug-auth" element={<AuthDebugTest />} />
```

### Step 3: Run Tests
1. Navigate to `/debug-auth` in your browser
2. Fill in the test form
3. Click "Test Registration" or "Test Login"
4. Watch the detailed logs in real-time
5. Check the results section for any errors

## What the Debug Logs Show

### Registration Flow
1. **Step 1**: Supabase Auth signup call and response
2. **Step 2**: Waiting for trigger to create customer record
3. **Step 3**: Attempting to fetch customer record (with retries)
4. **Step 4**: Manual customer creation fallback (if trigger failed)
5. **Step 5**: RLS policy testing
6. **Step 6**: Session creation

### Login Flow
1. **Step 1**: Supabase Auth signin call and response
2. **Step 2**: Customer record fetching
3. **Step 3**: Session creation

### Database Access Test
1. **Test 1**: Customers table read access
2. **Test 2**: Customers table insert access
3. **Cleanup**: Test data removal

## Common Issues and What to Look For

### Issue 1: RLS Policy Blocking
**Look for**: `RLS test response: { hasError: true }`
**Solution**: Run the RLS fix script

### Issue 2: Trigger Not Firing
**Look for**: `Customer record not found after all retries`
**Solution**: Check trigger function and database logs

### Issue 3: Timing Issues
**Look for**: `Customer fetch error` on first attempts, then success
**Solution**: Increase retry delay or add more retries

### Issue 4: Missing Required Fields
**Look for**: `Manual customer creation failed` with constraint errors
**Solution**: Check table structure and required fields

## Debug Output Examples

### Successful Registration
```
[10:30:15] 🚀 Starting registration test...
[10:30:15] 🔐 AuthServiceDebug: Step 1 - Calling Supabase Auth signUp...
[10:30:16] ✅ AuthServiceDebug: Step 1 - User created in auth.users successfully
[10:30:16] 🔄 AuthServiceDebug: Step 2 - Waiting for trigger to create customer record...
[10:30:18] ✅ AuthServiceDebug: Step 3 - Customer record found: { id: "...", email: "test@example.com" }
[10:30:18] ✅ Registration completed: SUCCESS
```

### Failed Registration (RLS Issue)
```
[10:30:15] 🚀 Starting registration test...
[10:30:15] 🔐 AuthServiceDebug: Step 1 - Calling Supabase Auth signUp...
[10:30:16] ✅ AuthServiceDebug: Step 1 - User created in auth.users successfully
[10:30:18] ❌ AuthServiceDebug: Step 3 - Customer fetch error: { code: "PGRST116", message: "Cannot coerce the result to a single JSON object" }
[10:30:20] ❌ AuthServiceDebug: Step 4 - Manual customer creation failed: { message: "new row violates row-level security policy" }
[10:30:20] ❌ Registration completed: FAILED
```

## Next Steps

1. **Run the debug tests** to identify the exact issue
2. **Check the logs** for specific error messages
3. **Apply the appropriate fix** based on the error type
4. **Re-run the tests** to verify the fix works
5. **Switch back to normal auth service** once everything works

## Cleanup

Once debugging is complete:
1. Remove the debug test page from your routing
2. Switch back to the normal auth service
3. Remove the debug service file (optional, or keep for future debugging)

This debug system will give you complete visibility into what's happening during the authentication flow and help you identify the exact cause of any issues.





