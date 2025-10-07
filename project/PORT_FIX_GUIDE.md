# Port Fix Guide - Vite Uses Port 5173

## ✅ Issue Resolved

Your development server is running on port **5173**, not port 3000.

## 🔧 What I Fixed

### 1. Updated Edge Function
- Changed default port from `3000` to `5173`
- Deployed the updated function

### 2. Current Status
- ✅ Server running on: `http://localhost:5173/`
- ✅ Edge Function updated with correct port
- ✅ Future emails will use correct port

## 🧪 Test the Activation Page

### Use the Correct URL:
```
http://localhost:5173/activate?token=35420c1e-0615-40b2-9b0f-59e2d9bf60f7
```

### Expected Result:
- ✅ AccountActivation component loads
- ✅ "Activate Your Account" form appears
- ✅ Password input fields are visible
- ✅ No more "connection refused" error

## 🔧 Optional: Set Environment Variable

To ensure future emails use the correct port, set this in Supabase:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/prhxgpbqkpdnjpmxndyp/functions

2. **Go to Settings → Edge Functions**

3. **Add/Update Environment Variable:**
   - `FRONTEND_URL` = `http://localhost:5173`

## 📱 What You Should See Now

When you visit the activation URL:
- Professional activation page
- "Activate Your Account" title
- Password input fields
- "Activate Account" button
- "Resend Activation Email" link

## 🚀 Next Steps

1. **Test the activation URL** with port 5173
2. **Verify the form works** correctly
3. **Test password setting** functionality
4. **Test account activation** flow

**The activation page should now work perfectly!**
