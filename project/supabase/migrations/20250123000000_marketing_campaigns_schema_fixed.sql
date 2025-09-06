-- Marketing Campaign Management Schema - Fixed Version
-- This migration creates tables for comprehensive marketing campaign management
-- Updated to use correct user ID references (UUID)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Marketing Campaign Templates
CREATE TABLE IF NOT EXISTS campaign_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
    description TEXT,
    default_styles JSONB,
    required_fields JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES campaign_templates(id),
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
    
    -- Content Fields
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content
    
    -- Visual Customization
    background_color VARCHAR(7), -- Hex color
    text_color VARCHAR(7), -- Hex color
    image_url TEXT,
    image_alt_text VARCHAR(255),
    
    -- Call to Action
    cta_text VARCHAR(100),
    cta_url TEXT,
    cta_button_color VARCHAR(7),
    cta_text_color VARCHAR(7),
    
    -- Campaign Settings
    is_active BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE,
    unpublish_date TIMESTAMP WITH TIME ZONE,
    
    -- Targeting
    target_audience TEXT[], -- Array of audience segments
    target_channels TEXT[], -- Array of channels (website, email, sms, social)
    
    -- Analytics
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    
    -- Metadata - Updated to use correct user ID reference
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'conversion', 'impression')),
    event_data JSONB,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Scheduling
CREATE TABLE IF NOT EXISTS campaign_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    recurrence_pattern JSONB, -- For recurring campaigns
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default campaign templates
INSERT INTO campaign_templates (template_name, template_type, description, default_styles, required_fields) VALUES
(
    'Hero Banner',
    'hero_banner',
    'Large banner for homepage or landing pages',
    '{"width": "100%", "height": "400px", "background": "#f8f9fa", "textAlign": "center", "padding": "60px 20px"}',
    '["title", "description", "cta_text", "cta_url"]'
),
(
    'Promo Card',
    'promo_card',
    'Compact promotional card for product pages or sidebars',
    '{"width": "300px", "height": "200px", "background": "#ffffff", "borderRadius": "8px", "boxShadow": "0 2px 8px rgba(0,0,0,0.1)", "padding": "20px"}',
    '["title", "description", "cta_text", "cta_url"]'
),
(
    'Popup Modal',
    'popup',
    'Modal popup for special offers or announcements',
    '{"width": "500px", "height": "400px", "background": "#ffffff", "borderRadius": "12px", "boxShadow": "0 4px 20px rgba(0,0,0,0.15)", "padding": "30px", "position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%, -50%)"}',
    '["title", "description", "cta_text", "cta_url"]'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_template_type ON marketing_campaigns(template_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_active ON marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_published ON marketing_campaigns(is_published);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_schedules_campaign_id ON campaign_schedules(campaign_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE ON campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_schedules_updated_at BEFORE UPDATE ON campaign_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_templates (read-only for all authenticated users)
CREATE POLICY "Allow read access to campaign templates" ON campaign_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_campaigns
CREATE POLICY "Allow full access to marketing campaigns for admin and marketing roles" ON marketing_campaigns
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role IN ('admin', 'marketing')
            )
        )
    );

-- RLS Policies for campaign_analytics (read-only for admin and marketing)
CREATE POLICY "Allow read access to campaign analytics for admin and marketing roles" ON campaign_analytics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role IN ('admin', 'marketing')
            )
        )
    );

-- RLS Policies for campaign_schedules
CREATE POLICY "Allow full access to campaign schedules for admin and marketing roles" ON campaign_schedules
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.role IN ('admin', 'marketing')
            )
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON campaign_templates TO authenticated;
GRANT ALL ON marketing_campaigns TO authenticated;
GRANT ALL ON campaign_analytics TO authenticated;
GRANT ALL ON campaign_schedules TO authenticated;

