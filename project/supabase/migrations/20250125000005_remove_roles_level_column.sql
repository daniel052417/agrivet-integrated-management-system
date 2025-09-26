-- Remove level column from roles table
-- This migration removes the level column since we're using hardcoded role hierarchy

-- Drop the level column
ALTER TABLE public.roles DROP COLUMN IF EXISTS level;

-- Update any existing roles to ensure they have proper names
-- (This is just a safety check, no actual data changes needed)
UPDATE public.roles 
SET updated_at = NOW() 
WHERE name IN ('super-admin', 'hr-admin', 'hr-staff', 'marketing-admin', 'marketing-staff', 'cashier', 'inventory-clerk', 'user');

-- Add comment to document the change
COMMENT ON TABLE public.roles IS 'Roles table without level column - hierarchy is now hardcoded in application';
