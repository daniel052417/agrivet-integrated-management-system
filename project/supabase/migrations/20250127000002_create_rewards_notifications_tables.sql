-- Create rewards and notifications tables for Phase 3B
-- This migration creates the database schema for the rewards and notifications system

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('points', 'discount', 'access', 'gift', 'voucher')),
    value DECIMAL(10,2) NOT NULL DEFAULT 0,
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN ('first_purchase', 'loyalty_level', 'referral', 'birthday', 'vip_member', 'custom')),
    condition_value TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'draft')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    max_usage INTEGER,
    current_usage INTEGER DEFAULT 0,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reward', 'loyalty', 'promotion', 'welcome', 'transaction', 'system', 'marketing')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed', 'cancelled')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'webhook')),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('all_customers', 'loyal_customers', 'new_customers', 'vip_customers', 'specific_customers', 'segments')),
    target_value TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    template_id UUID,
    campaign_id UUID,
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('welcome', 'loyalty', 'promotion', 'transaction', 'system', 'marketing')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    variables JSONB,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_rewards table (tracks which customers have received which rewards)
CREATE TABLE IF NOT EXISTS public.customer_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'earned' CHECK (status IN ('earned', 'used', 'expired', 'cancelled')),
    transaction_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_deliveries table (tracks delivery status of notifications)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_conditions table (defines complex reward conditions)
