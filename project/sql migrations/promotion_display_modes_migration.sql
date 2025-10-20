-- ============================================================================
-- PROMOTION DISPLAY MODES MIGRATION
-- ============================================================================
-- This migration adds support for the new display mode system

-- Add new columns to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS display_mode VARCHAR(20) DEFAULT 'banner' CHECK (display_mode IN ('banner', 'modal', 'notification', 'carousel')),
ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Create index for display_mode queries
CREATE INDEX IF NOT EXISTS idx_promotions_display_mode 
ON public.promotions (display_mode);

-- Create index for display_priority queries
CREATE INDEX IF NOT EXISTS idx_promotions_display_priority 
ON public.promotions (display_priority DESC);

-- Create index for branch_id targeting
CREATE INDEX IF NOT EXISTS idx_promotions_branch_id 
ON public.promotions (branch_id);

-- Update existing promotions to have proper display_mode based on display_settings
UPDATE public.promotions 
SET display_mode = CASE
  WHEN display_settings->>'showAsBanner' = 'true' THEN 'banner'
  WHEN display_settings->>'showAsModal' = 'true' THEN 'modal'
  WHEN display_settings->>'showAsNotification' = 'true' THEN 'notification'
  WHEN display_settings->>'showAsCarousel' = 'true' THEN 'carousel'
  ELSE 'banner'
END
WHERE display_mode IS NULL;

-- Update display_settings to include new carousel settings
UPDATE public.promotions 
SET display_settings = COALESCE(display_settings, '{}'::jsonb) || jsonb_build_object(
  'showAsCarousel', false,
  'carouselInterval', 5000,
  'carouselPosition', 'both'
)
WHERE display_settings IS NULL OR display_settings->>'showAsCarousel' IS NULL;

-- Set display_priority based on creation date (newer = higher priority)
UPDATE public.promotions 
SET display_priority = EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE display_priority = 0;

-- Create a function to get promotions by display mode
CREATE OR REPLACE FUNCTION public.get_promotions_by_display_mode(
  p_display_mode VARCHAR(20),
  p_branch_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_position VARCHAR DEFAULT 'both'
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  image_url TEXT,
  type VARCHAR,
  discount_value DECIMAL,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  target_audience VARCHAR,
  target_branch_ids UUID[],
  branch_id UUID,
  conditions JSONB,
  display_settings JSONB,
  display_mode VARCHAR,
  display_priority INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.type,
    p.discount_value,
    p.valid_from,
    p.valid_until,
    p.is_active,
    p.target_audience,
    p.target_branch_ids,
    p.branch_id,
    p.conditions,
    p.display_settings,
    p.display_mode,
    p.display_priority,
    p.created_at,
    p.updated_at
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND p.display_mode = p_display_mode
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
    AND (p_position = 'both' OR p.display_settings->>'carouselPosition' = p_position OR p.display_settings->>'carouselPosition' = 'both')
  ORDER BY p.display_priority DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all promotions grouped by display mode
CREATE OR REPLACE FUNCTION public.get_all_promotions_by_display_mode(
  p_branch_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_position VARCHAR DEFAULT 'both'
)
RETURNS TABLE (
  display_mode VARCHAR,
  promotions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'banner'::VARCHAR as display_mode,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'image_url', p.image_url,
          'type', p.type,
          'discount_value', p.discount_value,
          'valid_from', p.valid_from,
          'valid_until', p.valid_until,
          'is_active', p.is_active,
          'target_audience', p.target_audience,
          'target_branch_ids', p.target_branch_ids,
          'branch_id', p.branch_id,
          'conditions', p.conditions,
          'display_settings', p.display_settings,
          'display_mode', p.display_mode,
          'display_priority', p.display_priority,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        ) ORDER BY p.display_priority DESC, p.created_at DESC
      ) FILTER (WHERE p.display_mode = 'banner'),
      '[]'::jsonb
    ) as promotions
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
    AND (p_position = 'both' OR p.display_settings->>'carouselPosition' = p_position OR p.display_settings->>'carouselPosition' = 'both')
  
  UNION ALL
  
  SELECT 
    'modal'::VARCHAR as display_mode,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'image_url', p.image_url,
          'type', p.type,
          'discount_value', p.discount_value,
          'valid_from', p.valid_from,
          'valid_until', p.valid_until,
          'is_active', p.is_active,
          'target_audience', p.target_audience,
          'target_branch_ids', p.target_branch_ids,
          'branch_id', p.branch_id,
          'conditions', p.conditions,
          'display_settings', p.display_settings,
          'display_mode', p.display_mode,
          'display_priority', p.display_priority,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        ) ORDER BY p.display_priority DESC, p.created_at DESC
      ) FILTER (WHERE p.display_mode = 'modal'),
      '[]'::jsonb
    ) as promotions
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
    AND (p_position = 'both' OR p.display_settings->>'carouselPosition' = p_position OR p.display_settings->>'carouselPosition' = 'both')
  
  UNION ALL
  
  SELECT 
    'notification'::VARCHAR as display_mode,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'image_url', p.image_url,
          'type', p.type,
          'discount_value', p.discount_value,
          'valid_from', p.valid_from,
          'valid_until', p.valid_until,
          'is_active', p.is_active,
          'target_audience', p.target_audience,
          'target_branch_ids', p.target_branch_ids,
          'branch_id', p.branch_id,
          'conditions', p.conditions,
          'display_settings', p.display_settings,
          'display_mode', p.display_mode,
          'display_priority', p.display_priority,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        ) ORDER BY p.display_priority DESC, p.created_at DESC
      ) FILTER (WHERE p.display_mode = 'notification'),
      '[]'::jsonb
    ) as promotions
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
    AND (p_position = 'both' OR p.display_settings->>'carouselPosition' = p_position OR p.display_settings->>'carouselPosition' = 'both')
  
  UNION ALL
  
  SELECT 
    'carousel'::VARCHAR as display_mode,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'image_url', p.image_url,
          'type', p.type,
          'discount_value', p.discount_value,
          'valid_from', p.valid_from,
          'valid_until', p.valid_until,
          'is_active', p.is_active,
          'target_audience', p.target_audience,
          'target_branch_ids', p.target_branch_ids,
          'branch_id', p.branch_id,
          'conditions', p.conditions,
          'display_settings', p.display_settings,
          'display_mode', p.display_mode,
          'display_priority', p.display_priority,
          'created_at', p.created_at,
          'updated_at', p.updated_at
        ) ORDER BY p.display_priority DESC, p.created_at DESC
      ) FILTER (WHERE p.display_mode = 'carousel'),
      '[]'::jsonb
    ) as promotions
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
    AND (p_position = 'both' OR p.display_settings->>'carouselPosition' = p_position OR p.display_settings->>'carouselPosition' = 'both');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (
    is_active = true 
    AND valid_from <= now() 
    AND valid_until >= now()
  );

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.get_promotions_by_display_mode TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_promotions_by_display_mode TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.promotions.display_mode IS 'Display mode: banner, modal, notification, or carousel';
COMMENT ON COLUMN public.promotions.display_priority IS 'Display priority: higher number = higher priority';
COMMENT ON COLUMN public.promotions.branch_id IS 'Optional branch targeting for promotions';

COMMENT ON FUNCTION public.get_promotions_by_display_mode IS 'Get promotions filtered by display mode with targeting support';
COMMENT ON FUNCTION public.get_all_promotions_by_display_mode IS 'Get all promotions grouped by display mode with targeting support';
