-- Fix duplicate users issue
-- This script will clean up duplicate users and add proper constraints

-- First, let's see if there are duplicate users
SELECT email, user_type, COUNT(*) as count
FROM public.users 
WHERE user_type = 'customer'
GROUP BY email, user_type
HAVING COUNT(*) > 1;

-- Add unique constraint on email + user_type combination
-- This will prevent future duplicates
ALTER TABLE public.users 
ADD CONSTRAINT unique_customer_email 
UNIQUE (email, user_type);

-- If you want to keep only the latest user for each email, uncomment below:
-- WITH duplicates AS (
--     SELECT id, 
--            ROW_NUMBER() OVER (PARTITION BY email, user_type ORDER BY created_at DESC) as rn
--     FROM public.users 
--     WHERE user_type = 'customer'
-- )
-- DELETE FROM public.users 
-- WHERE id IN (
--     SELECT id FROM duplicates WHERE rn > 1
-- );

-- Also add unique constraint on social auth providers
ALTER TABLE public.social_auth_providers 
ADD CONSTRAINT unique_provider_user 
UNIQUE (provider, provider_user_id);

