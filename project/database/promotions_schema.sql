-- =====================================================
-- AGRIVET ERP - Promotions & Engagement Module
-- Database Schema for Simplified Marketing System
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS promotion_analytics CASCADE;
DROP TABLE IF EXISTS promotion_views CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS event_campaigns CASCADE;
DROP TABLE IF EXISTS campaign_analytics CASCADE;
DROP TABLE IF EXISTS campaign_registrations CASCADE;

-- =====================================================
-- PROMOTIONS TABLE
-- =====================================================
CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('new_item', 'restock', 'event')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  show_in_pwa BOOLEAN DEFAULT true,
  share_to_facebook BOOLEAN DEFAULT false,
  total_views INT DEFAULT 0,
  total_clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- =====================================================
-- EVENT CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE event_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('workshop', 'launch', 'giveaway', 'celebration')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'upcoming')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  location VARCHAR(200),
  max_attendees INT,
  current_attendees INT DEFAULT 0,
  branches TEXT[], -- Array of branch names
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- =====================================================
-- PROMOTION ANALYTICS TABLE
-- =====================================================
CREATE TABLE promotion_analytics (
  id SERIAL PRIMARY KEY,
  promotion_id INT REFERENCES promotions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CAMPAIGN ANALYTICS TABLE
-- =====================================================
CREATE TABLE campaign_analytics (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES event_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  registrations INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CAMPAIGN REGISTRATIONS TABLE
-- =====================================================
CREATE TABLE campaign_registrations (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES event_campaigns(id) ON DELETE CASCADE,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100),
  customer_phone VARCHAR(20),
  registration_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist'))
);

-- =====================================================
-- PROMOTION VIEWS TABLE (for detailed tracking)
-- =====================================================
CREATE TABLE promotion_views (
  id SERIAL PRIMARY KEY,
  promotion_id INT REFERENCES promotions(id) ON DELETE CASCADE,
  user_id VARCHAR(100), -- Can be null for anonymous views
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Promotions indexes
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_type ON promotions(promotion_type);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_created_at ON promotions(created_at);

-- Event campaigns indexes
CREATE INDEX idx_campaigns_status ON event_campaigns(status);
CREATE INDEX idx_campaigns_type ON event_campaigns(event_type);
CREATE INDEX idx_campaigns_dates ON event_campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_created_at ON event_campaigns(created_at);

-- Analytics indexes
CREATE INDEX idx_promotion_analytics_promotion_date ON promotion_analytics(promotion_id, date);
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date);
CREATE INDEX idx_promotion_views_promotion ON promotion_views(promotion_id);
CREATE INDEX idx_promotion_views_date ON promotion_views(viewed_at);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update updated_at timestamp for promotions
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();

-- Update updated_at timestamp for event_campaigns
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaigns_updated_at
  BEFORE UPDATE ON event_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample promotions
INSERT INTO promotions (title, description, promotion_type, status, start_date, end_date, show_in_pwa, share_to_facebook, total_views, total_clicks, created_by) VALUES
('New Fertilizer Arrival', 'Fresh batch of premium fertilizers just arrived! Check out our latest stock of high-quality agricultural supplies.', 'new_item', 'active', '2025-01-15 00:00:00', '2025-02-15 23:59:59', true, true, 245, 45, 'John Doe'),
('Seed Restock Available', 'Popular seed varieties are back in stock! Get your planting season supplies now.', 'restock', 'active', '2025-01-10 00:00:00', '2025-01-25 23:59:59', true, false, 189, 23, 'Jane Smith'),
('Farmers Workshop Event', 'Join our free workshop on modern farming techniques. Learn from experts and network with fellow farmers.', 'event', 'upcoming', '2025-02-10 09:00:00', '2025-02-17 17:00:00', true, true, 0, 0, 'Mike Johnson');

-- Insert sample event campaigns
INSERT INTO event_campaigns (name, description, event_type, status, start_date, end_date, location, max_attendees, current_attendees, branches, created_by) VALUES
('Farmers Workshop 2025', 'Free workshop on modern farming techniques and sustainable agriculture practices', 'workshop', 'active', '2025-01-15 09:00:00', '2025-02-15 17:00:00', 'Main Store - Poblacion Branch', 50, 32, ARRAY['Poblacion Branch'], 'John Doe'),
('New Product Launch Event', 'Come see our latest agricultural equipment and tools demonstration', 'launch', 'ended', '2024-12-20 10:00:00', '2025-01-10 16:00:00', 'All Branches', 100, 78, ARRAY['All Branches'], 'Jane Smith'),
('Community Giveaway Event', 'Free seeds and farming supplies giveaway for local farmers', 'giveaway', 'upcoming', '2025-02-01 08:00:00', '2025-02-28 18:00:00', 'Poblacion Branch', 200, 0, ARRAY['Poblacion Branch'], 'Mike Johnson');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active promotions view
CREATE VIEW active_promotions AS
SELECT 
  p.*,
  CASE 
    WHEN p.end_date < NOW() THEN 'expired'
    WHEN p.start_date > NOW() THEN 'upcoming'
    ELSE 'active'
  END as computed_status
FROM promotions p
WHERE p.status = 'active' 
  AND p.start_date <= NOW() 
  AND p.end_date >= NOW();

-- Event campaigns with registration stats
CREATE VIEW campaign_stats AS
SELECT 
  ec.*,
  COALESCE(SUM(ca.views), 0) as total_views,
  COALESCE(SUM(ca.clicks), 0) as total_clicks,
  COALESCE(SUM(ca.registrations), 0) as total_registrations,
  CASE 
    WHEN ec.max_attendees > 0 THEN ROUND((ec.current_attendees::DECIMAL / ec.max_attendees) * 100, 2)
    ELSE 0
  END as capacity_percentage
FROM event_campaigns ec
LEFT JOIN campaign_analytics ca ON ec.id = ca.campaign_id
GROUP BY ec.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE promotions IS 'Stores promotion announcements for new items, restocks, and events';
COMMENT ON TABLE event_campaigns IS 'Stores event campaign information for workshops, launches, giveaways, etc.';
COMMENT ON TABLE promotion_analytics IS 'Daily analytics data for promotions (views, clicks)';
COMMENT ON TABLE campaign_analytics IS 'Daily analytics data for event campaigns (views, clicks, registrations)';
COMMENT ON TABLE campaign_registrations IS 'Customer registrations for event campaigns';
COMMENT ON TABLE promotion_views IS 'Detailed tracking of individual promotion views';

COMMENT ON COLUMN promotions.promotion_type IS 'Type of promotion: new_item, restock, or event';
COMMENT ON COLUMN promotions.status IS 'Promotion status: draft, active, or archived';
COMMENT ON COLUMN event_campaigns.event_type IS 'Type of event: workshop, launch, giveaway, or celebration';
COMMENT ON COLUMN event_campaigns.status IS 'Campaign status: draft, active, ended, or upcoming';
COMMENT ON COLUMN event_campaigns.branches IS 'Array of branch names where the event is available';


