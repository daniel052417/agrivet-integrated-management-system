# Product Image Upload Setup Guide

This guide will help you set up image upload functionality for the Inventory Management system.

## Prerequisites

1. Supabase project with storage enabled
2. Database tables: `products`, `product_variants`, `inventory`, `branches`, `categories`, `suppliers`

## Setup Steps

### 1. Database Schema Update

Make sure your `product_variants` table has the `image_url` column:

```sql
ALTER TABLE product_variants 
ADD COLUMN image_url TEXT;
```

### 2. Create Storage Bucket

Run the SQL script `setup-storage.sql` in your Supabase SQL Editor to:
- Create a `product-images` storage bucket
- Set up proper RLS policies
- Configure file size limits (5MB) and allowed MIME types

### 3. Update RPC Function

Run the SQL script `update-rpc-function.sql` to update the `get_inventory_with_details` function to include the `image_url` field.

### 4. Storage Bucket Configuration

In your Supabase dashboard:
1. Go to Storage
2. Verify the `product-images` bucket exists
3. Check that it's set to public
4. Verify file size limit is 5MB
5. Confirm allowed MIME types include: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

## Features

### Image Upload
- **File Types**: JPG, PNG, GIF, WebP
- **File Size**: Maximum 5MB
- **Storage**: Supabase Storage with public URLs
- **Preview**: Real-time image preview in modal
- **Validation**: Client-side file type and size validation

### Image Display
- **Table View**: Thumbnail images in product list
- **Modal Preview**: Full-size preview in add/edit modals
- **Fallback**: Default icon when no image is uploaded
- **Responsive**: Images scale properly on different screen sizes

### Image Management
- **Upload**: Drag & drop or click to upload
- **Change**: Replace existing images
- **Remove**: Delete images with confirmation
- **Edit**: Update images when editing products

## Usage

### Adding a Product with Image
1. Click "Add Product" button
2. Fill in product details
3. Click "Upload Image" button
4. Select an image file
5. Preview will appear automatically
6. Click "Add Product" to save

### Editing a Product Image
1. Click edit button on any product
2. Current image will be displayed
3. Click "Change Image" to upload new image
4. Or click the X button to remove current image
5. Click "Save Changes" to update

## Troubleshooting

### Common Issues

1. **Upload fails**: Check Supabase storage bucket configuration
2. **Images not displaying**: Verify RLS policies are set correctly
3. **File too large**: Ensure file is under 5MB
4. **Invalid file type**: Only image files are allowed

### Debug Steps

1. Check browser console for errors
2. Verify Supabase storage bucket exists
3. Check RLS policies in Supabase dashboard
4. Confirm `image_url` column exists in `product_variants` table

## Security Notes

- Images are stored in a public bucket
- RLS policies control access
- File validation prevents malicious uploads
- File size limits prevent abuse
