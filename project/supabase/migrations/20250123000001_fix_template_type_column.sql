-- Fix template_type column issue
-- This migration ensures the template_type column exists in marketing_campaigns table

-- Check if the column exists, if not add it
DO $$ 
BEGIN
    -- Check if the marketing_campaigns table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_campaigns') THEN
        -- Check if template_type column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'marketing_campaigns' 
            AND column_name = 'template_type'
        ) THEN
            -- Add the template_type column
            ALTER TABLE marketing_campaigns 
            ADD COLUMN template_type VARCHAR(50) NOT NULL DEFAULT 'hero_banner' 
            CHECK (template_type IN ('hero_banner', 'promo_card', 'popup'));
            
            -- Update existing records to have a default template_type
            UPDATE marketing_campaigns 
            SET template_type = 'hero_banner' 
            WHERE template_type IS NULL;
        END IF;
    END IF;
END $$;

-- Ensure the campaign_templates table exists with proper structure
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

-- Insert default campaign templates if they don't exist
INSERT INTO campaign_templates (template_name, template_type, description, default_styles, required_fields) 
SELECT * FROM (VALUES
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
    )
) AS v(template_name, template_type, description, default_styles, required_fields)
WHERE NOT EXISTS (
    SELECT 1 FROM campaign_templates WHERE template_type = v.template_type
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_template_type ON marketing_campaigns(template_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_active ON marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_published ON marketing_campaigns(is_published);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);

