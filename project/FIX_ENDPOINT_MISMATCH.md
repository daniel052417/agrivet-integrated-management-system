# 🔧 Fix Edge Function Endpoint Mismatch

## ❌ Problem
Your function is named `mfa-email` but the endpoint URL is:
```
https://prhxgpbqkpdnjpmxndyp.supabase.co/functions/v1/swift-processor
```

It should be:
```
https://prhxgpbqkpdnjpmxndyp.supabase.co/functions/v1/mfa-email
```

## ✅ Solution: Redeploy with Correct Name

### Option 1: Redeploy via CLI (Recommended)

1. **Delete the incorrectly named function** in Supabase Dashboard:
   - Go to Edge Functions
   - Find `mfa-email` (or `swift-processor` if that's what it's called)
   - Delete it

2. **Redeploy with correct name**:
   ```bash
   cd agrivet-integrated-management-system/project
   supabase functions deploy mfa-email
   ```

3. **Verify the endpoint**:
   - Check Supabase Dashboard → Edge Functions → mfa-email
   - Endpoint should be: `.../functions/v1/mfa-email`

### Option 2: Fix via Supabase Dashboard

1. Go to **Edge Functions** → **mfa-email**
2. Click on **"Details"** tab
3. Check if you can rename the function
4. If not, delete and recreate:
   - Go to **Code** tab
   - Copy all the code from `supabase/functions/mfa-email/index.ts`
   - Delete the function
   - Create new function named `mfa-email`
   - Paste the code
   - Deploy

### Option 3: Temporary Fix (Use Current Endpoint)

If you want to use the current endpoint temporarily, update the code:

**File:** `src/lib/emailApi.ts` (line 121)

**Change from:**
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mfa-email`, {
```

**Change to:**
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swift-processor`, {
```

⚠️ **Note:** This is a temporary workaround. You should redeploy with the correct name.

---

## 🎯 Recommended Action

**Redeploy the function** with the correct name using Option 1. This ensures:
- ✅ Consistent naming
- ✅ Easier maintenance
- ✅ Matches your codebase

---

## 🔍 Verify After Fix

After redeploying, verify:
1. Endpoint URL matches: `.../functions/v1/mfa-email`
2. Function name in dashboard: `mfa-email`
3. Test the endpoint with a simple request

---

## 📝 Why This Happened

This usually occurs when:
- Function was renamed but not redeployed
- Function was created with wrong name initially
- Multiple functions got mixed up

The fix is simple: just redeploy with the correct name!






