# 🔧 Storage Troubleshooting Guide

## Current Issue
Even though you created the `product-images` bucket, you're still getting "Bucket not found" errors.

## 🔍 Debugging Steps

### Step 1: Verify Bucket Configuration
1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Find `product-images` bucket
4. **Verify these settings:**
   - ✅ **Name**: exactly `product-images` (case-sensitive)
   - ✅ **Public**: Must be checked/true
   - ✅ **File size limit**: 5242880 (5MB)
   - ✅ **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### Step 2: Check RLS Policies
1. Go to **Storage** → **Policies**
2. Look for policies on `storage.objects`
3. **Ensure you have these policies:**
   ```sql
   -- Public read access
   CREATE POLICY "Public read access for product images" ON storage.objects
   FOR SELECT USING (bucket_id = 'product-images');
   
   -- Authenticated upload
   CREATE POLICY "Authenticated users can upload product images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'product-images' 
     AND auth.role() = 'authenticated'
   );
   ```

### Step 3: Test Storage Access
Use the `StorageTest.tsx` component I created:

1. Import and use it temporarily in your app
2. Click "Test Storage Access"
3. Check the results in the console

### Step 4: Check Supabase Project Settings
1. Go to **Settings** → **API**
2. Verify your project URL and anon key
3. Make sure Storage is enabled for your project

## 🚨 Common Issues & Solutions

### Issue 1: Bucket Name Mismatch
**Problem**: Bucket exists but with different name
**Solution**: 
- Check exact spelling: `product-images` (not `product_images` or `Product-Images`)
- Delete and recreate with exact name

### Issue 2: Bucket Not Public
**Problem**: Bucket exists but is private
**Solution**:
- Go to bucket settings
- Check "Public" checkbox
- Save changes

### Issue 3: RLS Policies Missing
**Problem**: Bucket exists but no upload permissions
**Solution**: Run this SQL in your Supabase SQL Editor:
```sql
-- Create missing policies
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

### Issue 4: Wrong Project/Environment
**Problem**: Bucket exists in different project
**Solution**:
- Check your `.env` file
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Make sure you're looking at the right project

## 🧪 Quick Test

Run this in your browser console to test storage:

```javascript
// Replace with your actual values
const { createClient } = supabase;
const supabaseClient = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// Test bucket access
supabaseClient.storage.listBuckets().then(console.log);

// Test file upload
const testFile = new File(['test'], 'test.txt');
supabaseClient.storage.from('product-images').upload('test.txt', testFile).then(console.log);
```

## 🔄 Alternative: Use Different Bucket

If `product-images` still doesn't work, try using the default `avatars` bucket temporarily:

1. Change the bucket name in the code from `product-images` to `avatars`
2. Test if uploads work
3. If they do, the issue is with your `product-images` bucket configuration

## 📞 Still Having Issues?

If none of these steps work:

1. **Check browser console** for more detailed error messages
2. **Verify your Supabase project** has Storage enabled
3. **Try creating a new bucket** with a different name
4. **Check your Supabase plan** - some features might be limited

## ✅ Expected Behavior After Fix

Once fixed, you should see:
- ✅ No "Bucket not found" errors
- ✅ Images upload successfully
- ✅ Image previews work in the form
- ✅ Images display in the product table