CREATE TABLE IF NOT EXISTS public.reward_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    condition_type VARCHAR(50) NOT NULL,
    condition_value TEXT NOT NULL,
    operator VARCHAR(10) NOT NULL DEFAULT 'equals' CHECK (operator IN ('equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_campaigns table (groups related notifications)
CREATE TABLE IF NOT EXISTS public.notification_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_dates ON public.rewards(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rewards_created_by ON public.rewards(created_by);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON public.notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_status ON public.notification_templates(status);

CREATE INDEX IF NOT EXISTS idx_customer_rewards_customer ON public.customer_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_reward ON public.customer_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_status ON public.customer_rewards(status);
CREATE INDEX IF NOT EXISTS idx_customer_rewards_earned ON public.customer_rewards(earned_at);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON public.notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_customer ON public.notification_deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_sent ON public.notification_deliveries(sent_at);

CREATE INDEX IF NOT EXISTS idx_reward_conditions_reward ON public.reward_conditions(reward_id);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status ON public.notification_campaigns(status);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_campaigns_updated_at BEFORE UPDATE ON public.notification_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update reward usage count
CREATE OR REPLACE FUNCTION update_reward_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'used' THEN
        UPDATE public.rewards 
        SET current_usage = current_usage + 1 
        WHERE id = NEW.reward_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'used' AND NEW.status = 'used' THEN
        UPDATE public.rewards 
        SET current_usage = current_usage + 1 
        WHERE id = NEW.reward_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'used' AND NEW.status != 'used' THEN
        UPDATE public.rewards 
        SET current_usage = current_usage - 1 
        WHERE id = NEW.reward_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reward_usage_trigger
    AFTER INSERT OR UPDATE ON public.customer_rewards
    FOR EACH ROW EXECUTE FUNCTION update_reward_usage_count();

-- Create function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE public.notification_templates 
        SET usage_count = usage_count + 1,
            last_used = NOW()
        WHERE id = NEW.template_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_usage_trigger
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_template_usage_count();

-- Create function to get active rewards for a customer
CREATE OR REPLACE FUNCTION get_active_rewards_for_customer(customer_uuid UUID)
RETURNS TABLE (
    reward_id UUID,
    reward_name VARCHAR(255),
    reward_type VARCHAR(50),
    reward_value DECIMAL(10,2),
    earned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as reward_id,
        r.name as reward_name,
        r.type as reward_type,
        r.value as reward_value,
        cr.earned_at,
        r.end_date as expires_at
    FROM public.rewards r
    JOIN public.customer_rewards cr ON r.id = cr.reward_id
    WHERE cr.customer_id = customer_uuid
    AND cr.status = 'earned'
    AND r.status = 'active'
    AND (r.end_date IS NULL OR r.end_date > NOW());
END;
$$ language 'plpgsql';

-- Create function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(notification_uuid UUID)
RETURNS TABLE (
    total_sent INTEGER,
    total_delivered INTEGER,
    total_opened INTEGER,
    total_clicked INTEGER,
    open_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sent,
        COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END)::INTEGER as total_delivered,
        COUNT(CASE WHEN status IN ('opened', 'clicked') THEN 1 END)::INTEGER as total_opened,
        COUNT(CASE WHEN status = 'clicked' THEN 1 END)::INTEGER as total_clicked,
        ROUND(
            (COUNT(CASE WHEN status IN ('opened', 'clicked') THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END), 0)) * 100, 2
        ) as open_rate,
        ROUND(
            (COUNT(CASE WHEN status = 'clicked' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN status IN ('delivered', 'opened', 'clicked') THEN 1 END), 0)) * 100, 2
        ) as click_rate
    FROM public.notification_deliveries
    WHERE notification_id = notification_uuid;
END;
$$ language 'plpgsql';

-- Create function to expire old rewards
CREATE OR REPLACE FUNCTION expire_old_rewards()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Update expired rewards
    UPDATE public.rewards 
    SET status = 'expired'
    WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Update customer rewards that are expired
    UPDATE public.customer_rewards 
    SET status = 'expired'
    WHERE status = 'earned'
    AND reward_id IN (
        SELECT id FROM public.rewards 
        WHERE status = 'expired'
    );
    
    RETURN expired_count;
END;
$$ language 'plpgsql';

-- Create function to clean up old notification deliveries
CREATE OR REPLACE FUNCTION cleanup_old_notification_deliveries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notification_deliveries
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('failed', 'bounced');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS)
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rewards
CREATE POLICY "Users can view rewards" ON public.rewards
    FOR SELECT USING (true);

CREATE POLICY "Users can insert rewards" ON public.rewards
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update rewards" ON public.rewards
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete rewards" ON public.rewards
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications" ON public.notifications
    FOR SELECT USING (true);

CREATE POLICY "Users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for notification templates
CREATE POLICY "Users can view templates" ON public.notification_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert templates" ON public.notification_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update templates" ON public.notification_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete templates" ON public.notification_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for customer rewards
CREATE POLICY "Users can view customer rewards" ON public.customer_rewards
    FOR SELECT USING (true);

CREATE POLICY "Users can insert customer rewards" ON public.customer_rewards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customer rewards" ON public.customer_rewards
    FOR UPDATE USING (true);

-- Create RLS policies for notification deliveries
CREATE POLICY "Users can view notification deliveries" ON public.notification_deliveries
    FOR SELECT USING (true);

CREATE POLICY "Users can insert notification deliveries" ON public.notification_deliveries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update notification deliveries" ON public.notification_deliveries
    FOR UPDATE USING (true);

-- Create RLS policies for reward conditions
CREATE POLICY "Users can view reward conditions" ON public.reward_conditions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert reward conditions" ON public.reward_conditions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update reward conditions" ON public.reward_conditions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete reward conditions" ON public.reward_conditions
    FOR DELETE USING (true);

-- Create RLS policies for notification campaigns
CREATE POLICY "Users can view campaigns" ON public.notification_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Users can insert campaigns" ON public.notification_campaigns
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update campaigns" ON public.notification_campaigns
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete campaigns" ON public.notification_campaigns
    FOR DELETE USING (auth.uid() = created_by);

-- Insert sample data
INSERT INTO public.rewards (name, description, type, value, condition_type, status, priority, start_date, end_date, max_usage, icon, color, created_by) VALUES
('Welcome Bonus', 'Get 100 points for your first purchase', 'points', 100, 'first_purchase', 'active', 'high', '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 1000, 'gift', 'emerald', (SELECT id FROM auth.users LIMIT 1)),
('Loyalty Discount', '10% off for customers with 5+ purchases', 'discount', 10, 'loyalty_level', 'active', 'medium', '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 500, 'percent', 'blue', (SELECT id FROM auth.users LIMIT 1)),
('Referral Reward', 'Earn 50 points for each successful referral', 'points', 50, 'referral', 'active', 'medium', '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 1000, 'users', 'purple', (SELECT id FROM auth.users LIMIT 1)),
('Birthday Special', 'Special 20% discount on your birthday month', 'discount', 20, 'birthday', 'active', 'high', '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 200, 'cake', 'pink', (SELECT id FROM auth.users LIMIT 1)),
('VIP Exclusive', 'Exclusive access to premium products for VIP members', 'access', 0, 'vip_member', 'active', 'high', '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', 50, 'crown', 'gold', (SELECT id FROM auth.users LIMIT 1));

INSERT INTO public.notification_templates (name, subject, content, type, category, status, created_by) VALUES
('Welcome Email', 'Welcome to Tiongson Agrivet!', 'Thank you for joining us. Here''s your welcome bonus...', 'email', 'welcome', 'active', (SELECT id FROM auth.users LIMIT 1)),
('Loyalty Points Update', 'Your Loyalty Points Have Been Updated', 'Great news! You''ve earned new loyalty points...', 'email', 'loyalty', 'active', (SELECT id FROM auth.users LIMIT 1)),
('Promotion Alert', 'Special Offer - Limited Time!', 'Don''t miss out on our special promotion...', 'email', 'promotion', 'active', (SELECT id FROM auth.users LIMIT 1));

-- Create a scheduled job to expire old rewards (this would be set up in your cron job system)
-- SELECT cron.schedule('expire-rewards', '0 0 * * *', 'SELECT expire_old_rewards();');
-- SELECT cron.schedule('cleanup-deliveries', '0 2 * * 0', 'SELECT cleanup_old_notification_deliveries();');
