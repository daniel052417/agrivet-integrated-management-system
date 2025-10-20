-- Simple product_images table creation
-- This is a minimal version without the is_active column to avoid the error

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'gallery' NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to product images
CREATE POLICY "Public read access for product images" ON public.product_images
    FOR SELECT USING (true);

-- Allow authenticated users to manage product images
CREATE POLICY "Authenticated users can insert product images" ON public.product_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images" ON public.product_images
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON public.product_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.product_images TO authenticated;
GRANT SELECT ON public.product_images TO anon;

-- Add some sample data for testing
INSERT INTO public.product_images (product_id, image_url, image_name, image_type, alt_text, sort_order)
VALUES 
    ('product-1', 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Product+1+Main', 'Product 1 Main Image', 'main', 'Main product image', 0),
    ('product-1', 'https://via.placeholder.com/400x300/059669/FFFFFF?text=Product+1+Gallery+1', 'Product 1 Gallery 1', 'gallery', 'Gallery image 1', 1),
    ('product-1', 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Product+1+Gallery+2', 'Product 1 Gallery 2', 'gallery', 'Gallery image 2', 2),
    ('product-2', 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Product+2+Main', 'Product 2 Main Image', 'main', 'Main product image', 0),
    ('product-2', 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Product+2+Gallery+1', 'Product 2 Gallery 1', 'gallery', 'Gallery image 1', 1),
    ('product-3', 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Product+3+Main', 'Product 3 Main Image', 'main', 'Main product image', 0)
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product with metadata';
COMMENT ON COLUMN public.product_images.image_type IS 'Type of image: main, gallery, thumbnail, etc.';
COMMENT ON COLUMN public.product_images.sort_order IS 'Order for displaying images in gallery';
COMMENT ON COLUMN public.product_images.alt_text IS 'Alternative text for accessibility';
