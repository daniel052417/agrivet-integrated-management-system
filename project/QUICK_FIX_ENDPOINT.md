# ⚡ Quick Fix: Use Current Endpoint

## Immediate Solution

Since your endpoint is currently `swift-processor`, here's a quick fix to make it work **right now**:

### Update `src/lib/emailApi.ts` (Line 123)

**Change:**
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mfa-email`, {
```

**To:**
```typescript
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swift-processor`, {
```

This will make your MFA emails work immediately using the current endpoint.

---

## 🔧 Proper Fix (Do This Next)

After testing, you should **redeploy the function** with the correct name:

```bash
cd agrivet-integrated-management-system/project
supabase functions deploy mfa-email --no-verify-jwt
```

Then change the code back to use `mfa-email` endpoint.

---

## ✅ Verification

After applying the quick fix:
1. Test MFA login
2. Check browser console - should see no CORS errors
3. Check Supabase Edge Function logs - should see requests coming in






