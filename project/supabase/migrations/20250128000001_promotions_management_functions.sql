-- =====================================================
-- AGRIVET ERP - Promotions Management Functions
-- Database functions for PromotionsManagement.tsx
-- =====================================================

-- Function to increment promotion views
CREATE OR REPLACE FUNCTION increment_promotion_views(promotion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promotions 
  SET total_views = total_views + 1,
      updated_at = NOW()
  WHERE id = promotion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment promotion clicks
CREATE OR REPLACE FUNCTION increment_promotion_clicks(promotion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promotions 
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE id = promotion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update promotion status based on dates
CREATE OR REPLACE FUNCTION update_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on current date
  IF NEW.start_date > NOW() THEN
    NEW.status = 'upcoming';
  ELSIF NEW.end_date < NOW() THEN
    NEW.status = 'expired';
  ELSIF NEW.start_date <= NOW() AND NEW.end_date >= NOW() THEN
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status on insert/update
DROP TRIGGER IF EXISTS update_promotion_status_trigger ON promotions;
CREATE TRIGGER update_promotion_status_trigger
  BEFORE INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_status();

-- Function to get promotion statistics
CREATE OR REPLACE FUNCTION get_promotion_stats()
RETURNS TABLE (
  total_promotions BIGINT,
  active_promotions BIGINT,
  upcoming_promotions BIGINT,
  expired_promotions BIGINT,
  draft_promotions BIGINT,
  total_views BIGINT,
  total_clicks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_promotions,
    COUNT(*) FILTER (WHERE status = 'active') as active_promotions,
    COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming_promotions,
    COUNT(*) FILTER (WHERE status = 'expired') as expired_promotions,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_promotions,
    COALESCE(SUM(total_views), 0) as total_views,
    COALESCE(SUM(total_clicks), 0) as total_clicks
  FROM promotions;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for promotion images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotion-images', 
  'promotion-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for promotion images bucket
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

-- Set up RLS policies for promotions table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read promotions
CREATE POLICY "Allow authenticated users to read promotions" ON promotions
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert promotions
CREATE POLICY "Allow authenticated users to insert promotions" ON promotions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update promotions
CREATE POLICY "Allow authenticated users to update promotions" ON promotions
  FOR UPDATE TO authenticated
  USING (true);

-- Policy: Allow authenticated users to delete promotions
CREATE POLICY "Allow authenticated users to delete promotions" ON promotions
  FOR DELETE TO authenticated
  USING (true);

-- Policy: Allow anonymous users to read active promotions (for PWA)
CREATE POLICY "Allow anonymous users to read active promotions" ON promotions
  FOR SELECT TO anon
  USING (status = 'active' AND show_on_pwa = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_promotion_type ON promotions(promotion_type);
CREATE INDEX IF NOT EXISTS idx_promotions_total_views ON promotions(total_views);
CREATE INDEX IF NOT EXISTS idx_promotions_total_clicks ON promotions(total_clicks);
CREATE INDEX IF NOT EXISTS idx_promotions_show_on_pwa ON promotions(show_on_pwa) WHERE show_on_pwa = true;
CREATE INDEX IF NOT EXISTS idx_promotions_share_to_facebook ON promotions(share_to_facebook) WHERE share_to_facebook = true;
