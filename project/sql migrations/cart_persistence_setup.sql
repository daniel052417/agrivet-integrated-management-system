-- ============================================================================
-- CART PERSISTENCE SETUP
-- ============================================================================
-- This migration sets up the database schema for cart persistence functionality
-- It creates the necessary tables and functions for the PWA cart system

-- ============================================================================
-- STEP 1: ENSURE PWA_SESSIONS TABLE EXISTS
-- ============================================================================

-- Create the PWA sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pwa_sessions (
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

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_pwa_sessions_branch_guest ON public.pwa_sessions USING btree (branch_id, is_guest) TABLESPACE pg_default
WHERE (is_guest = true);

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_customer_id ON public.pwa_sessions USING btree (customer_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_expires ON public.pwa_sessions USING btree (expires_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_last_activity ON public.pwa_sessions USING btree (last_activity) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_pwa_sessions_session_id ON public.pwa_sessions USING btree (session_id) TABLESPACE pg_default;

-- ============================================================================
-- STEP 3: CREATE PWA SESSIONS HELPER FUNCTIONS
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
    )
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
-- STEP 4: CREATE CART-SPECIFIC FUNCTIONS
-- ============================================================================

-- Function to get cart data for a session
CREATE OR REPLACE FUNCTION public.get_cart_data(p_session_id TEXT)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
    cart_data JSONB;
BEGIN
    SELECT cart_data INTO cart_data
    FROM public.pwa_sessions
    WHERE session_id = p_session_id AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session not found or expired'
        );
    END IF;
    
    -- Return empty cart if no cart data
    IF cart_data IS NULL THEN
        cart_data := json_build_object(
            'items', json_build_array(),
            'subtotal', 0,
            'tax', 0,
            'total', 0,
            'itemCount', 0
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'cart', cart_data
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to get cart data: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cart data for a session
CREATE OR REPLACE FUNCTION public.update_cart_data(
    p_session_id TEXT,
    p_cart_data JSONB,
    p_customer_id UUID DEFAULT NULL,
    p_is_guest BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Update or create session with cart data
    INSERT INTO public.pwa_sessions (
        session_id, customer_id, is_guest, cart_data, 
        expires_at, last_activity
    ) VALUES (
        p_session_id, p_customer_id, p_is_guest, p_cart_data,
        NOW() + INTERVAL '24 hours', NOW()
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
        cart_data = p_cart_data,
        customer_id = COALESCE(p_customer_id, pwa_sessions.customer_id),
        is_guest = COALESCE(p_is_guest, pwa_sessions.is_guest),
        last_activity = NOW(),
        updated_at = NOW()
    )
    RETURNING * INTO session_record;
    
    RETURN json_build_object(
        'success', true,
        'cart', p_cart_data,
        'message', 'Cart updated successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to update cart data: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
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

-- Policy for public access to session creation (for guests)
CREATE POLICY "Allow public session creation" ON public.pwa_sessions
    FOR INSERT WITH CHECK (is_guest = true);

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_or_update_pwa_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pwa_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_pwa_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cart_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_data TO authenticated;

-- Grant execute permissions to anon users (for guest sessions)
GRANT EXECUTE ON FUNCTION public.create_or_update_pwa_session TO anon;
GRANT EXECUTE ON FUNCTION public.get_pwa_session TO anon;
GRANT EXECUTE ON FUNCTION public.get_cart_data TO anon;
GRANT EXECUTE ON FUNCTION public.update_cart_data TO anon;

-- ============================================================================
-- STEP 7: CREATE SCHEDULED CLEANUP JOB (OPTIONAL)
-- ============================================================================

-- Create a function to be called by a cron job for cleanup
CREATE OR REPLACE FUNCTION public.scheduled_cleanup()
RETURNS void AS $$
BEGIN
    -- Clean up expired sessions
    PERFORM public.cleanup_expired_pwa_sessions();
    
    -- Log the cleanup
    RAISE LOG 'Scheduled cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Example 1: Create a guest session with cart data
-- SELECT public.create_or_update_pwa_session(
--     'guest-session-123',
--     'branch-uuid-here',
--     NULL,
--     true,
--     '{"items": [{"id": "1", "product": {"id": "prod-1"}, "quantity": 2, "unitPrice": 100, "lineTotal": 200}], "subtotal": 200, "tax": 24, "total": 224, "itemCount": 2}'::jsonb
-- );

-- Example 2: Get cart data
-- SELECT public.get_cart_data('guest-session-123');

-- Example 3: Update cart data
-- SELECT public.update_cart_data(
--     'guest-session-123',
--     '{"items": [], "subtotal": 0, "tax": 0, "total": 0, "itemCount": 0}'::jsonb
-- );

-- Example 4: Cleanup expired sessions
-- SELECT public.cleanup_expired_pwa_sessions();
