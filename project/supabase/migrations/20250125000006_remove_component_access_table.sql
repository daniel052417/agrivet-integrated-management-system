-- Remove component_access table and related functions
-- This migration removes dynamic component permissions since we're using hardcoded role pages

-- Drop the component_access table
DROP TABLE IF EXISTS public.component_access CASCADE;

-- Drop any related functions that might exist
DROP FUNCTION IF EXISTS get_user_accessible_components(uuid);
DROP FUNCTION IF EXISTS check_component_access(uuid, text);

-- Add comment to document the change
COMMENT ON SCHEMA public IS 'Component access table removed - using hardcoded role pages for navigation';
