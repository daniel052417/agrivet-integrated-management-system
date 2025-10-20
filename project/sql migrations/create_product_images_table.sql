-- Create product_images table for storing multiple images per product
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    image_type VARCHAR(50) NOT NULL, -- 'main', 'gallery', 'thumbnail', etc.
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_is_active ON public.product_images(is_active);

-- Create RLS policies
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to product images
CREATE POLICY "Public read access for product images" ON public.product_images
    FOR SELECT USING (is_active = true);

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

-- Add comments
COMMENT ON TABLE public.product_images IS 'Stores multiple images for each product with metadata';
COMMENT ON COLUMN public.product_images.image_type IS 'Type of image: main, gallery, thumbnail, etc.';
COMMENT ON COLUMN public.product_images.sort_order IS 'Order for displaying images in gallery';
COMMENT ON COLUMN public.product_images.alt_text IS 'Alternative text for accessibility';
COMMENT ON COLUMN public.product_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.product_images.width IS 'Image width in pixels';
COMMENT ON COLUMN public.product_images.height IS 'Image height in pixels';

-- Create a function to get product images with metadata
CREATE OR REPLACE FUNCTION public.get_product_images(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    image_url TEXT,
    image_name VARCHAR(255),
    image_type VARCHAR(50),
    alt_text TEXT,
    sort_order INTEGER,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.product_id,
        pi.image_url,
        pi.image_name,
        pi.image_type,
        pi.alt_text,
        pi.sort_order,
        pi.file_size,
        pi.width,
        pi.height,
        pi.created_at
    FROM public.product_images pi
    WHERE pi.product_id = p_product_id
      AND pi.is_active = true
    ORDER BY pi.sort_order ASC, pi.created_at ASC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_product_images TO authenticated, anon;

-- Create a view for easy access to product images with product details
CREATE OR REPLACE VIEW public.product_images_with_details AS
SELECT 
    pi.id,
    pi.product_id,
    p.name as product_name,
    p.sku as product_sku,
    pi.image_url,
    pi.image_name,
    pi.image_type,
    pi.alt_text,
    pi.sort_order,
    pi.file_size,
    pi.width,
    pi.height,
    pi.is_active,
    pi.created_at,
    pi.updated_at
FROM public.product_images pi
JOIN public.products p ON pi.product_id = p.id
WHERE pi.is_active = true
ORDER BY pi.product_id, pi.sort_order ASC, pi.created_at ASC;

-- Grant access to the view
GRANT SELECT ON public.product_images_with_details TO authenticated, anon;
