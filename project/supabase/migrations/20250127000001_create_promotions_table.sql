-- Create promotions table for Phase 1B
-- This table stores all promotion data for the marketing module

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    products JSONB DEFAULT '[]'::jsonb,
    categories JSONB DEFAULT '[]'::jsonb,
    show_on_pwa BOOLEAN DEFAULT true,
    show_on_facebook BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'expired')),
    max_uses INTEGER DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0),
    total_uses INTEGER DEFAULT 0 CHECK (total_uses >= 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_pwa ON public.promotions(show_on_pwa) WHERE show_on_pwa = true;
CREATE INDEX IF NOT EXISTS idx_promotions_facebook ON public.promotions(show_on_facebook) WHERE show_on_facebook = true;
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON public.promotions(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotions_updated_at 
    BEFORE UPDATE ON public.promotions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update promotion status based on dates
CREATE OR REPLACE FUNCTION update_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on current date
    IF NEW.end_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSIF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
        NEW.status = 'active';
    ELSE
        NEW.status = 'upcoming';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update status on insert/update
CREATE TRIGGER update_promotion_status_trigger
    BEFORE INSERT OR UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_status();

-- Create function to get active promotions for PWA
CREATE OR REPLACE FUNCTION get_active_promotions_for_pwa()
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    discount_type TEXT,
    discount_value DECIMAL(10,2),
    products JSONB,
    categories JSONB,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.discount_type,
        p.discount_value,
        p.products,
        p.categories,
        p.end_date
    FROM public.promotions p
    WHERE p.status = 'active' 
        AND p.show_on_pwa = true
        AND p.end_date >= CURRENT_DATE
    ORDER BY p.created_at DESC;
END;
$$ language 'plpgsql';

-- Create function to get promotion statistics
CREATE OR REPLACE FUNCTION get_promotion_stats()
RETURNS TABLE (
    total_promotions BIGINT,
    active_promotions BIGINT,
    upcoming_promotions BIGINT,
    expired_promotions BIGINT,
    total_uses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_promotions,
        COUNT(*) FILTER (WHERE status = 'active') as active_promotions,
        COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming_promotions,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_promotions,
        COALESCE(SUM(total_uses), 0) as total_uses
    FROM public.promotions;
END;
$$ language 'plpgsql';

-- Create RLS policies
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read promotions
CREATE POLICY "Users can view promotions" ON public.promotions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert promotions
CREATE POLICY "Users can create promotions" ON public.promotions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update promotions
CREATE POLICY "Users can update promotions" ON public.promotions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete promotions
CREATE POLICY "Users can delete promotions" ON public.promotions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.promotions TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_promotions_for_pwa() TO authenticated;
GRANT EXECUTE ON FUNCTION get_promotion_stats() TO authenticated;

-- Insert sample data for testing
INSERT INTO public.promotions (
    title, 
    description, 
    start_date, 
    end_date, 
    discount_type, 
    discount_value, 
    products, 
    categories, 
    show_on_pwa, 
    show_on_facebook, 
    max_uses,
    total_uses
) VALUES 
(
    'Summer Sale 2025',
    'Biggest summer promotion with up to 30% off on all fertilizers and agricultural supplies',
    '2025-01-15',
    '2025-02-15',
    'percent',
    30.00,
    '["FERT-001", "FERT-002", "FERT-003"]'::jsonb,
    '["Fertilizers", "Seeds"]'::jsonb,
    true,
    false,
    100,
    45
),
(
    'New Year Special',
    'Start the year right with special offers on premium seeds and organic products',
    '2024-12-20',
    '2025-01-10',
    'flat',
    50.00,
    '["SEED-001", "SEED-002"]'::jsonb,
    '["Seeds", "Organic"]'::jsonb,
    true,
    true,
    50,
    23
),
(
    'Valentine''s Day Promotion',
    'Spread love with our special Valentine''s offers on gardening tools and accessories',
    '2025-02-10',
    '2025-02-17',
    'percent',
    15.00,
    '["TOOL-001", "TOOL-002"]'::jsonb,
    '["Tools", "Accessories"]'::jsonb,
    true,
    true,
    75,
    0
);

-- Create a scheduled job function to update expired promotions
-- This would typically be called by a cron job or scheduled task
CREATE OR REPLACE FUNCTION update_expired_promotions()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.promotions 
    SET status = 'expired'
    WHERE end_date < CURRENT_DATE 
        AND status != 'expired';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ language 'plpgsql';

-- Grant execute permission for the scheduled job function
GRANT EXECUTE ON FUNCTION update_expired_promotions() TO authenticated;
