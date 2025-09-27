# 🚨 Quick Fix: Storage Bucket Error

## The Problem
```
StorageApiError: Bucket not found
```

This means the `product-images` storage bucket doesn't exist in your Supabase project.

## ✅ Quick Solution

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click **"Storage"** in the left sidebar
3. Click **"New Bucket"**

### Step 2: Create the Bucket
Fill in these exact settings:
- **Name**: `product-images`
- **Public**: ✅ **Check this box** (very important!)
- **File size limit**: `5242880` (5MB)
- **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### Step 3: Click "Create Bucket"

## 🔧 Alternative: Use SQL

If you prefer SQL, run this in your Supabase SQL Editor:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Set up policies
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

## ✅ Test It

After creating the bucket:
1. Go back to your Inventory Management page
2. Try adding a product with an image
3. The upload should work now!

## 🆘 Still Having Issues?

If you're still getting errors:
1. Check that the bucket is **public** (not private)
2. Verify the bucket name is exactly `product-images`
3. Make sure your Supabase project has Storage enabled
4. Check the browser console for more detailed error messages
