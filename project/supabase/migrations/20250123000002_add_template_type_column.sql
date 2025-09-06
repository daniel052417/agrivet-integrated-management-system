-- Add template_type column to marketing_campaigns table if it doesn't exist
-- This is a simple fix for the missing column error

-- Add template_type column if it doesn't exist
DO $$ 
BEGIN
    -- Check if marketing_campaigns table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_campaigns') THEN
        -- Add template_type column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'marketing_campaigns' 
            AND column_name = 'template_type'
        ) THEN
            ALTER TABLE marketing_campaigns 
            ADD COLUMN template_type VARCHAR(50) NOT NULL DEFAULT 'hero_banner' 
            CHECK (template_type IN ('hero_banner', 'promo_card', 'popup'));
            
            -- Update any existing NULL values
            UPDATE marketing_campaigns 
            SET template_type = 'hero_banner' 
            WHERE template_type IS NULL;
        END IF;
    END IF;
END $$;

