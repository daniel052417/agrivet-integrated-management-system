# MFA Edge Function Name Change

## ✅ **Updated Function Name**

The MFA Edge Function has been renamed from `send-email` to `mfa-email` to avoid conflicts with existing email sending logic.

---

## 📝 **Changes Made**

### **Code Changes:**
- ✅ `src/lib/emailApi.ts` - Updated fetch URL to use `mfa-email`
- ✅ Documentation updated to reflect new function name

### **Edge Function:**
- Function name: `mfa-email` (instead of `send-email`)
- URL: `https://YOUR_PROJECT.supabase.co/functions/v1/mfa-email`

---

## 🔧 **Deployment**

### **If Using Supabase CLI:**

```bash
# Deploy the function
supabase functions deploy mfa-email
```

### **If Using Supabase Dashboard:**

1. Go to **Edge Functions**
2. Create new function or rename existing one to: `mfa-email`
3. Copy the function code from `supabase/functions/send-email/index.ts`
4. Deploy

---

## ✅ **Verification**

To verify the function is deployed correctly:

```javascript
// Test in browser console
fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/mfa-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    to: 'test@example.com',
    name: 'Test User',
    otpCode: '123456',
    expiryMinutes: 5,
    type: 'otp'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📌 **Important Notes**

- The old `send-email` function remains for other email types (activation, confirmation)
- The new `mfa-email` function is specifically for MFA OTP emails
- Both functions can coexist if needed
- The code in `emailApi.ts` now correctly calls `mfa-email` for OTP emails

---

## 🔄 **File Structure**

If you want to organize the functions:

```
supabase/functions/
├── send-email/          # For activation/confirmation emails
│   └── index.ts
└── mfa-email/           # For MFA OTP emails
    └── index.ts
```

Both can use the same code structure, just deployed with different names.









