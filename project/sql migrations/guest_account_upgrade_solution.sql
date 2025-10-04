-- ============================================================================
-- GUEST ACCOUNT UPGRADE SOLUTION
-- ============================================================================
-- This solution provides a trigger-safe way to upgrade guest accounts to full accounts
-- without creating duplicate records, while preserving guest session data.

-- ============================================================================
-- STEP 1: CREATE GUEST UPGRADE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.upgrade_guest_to_full_account(
    guest_user_id UUID,
    new_email TEXT,
    new_password TEXT,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL,
    city TEXT DEFAULT NULL,
    province TEXT DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    existing_customer RECORD;
    updated_customer RECORD;
    result JSON;
BEGIN
    -- Check if the guest user exists and is actually a guest
    SELECT * INTO existing_customer 
    FROM public.customers 
    WHERE user_id = guest_user_id AND is_guest = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Guest account not found or already upgraded'
        );
    END IF;
    
    -- Check if email is already taken by another user
    IF EXISTS (
        SELECT 1 FROM public.customers 
        WHERE email = new_email AND user_id != guest_user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email already registered to another account'
        );
    END IF;
    
    -- Update the existing customer record with new details
    UPDATE public.customers SET
        email = new_email,
        first_name = COALESCE(first_name, new_email), -- Use email if no first_name provided
        last_name = COALESCE(last_name, 'User'), -- Default last name
        phone = COALESCE(phone, new_phone),
        address = COALESCE(address, new_address),
        city = COALESCE(city, new_city),
        province = COALESCE(province, new_province),
        date_of_birth = COALESCE(date_of_birth, new_date_of_birth),
        is_guest = false, -- Mark as no longer a guest
        updated_at = NOW()
    WHERE user_id = guest_user_id
    RETURNING * INTO updated_customer;
    
    -- Update the auth.users record with new email and password
    -- Note: This requires superuser privileges or a custom function
    -- For Supabase, you'll need to use the Supabase Auth API instead
    
    -- Return success with updated customer data
    RETURN json_build_object(
        'success', true,
        'customer', row_to_json(updated_customer),
        'message', 'Guest account successfully upgraded to full account'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to upgrade guest account: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: CREATE GUEST SESSION DATA MIGRATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.migrate_guest_session_data(
    guest_user_id UUID,
    new_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    migrated_cart_items INTEGER := 0;
    migrated_preferences INTEGER := 0;
    migrated_analytics INTEGER := 0;
    result JSON;
BEGIN
    -- Migrate cart items (if you have a cart table)
    -- UPDATE cart_items 
    -- SET user_id = new_user_id 
    -- WHERE user_id = guest_user_id;
    -- GET DIAGNOSTICS migrated_cart_items = ROW_COUNT;
    
    -- Migrate user preferences (if you have a preferences table)
    -- UPDATE user_preferences 
    -- SET user_id = new_user_id 
    -- WHERE user_id = guest_user_id;
    -- GET DIAGNOSTICS migrated_preferences = ROW_COUNT;
    
    -- Migrate analytics data (if you have analytics table)
    -- UPDATE pwa_analytics 
    -- SET session_id = new_user_id::text 
    -- WHERE session_id = guest_user_id::text;
    -- GET DIAGNOSTICS migrated_analytics = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'migrated_cart_items', migrated_cart_items,
        'migrated_preferences', migrated_preferences,
        'migrated_analytics', migrated_analytics,
        'message', 'Guest session data migrated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to migrate guest session data: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE GUEST UPGRADE TRIGGER (OPTIONAL)
-- ============================================================================

-- This trigger automatically handles guest upgrades when auth.users is updated
CREATE OR REPLACE FUNCTION public.handle_guest_upgrade()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is an update (not insert) and email changed from null to not null
    IF TG_OP = 'UPDATE' AND (OLD.email IS NULL OR OLD.email = '') AND NEW.email IS NOT NULL AND NEW.email != '' THEN
        -- Check if there's a corresponding guest customer record
        IF EXISTS (
            SELECT 1 FROM public.customers 
            WHERE user_id = NEW.id AND is_guest = true
        ) THEN
            -- Update the customer record to mark as no longer guest
            UPDATE public.customers SET
                email = NEW.email,
                first_name = COALESCE(
                    NULLIF(first_name, ''), 
                    NEW.raw_user_meta_data->>'first_name'
                ),
                last_name = COALESCE(
                    NULLIF(last_name, ''), 
                    NEW.raw_user_meta_data->>'last_name'
                ),
                phone = COALESCE(
                    NULLIF(phone, ''), 
                    NEW.raw_user_meta_data->>'phone'
                ),
                address = COALESCE(
                    NULLIF(address, ''), 
                    NEW.raw_user_meta_data->>'address'
                ),
                city = COALESCE(
                    NULLIF(city, ''), 
                    NEW.raw_user_meta_data->>'city'
                ),
                province = COALESCE(
                    NULLIF(province, ''), 
                    NEW.raw_user_meta_data->>'province'
                ),
                date_of_birth = COALESCE(
                    date_of_birth, 
                    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
                ),
                is_guest = false,
                updated_at = NOW()
            WHERE user_id = NEW.id;
            
            RAISE LOG 'Guest account upgraded for user_id: % with email: %', NEW.id, NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_guest_upgrade ON auth.users;
CREATE TRIGGER on_guest_upgrade
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_guest_upgrade();

-- ============================================================================
-- STEP 4: CREATE GUEST UPGRADE API FUNCTION (FOR SUPABASE)
-- ============================================================================

-- This function can be called from your PWA to upgrade guest accounts
CREATE OR REPLACE FUNCTION public.upgrade_guest_account_api(
    guest_user_id UUID,
    new_email TEXT,
    first_name TEXT DEFAULT NULL,
    last_name TEXT DEFAULT NULL,
    phone TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL,
    city TEXT DEFAULT NULL,
    province TEXT DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    upgrade_result JSON;
    migration_result JSON;
    final_result JSON;
BEGIN
    -- Upgrade the guest account
    SELECT public.upgrade_guest_to_full_account(
        guest_user_id,
        new_email,
        NULL, -- password will be handled by Supabase Auth
        first_name,
        last_name,
        phone,
        address,
        city,
        province,
        date_of_birth
    ) INTO upgrade_result;
    
    -- If upgrade was successful, migrate session data
    IF (upgrade_result->>'success')::boolean THEN
        SELECT public.migrate_guest_session_data(
            guest_user_id,
            guest_user_id -- Same user_id since we're upgrading, not creating new
        ) INTO migration_result;
    ELSE
        migration_result := json_build_object('success', true, 'message', 'No migration needed');
    END IF;
    
    -- Combine results
    final_result := json_build_object(
        'upgrade', upgrade_result,
        'migration', migration_result,
        'success', (upgrade_result->>'success')::boolean
    );
    
    RETURN final_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Guest upgrade failed: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.upgrade_guest_to_full_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_guest_session_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_guest_account_api TO authenticated;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR GUEST UPGRADE
-- ============================================================================

-- Allow users to upgrade their own guest accounts
CREATE POLICY "Users can upgrade their own guest accounts" ON public.customers
    FOR UPDATE USING (
        auth.uid() = user_id AND is_guest = true
    );

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example 1: Upgrade a guest account (call from your PWA)
-- SELECT public.upgrade_guest_account_api(
--     'guest-user-uuid-here',
--     'newemail@example.com',
--     'John',
--     'Doe',
--     '+1234567890',
--     '123 Main St',
--     'New York',
--     'NY',
--     '1990-01-01'
-- );

-- Example 2: Check if a user is a guest
-- SELECT is_guest FROM public.customers WHERE user_id = 'user-uuid-here';

-- Example 3: Get all guest accounts (for cleanup)
-- SELECT * FROM public.customers WHERE is_guest = true;

-- ============================================================================
-- PWA SESSIONS TABLE FOR CUSTOMER PWA (GUESTS + AUTHENTICATED CUSTOMERS)
-- ============================================================================

-- Create the PWA sessions table
CREATE TABLE public.pwa_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id character varying(255) NOT NULL,
  branch_id uuid NULL,
  customer_id uuid NULL,
  is_guest boolean NULL DEFAULT true,
  cart_data jsonb NULL,
  dismissed_banners jsonb NULL,
  modal_shown jsonb NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  expires_at timestamp without time zone NOT NULL,
  device_info jsonb NULL,
  last_activity timestamp without time zone NULL DEFAULT now(),
  user_agent text NULL,
  ip_address inet NULL,
  CONSTRAINT pwa_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pwa_sessions_session_id_key UNIQUE (session_id),
  CONSTRAINT pwa_sessions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT pwa_sessions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id)
) TABLESPACE pg_default;

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pwa_sessions_branch_guest ON public.pwa_sessions USING btree (branch_id, is_guest) TABLESPACE pg_default
WHERE (is_guest = true);

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_customer_id ON public.pwa_sessions USING btree (customer_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_expires ON public.pwa_sessions USING btree (expires_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_last_activity ON public.pwa_sessions USING btree (last_activity) TABLESPACE pg_default;

-- ============================================================================
-- PWA SESSIONS HELPER FUNCTIONS
-- ============================================================================

-- Function to create or update a PWA session
CREATE OR REPLACE FUNCTION public.create_or_update_pwa_session(
    p_session_id TEXT,
    p_branch_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_is_guest BOOLEAN DEFAULT true,
    p_cart_data JSONB DEFAULT NULL,
    p_dismissed_banners JSONB DEFAULT NULL,
    p_modal_shown JSONB DEFAULT NULL,
    p_expires_at TIMESTAMP DEFAULT NULL,
    p_device_info JSONB DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    expires_time TIMESTAMP;
BEGIN
    -- Set default expiration time (24 hours from now)
    expires_time := COALESCE(p_expires_at, NOW() + INTERVAL '24 hours');
    
    -- Insert or update the session
    INSERT INTO public.pwa_sessions (
        session_id, branch_id, customer_id, is_guest, cart_data, 
        dismissed_banners, modal_shown, expires_at, device_info, 
        user_agent, ip_address, last_activity
    ) VALUES (
        p_session_id, p_branch_id, p_customer_id, p_is_guest, p_cart_data,
        p_dismissed_banners, p_modal_shown, expires_time, p_device_info,
        p_user_agent, p_ip_address, NOW()
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
        branch_id = COALESCE(EXCLUDED.branch_id, pwa_sessions.branch_id),
        customer_id = COALESCE(EXCLUDED.customer_id, pwa_sessions.customer_id),
        is_guest = COALESCE(EXCLUDED.is_guest, pwa_sessions.is_guest),
        cart_data = COALESCE(EXCLUDED.cart_data, pwa_sessions.cart_data),
        dismissed_banners = COALESCE(EXCLUDED.dismissed_banners, pwa_sessions.dismissed_banners),
        modal_shown = COALESCE(EXCLUDED.modal_shown, pwa_sessions.modal_shown),
        expires_at = COALESCE(EXCLUDED.expires_at, pwa_sessions.expires_at),
        device_info = COALESCE(EXCLUDED.device_info, pwa_sessions.device_info),
        user_agent = COALESCE(EXCLUDED.user_agent, pwa_sessions.user_agent),
        ip_address = COALESCE(EXCLUDED.ip_address, pwa_sessions.ip_address),
        last_activity = NOW(),
        updated_at = NOW()
    RETURNING * INTO session_record;
    
    RETURN json_build_object(
        'success', true,
        'session', row_to_json(session_record),
        'message', 'PWA session created/updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to create/update PWA session: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get PWA session data
CREATE OR REPLACE FUNCTION public.get_pwa_session(p_session_id TEXT)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
BEGIN
    SELECT * INTO session_record
    FROM public.pwa_sessions
    WHERE session_id = p_session_id AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session not found or expired'
        );
    END IF;
    
    -- Update last activity
    UPDATE public.pwa_sessions 
    SET last_activity = NOW() 
    WHERE session_id = p_session_id;
    
    RETURN json_build_object(
        'success', true,
        'session', row_to_json(session_record)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to get PWA session: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_pwa_sessions()
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.pwa_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'deleted_sessions', deleted_count,
        'message', 'Expired PWA sessions cleaned up successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to cleanup expired sessions: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PWA SESSIONS RLS POLICIES
-- ============================================================================

-- Enable RLS on pwa_sessions table
ALTER TABLE public.pwa_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for guests to access their own sessions
CREATE POLICY "Guests can access their own sessions" ON public.pwa_sessions
    FOR ALL USING (
        is_guest = true AND 
        session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
    );

-- Policy for authenticated customers to access their sessions
CREATE POLICY "Customers can access their own sessions" ON public.pwa_sessions
    FOR ALL USING (
        is_guest = false AND 
        customer_id = auth.uid()
    );

-- ============================================================================
-- PWA SESSIONS USAGE EXAMPLES
-- ============================================================================

-- Example 1: Create a guest session
-- SELECT public.create_or_update_pwa_session(
--     'guest-session-123',
--     'branch-uuid-here',
--     NULL,
--     true,
--     '{"items": [], "total": 0}'::jsonb,
--     '{"welcome_banner": true}'::jsonb,
--     '{"cookie_consent": true}'::jsonb,
--     NOW() + INTERVAL '24 hours',
--     '{"device": "mobile", "os": "iOS"}'::jsonb,
--     'Mozilla/5.0...',
--     '192.168.1.1'::inet
-- );

-- Example 2: Create an authenticated customer session
-- SELECT public.create_or_update_pwa_session(
--     'customer-session-456',
--     'branch-uuid-here',
--     'customer-uuid-here',
--     false,
--     '{"items": [{"id": 1, "qty": 2}], "total": 100}'::jsonb,
--     '{"welcome_banner": false}'::jsonb,
--     '{"cookie_consent": true}'::jsonb,
--     NOW() + INTERVAL '7 days',
--     '{"device": "desktop", "os": "Windows"}'::jsonb,
--     'Mozilla/5.0...',
--     '192.168.1.2'::inet
-- );

-- Example 3: Get session data
-- SELECT public.get_pwa_session('guest-session-123');

-- Example 4: Cleanup expired sessions
-- SELECT public.cleanup_expired_pwa_sessions();

-- ============================================================================
-- USER PREFERENCES TABLE FOR PWA SETTINGS
-- ============================================================================

-- Create the user_preferences table
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  preferred_branch_id uuid NULL,
  special_instructions text NULL,
  primary_phone character varying(20) NULL,
  preferred_contact_method character varying(20) NULL DEFAULT 'phone',
  order_ready_alerts boolean NULL DEFAULT true,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_customer_id_key UNIQUE (customer_id),
  CONSTRAINT user_preferences_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT user_preferences_branch_id_fkey FOREIGN KEY (preferred_branch_id) REFERENCES branches (id)
) TABLESPACE pg_default;

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_customer_id ON public.user_preferences USING btree (customer_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_preferences_branch_id ON public.user_preferences USING btree (preferred_branch_id) TABLESPACE pg_default;

-- ============================================================================
-- USER PREFERENCES RLS POLICIES
-- ============================================================================

-- Enable RLS on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for customers to access their own preferences
CREATE POLICY "Customers can access their own preferences" ON public.user_preferences
    FOR ALL USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- USER PREFERENCES USAGE EXAMPLES
-- ============================================================================

-- Example 1: Create user preferences
-- INSERT INTO public.user_preferences (
--     customer_id,
--     preferred_branch_id,
--     special_instructions,
--     primary_phone,
--     preferred_contact_method,
--     order_ready_alerts
-- ) VALUES (
--     'customer-uuid-here',
--     'branch-uuid-here',
--     'Please call when ready',
--     '+1234567890',
--     'phone',
--     true
-- );

-- Example 2: Update user preferences
-- UPDATE public.user_preferences SET
--     preferred_branch_id = 'new-branch-uuid',
--     special_instructions = 'Updated instructions',
--     updated_at = NOW()
-- WHERE customer_id = 'customer-uuid-here';

-- Example 3: Get user preferences
-- SELECT * FROM public.user_preferences WHERE customer_id = 'customer-uuid-here';

