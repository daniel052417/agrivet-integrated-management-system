-- Quick Fix: Create promotion-images storage bucket
-- Run this in your Supabase SQL Editor

-- First, check if bucket already exists
SELECT * FROM storage.buckets WHERE id = 'promotion-images';

-- If the above query returns no results, create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotion-images',
  'promotion-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access for promotion images" ON storage.objects
FOR SELECT USING (bucket_id = 'promotion-images');

CREATE POLICY "Authenticated users can upload promotion images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update promotion images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete promotion images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'promotion-images' 
  AND auth.role() = 'authenticated'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'promotion-images';

-- Test the policies
SELECT * FROM storage.objects WHERE bucket_id = 'promotion-images' LIMIT 1;


