-- Add verification fields to users table for account activation flow
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verification_token character varying(255) NULL,
ADD COLUMN IF NOT EXISTS token_expiry timestamp with time zone NULL;

-- Add index for verification token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_verification_token ON public.users USING btree (verification_token) TABLESPACE pg_default;

-- Add index for token expiry cleanup
CREATE INDEX IF NOT EXISTS idx_users_token_expiry ON public.users USING btree (token_expiry) TABLESPACE pg_default;

-- Update account_status to include pending_activation
-- First, let's check if we need to add the new status
-- The constraint should already allow this, but let's make sure
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_account_status_check 
CHECK (
  account_status IN (
    'active',
    'inactive', 
    'suspended',
    'pending_activation'
  )
);
