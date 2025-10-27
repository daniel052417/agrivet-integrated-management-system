-- Create Facebook integration tables for Phase 4B
-- This migration creates the database schema for the Facebook integration system

-- Create facebook_pages table
CREATE TABLE IF NOT EXISTS public.facebook_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id VARCHAR(255) NOT NULL UNIQUE,
    page_name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    permissions TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    last_sync TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    webhook_verify_token VARCHAR(255),
    webhook_secret VARCHAR(255),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_posts table
CREATE TABLE IF NOT EXISTS public.facebook_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facebook_post_id VARCHAR(255) UNIQUE,
    page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT[],
    hashtags TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    template_id UUID,
    promotion_id UUID REFERENCES public.promotions(id),
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_templates table
CREATE TABLE IF NOT EXISTS public.facebook_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('product', 'seasonal', 'announcement', 'promotion', 'general')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('marketing', 'sales', 'news', 'events', 'tips')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    variables JSONB,
    hashtags TEXT[],
    call_to_action TEXT,
    media_required BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_analytics table
CREATE TABLE IF NOT EXISTS public.facebook_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.facebook_posts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('reach', 'engagement', 'likes', 'comments', 'shares', 'clicks', 'impressions')),
    value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_settings table
CREATE TABLE IF NOT EXISTS public.facebook_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
    auto_post BOOLEAN DEFAULT false,
    post_frequency VARCHAR(20) DEFAULT 'daily' CHECK (post_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    post_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    include_images BOOLEAN DEFAULT true,
    include_hashtags BOOLEAN DEFAULT true,
    hashtag_strategy VARCHAR(20) DEFAULT 'trending' CHECK (hashtag_strategy IN ('trending', 'custom', 'mixed')),
    post_format VARCHAR(20) DEFAULT 'detailed' CHECK (post_format IN ('simple', 'detailed', 'minimal')),
    include_call_to_action BOOLEAN DEFAULT true,
    call_to_action_text VARCHAR(255) DEFAULT 'Visit our store today!',
    target_audience VARCHAR(20) DEFAULT 'all' CHECK (target_audience IN ('all', 'followers', 'custom')),
    exclude_weekends BOOLEAN DEFAULT false,
    max_posts_per_day INTEGER DEFAULT 3,
    min_interval_hours INTEGER DEFAULT 4,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_webhooks table
CREATE TABLE IF NOT EXISTS public.facebook_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
    webhook_id VARCHAR(255) NOT NULL,
    webhook_url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    last_received TIMESTAMP WITH TIME ZONE,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create facebook_insights table
CREATE TABLE IF NOT EXISTS public.facebook_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.facebook_pages(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('page_fans', 'page_impressions', 'page_engaged_users', 'page_post_engagements', 'page_video_views')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('day', 'week', 'days_28')),
    value INTEGER NOT NULL DEFAULT 0,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_pages_page_id ON public.facebook_pages(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_status ON public.facebook_pages(status);
CREATE INDEX IF NOT EXISTS idx_facebook_pages_created_by ON public.facebook_pages(created_by);

CREATE INDEX IF NOT EXISTS idx_facebook_posts_page_id ON public.facebook_posts(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_status ON public.facebook_posts(status);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_scheduled_for ON public.facebook_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_published_at ON public.facebook_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_facebook_posts_facebook_post_id ON public.facebook_posts(facebook_post_id);

CREATE INDEX IF NOT EXISTS idx_facebook_templates_type ON public.facebook_templates(type);
CREATE INDEX IF NOT EXISTS idx_facebook_templates_category ON public.facebook_templates(category);
CREATE INDEX IF NOT EXISTS idx_facebook_templates_status ON public.facebook_templates(status);

CREATE INDEX IF NOT EXISTS idx_facebook_analytics_page_id ON public.facebook_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_analytics_post_id ON public.facebook_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_facebook_analytics_date ON public.facebook_analytics(date);
CREATE INDEX IF NOT EXISTS idx_facebook_analytics_metric_type ON public.facebook_analytics(metric_type);

CREATE INDEX IF NOT EXISTS idx_facebook_settings_page_id ON public.facebook_settings(page_id);

CREATE INDEX IF NOT EXISTS idx_facebook_webhooks_page_id ON public.facebook_webhooks(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_webhooks_status ON public.facebook_webhooks(status);

CREATE INDEX IF NOT EXISTS idx_facebook_insights_page_id ON public.facebook_insights(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_insights_insight_type ON public.facebook_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_facebook_insights_end_time ON public.facebook_insights(end_time);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facebook_pages_updated_at BEFORE UPDATE ON public.facebook_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_posts_updated_at BEFORE UPDATE ON public.facebook_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_templates_updated_at BEFORE UPDATE ON public.facebook_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_settings_updated_at BEFORE UPDATE ON public.facebook_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_webhooks_updated_at BEFORE UPDATE ON public.facebook_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update template usage count
CREATE OR REPLACE FUNCTION update_facebook_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE public.facebook_templates 
        SET usage_count = usage_count + 1,
            last_used = NOW()
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facebook_template_usage_trigger
    AFTER INSERT ON public.facebook_posts
    FOR EACH ROW EXECUTE FUNCTION update_facebook_template_usage_count();

-- Create function to get Facebook page analytics
CREATE OR REPLACE FUNCTION get_facebook_page_analytics(page_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    total_posts INTEGER,
    total_reach INTEGER,
    total_engagement INTEGER,
    total_likes INTEGER,
    total_comments INTEGER,
    total_shares INTEGER,
    total_clicks INTEGER,
    average_reach DECIMAL(10,2),
    average_engagement DECIMAL(10,2),
    engagement_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_posts,
        COALESCE(SUM(reach), 0)::INTEGER as total_reach,
        COALESCE(SUM(engagement), 0)::INTEGER as total_engagement,
        COALESCE(SUM(likes), 0)::INTEGER as total_likes,
        COALESCE(SUM(comments), 0)::INTEGER as total_comments,
        COALESCE(SUM(shares), 0)::INTEGER as total_shares,
        COALESCE(SUM(clicks), 0)::INTEGER as total_clicks,
        ROUND(AVG(reach), 2) as average_reach,
        ROUND(AVG(engagement), 2) as average_engagement,
        ROUND(
            (COALESCE(SUM(engagement), 0)::DECIMAL / NULLIF(COALESCE(SUM(reach), 0), 0)) * 100, 2
        ) as engagement_rate
    FROM public.facebook_posts
    WHERE page_id = page_uuid
    AND published_at IS NOT NULL
    AND published_at::DATE BETWEEN start_date AND end_date;
END;
$$ language 'plpgsql';

-- Create function to get scheduled posts
CREATE OR REPLACE FUNCTION get_scheduled_facebook_posts(page_uuid UUID)
RETURNS TABLE (
    post_id UUID,
    content TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    template_name VARCHAR(255),
    promotion_title VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.id as post_id,
        fp.content,
        fp.scheduled_for,
        ft.name as template_name,
        p.title as promotion_title
    FROM public.facebook_posts fp
    LEFT JOIN public.facebook_templates ft ON fp.template_id = ft.id
    LEFT JOIN public.promotions p ON fp.promotion_id = p.id
    WHERE fp.page_id = page_uuid
    AND fp.status = 'scheduled'
    AND fp.scheduled_for > NOW()
    ORDER BY fp.scheduled_for ASC;
END;
$$ language 'plpgsql';

-- Create function to clean up old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_facebook_analytics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.facebook_analytics
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create function to expire old access tokens
CREATE OR REPLACE FUNCTION expire_old_facebook_tokens()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.facebook_pages 
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS)
ALTER TABLE public.facebook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for facebook_pages
CREATE POLICY "Users can view facebook pages" ON public.facebook_pages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook pages" ON public.facebook_pages
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update facebook pages" ON public.facebook_pages
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete facebook pages" ON public.facebook_pages
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for facebook_posts
CREATE POLICY "Users can view facebook posts" ON public.facebook_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook posts" ON public.facebook_posts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update facebook posts" ON public.facebook_posts
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete facebook posts" ON public.facebook_posts
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for facebook_templates
CREATE POLICY "Users can view facebook templates" ON public.facebook_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook templates" ON public.facebook_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update facebook templates" ON public.facebook_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete facebook templates" ON public.facebook_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for facebook_analytics
CREATE POLICY "Users can view facebook analytics" ON public.facebook_analytics
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook analytics" ON public.facebook_analytics
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for facebook_settings
CREATE POLICY "Users can view facebook settings" ON public.facebook_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook settings" ON public.facebook_settings
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update facebook settings" ON public.facebook_settings
    FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for facebook_webhooks
CREATE POLICY "Users can view facebook webhooks" ON public.facebook_webhooks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook webhooks" ON public.facebook_webhooks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update facebook webhooks" ON public.facebook_webhooks
    FOR UPDATE USING (true);

-- Create RLS policies for facebook_insights
CREATE POLICY "Users can view facebook insights" ON public.facebook_insights
    FOR SELECT USING (true);

CREATE POLICY "Users can insert facebook insights" ON public.facebook_insights
    FOR INSERT WITH CHECK (true);

-- Insert sample data
INSERT INTO public.facebook_templates (name, content, type, category, status, created_by) VALUES
('Product Promotion', '🌱 New arrivals at Tiongson Agrivet! Check out our latest agricultural products and get the best deals. #Agriculture #Farming #TiongsonAgrivet', 'product', 'marketing', 'active', (SELECT id FROM auth.users LIMIT 1)),
('Seasonal Offer', '🌾 Seasonal farming supplies now available! Don''t miss out on our special offers for this planting season. #SeasonalOffer #FarmingSupplies', 'seasonal', 'sales', 'active', (SELECT id FROM auth.users LIMIT 1)),
('Store Update', '📍 Tiongson Agrivet is now open! Visit us for all your agricultural needs. We''re here to help you grow! #StoreUpdate #OpenNow', 'announcement', 'news', 'active', (SELECT id FROM auth.users LIMIT 1));

-- Create a scheduled job to clean up old data (this would be set up in your cron job system)
-- SELECT cron.schedule('cleanup-facebook-analytics', '0 2 * * 0', 'SELECT cleanup_old_facebook_analytics();');
-- SELECT cron.schedule('expire-facebook-tokens', '0 0 * * *', 'SELECT expire_old_facebook_tokens();');
