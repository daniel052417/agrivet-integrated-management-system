-- Enhanced Marketing Module Database Schema
-- Optimized for small-scale usage (1-2 users, 1 campaign/month)

-- Campaign Templates Table
CREATE TABLE IF NOT EXISTS campaign_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
    description TEXT,
    default_styles JSONB NOT NULL DEFAULT '{}',
    required_fields TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES campaign_templates(id),
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('hero_banner', 'promo_card', 'popup')),
    
    -- Content Fields
    title VARCHAR(500) NOT NULL,
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
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    publish_date TIMESTAMP WITH TIME ZONE,
    unpublish_date TIMESTAMP WITH TIME ZONE,
    
    -- Targeting
    target_audience TEXT[] DEFAULT '{}',
    target_channels TEXT[] DEFAULT '{}',
    target_devices TEXT[] DEFAULT '{}', -- mobile, desktop, tablet
    target_times JSONB DEFAULT '{}', -- time-based targeting
    
    -- Analytics
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    
    -- Approval Workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Analytics Table
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'conversion', 'impression')),
    event_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    device_type VARCHAR(20), -- mobile, desktop, tablet
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Schedules Table
CREATE TABLE IF NOT EXISTS campaign_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    recurrence_pattern JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Notifications Table
CREATE TABLE IF NOT EXISTS client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('email', 'push', 'in_app')),
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'delivered', 'failed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    -- Targeting
    target_audience TEXT[] DEFAULT '{}',
    target_devices TEXT[] DEFAULT '{}',
    
    -- Rich Content
    html_content TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    html_content TEXT,
    variables TEXT[] DEFAULT '{}', -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles for Marketing Module
CREATE TABLE IF NOT EXISTS marketing_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'marketing_manager', 'viewer')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Audit Logs for Marketing Actions
CREATE TABLE IF NOT EXISTS marketing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_template_id ON marketing_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_active ON marketing_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_is_published ON marketing_campaigns(is_published);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_publish_date ON marketing_campaigns(publish_date);

CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_created_at ON campaign_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_client_notifications_status ON client_notifications(status);
CREATE INDEX IF NOT EXISTS idx_client_notifications_scheduled_at ON client_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_client_notifications_created_by ON client_notifications(created_by);

-- Row Level Security Policies
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_templates
CREATE POLICY "Allow full access to campaign templates for authenticated users" ON campaign_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_campaigns
CREATE POLICY "Allow full access to marketing campaigns for authenticated users" ON marketing_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for campaign_analytics
CREATE POLICY "Allow full access to campaign analytics for authenticated users" ON campaign_analytics
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for campaign_schedules
CREATE POLICY "Allow full access to campaign schedules for authenticated users" ON campaign_schedules
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for client_notifications
CREATE POLICY "Allow full access to client notifications for authenticated users" ON client_notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for notification_templates
CREATE POLICY "Allow full access to notification templates for authenticated users" ON notification_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_user_roles
CREATE POLICY "Allow full access to marketing user roles for authenticated users" ON marketing_user_roles
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for marketing_audit_logs
CREATE POLICY "Allow full access to marketing audit logs for authenticated users" ON marketing_audit_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE ON campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_schedules_updated_at BEFORE UPDATE ON campaign_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_notifications_updated_at BEFORE UPDATE ON client_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_user_roles_updated_at BEFORE UPDATE ON marketing_user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates
INSERT INTO campaign_templates (template_name, template_type, description, default_styles, required_fields, created_by) VALUES
('Hero Banner Template', 'hero_banner', 'Full-width banner for homepage', 
 '{"width": "100%", "height": "300px", "background": "#f8f9fa", "textAlign": "center", "padding": "40px", "borderRadius": "8px"}',
 '{"title", "description", "cta_text", "cta_url"}', 
 (SELECT id FROM users LIMIT 1)),
 
('Promo Card Template', 'promo_card', 'Card-style promotion',
 '{"width": "300px", "height": "200px", "background": "#ffffff", "borderRadius": "12px", "boxShadow": "0 4px 6px rgba(0,0,0,0.1)", "padding": "20px"}',
 '{"title", "description", "cta_text", "cta_url"}',
 (SELECT id FROM users LIMIT 1)),
 
('Popup Template', 'popup', 'Modal popup for special offers',
 '{"width": "400px", "height": "300px", "background": "#ffffff", "borderRadius": "12px", "boxShadow": "0 10px 25px rgba(0,0,0,0.2)", "padding": "30px", "position": "fixed", "top": "50%", "left": "50%", "transform": "translate(-50%, -50%)", "zIndex": 1000}',
 '{"title", "description", "cta_text", "cta_url"}',
 (SELECT id FROM users LIMIT 1));

-- Insert default notification templates
INSERT INTO notification_templates (template_name, notification_type, subject, message, html_content, variables, created_by) VALUES
('Welcome Email', 'email', 'Welcome to {{company_name}}!', 'Hi {{customer_name}}, welcome to our platform!', 
 '<h1>Welcome to {{company_name}}!</h1><p>Hi {{customer_name}}, welcome to our platform!</p>',
 '{"company_name", "customer_name"}',
 (SELECT id FROM users LIMIT 1)),
 
('Promotion Push', 'push', 'Special Offer!', 'Don''t miss out on our special offer: {{offer_title}}',
 '<div><h2>Special Offer!</h2><p>Don''t miss out on our special offer: {{offer_title}}</p></div>',
 '{"offer_title"}',
 (SELECT id FROM users LIMIT 1));
