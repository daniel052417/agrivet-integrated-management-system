**promotions**
create table public.promotions (
  id uuid not null default gen_random_uuid (),
  campaign_id uuid null,
  name character varying(200) not null,
  code character varying(50) null,
  type character varying(20) not null,
  discount_value numeric(10, 2) not null,
  minimum_amount numeric(10, 2) null,
  maximum_discount numeric(10, 2) null,
  usage_limit integer null,
  usage_count integer null default 0,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean null default true,
  applies_to character varying(20) not null default 'all'::character varying,
  created_at timestamp with time zone null default now(),
  display_settings jsonb null,
  target_audience character varying(50) null default 'all'::character varying,
  conditions jsonb null,
  constraint promotions_pkey primary key (id),
  constraint promotions_code_key unique (code),
  constraint promotions_campaign_id_fkey foreign KEY (campaign_id) references campaigns (id),
  constraint chk_applies_to check (
    (
      (applies_to)::text = any (
        (
          array[
            'all'::character varying,
            'category'::character varying,
            'product'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_promotion_dates check ((end_date >= start_date)),
  constraint chk_promotion_type check (
    (
      (type)::text = any (
        (
          array[
            'percentage'::character varying,
            'fixed'::character varying,
            'bogo'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_promotions_code on public.promotions using btree (code) TABLESPACE pg_default;

create index IF not exists idx_promotions_active on public.promotions using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_promotions_dates on public.promotions using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_promotions_campaign_id on public.promotions using btree (campaign_id) TABLESPACE pg_default;

create trigger audit_promotions_trigger
after INSERT
or DELETE
or
update on promotions for EACH row
execute FUNCTION audit_trigger_function ();

-- Add validity date range to promotions table
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS valid_from timestamp with time zone DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS valid_until timestamp with time zone DEFAULT (NOW() + interval '30 days');

CREATE INDEX IF NOT EXISTS idx_promotions_validity
ON public.promotions (valid_from, valid_until);

**promotions_analytics**
-- ============================================================================
-- PROMOTION ANALYTICS TABLE
-- ============================================================================
CREATE TABLE public.promotion_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  session_id varchar(255),
  customer_id uuid REFERENCES public.customers(id),
  branch_id uuid REFERENCES public.branches(id),
  
  -- Event tracking
  event_type varchar(50) NOT NULL CHECK (event_type IN ('view', 'click', 'dismiss', 'conversion', 'use')),
  event_data jsonb DEFAULT '{}',
  
  -- User context
  user_agent text,
  ip_address inet,
  device_type varchar(20),
  browser varchar(50),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT promotion_analytics_pkey PRIMARY KEY (id)
);

-- Indexes for analytics queries
CREATE INDEX idx_promotion_analytics_promotion_id ON public.promotion_analytics (promotion_id);
CREATE INDEX idx_promotion_analytics_event_type ON public.promotion_analytics (event_type);
CREATE INDEX idx_promotion_analytics_created_at ON public.promotion_analytics (created_at DESC);
CREATE INDEX idx_promotion_analytics_customer_id ON public.promotion_analytics (customer_id);
CREATE INDEX idx_promotion_analytics_session_id ON public.promotion_analytics (session_id);

**promotions_usage**
-- ============================================================================
-- PROMOTION USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE public.promotion_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  branch_id uuid REFERENCES public.branches(id),
  
  -- Usage details
  discount_applied decimal(10,2) NOT NULL,
  original_amount decimal(10,2) NOT NULL,
  final_amount decimal(10,2) NOT NULL,
  
  -- Context
  used_at timestamp with time zone DEFAULT now(),
  session_id varchar(255),
  
  CONSTRAINT promotion_usage_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_usage_positive_amounts CHECK (discount_applied >= 0 AND original_amount > 0 AND final_amount > 0)
);

-- Indexes for usage tracking
CREATE INDEX idx_promotion_usage_promotion_id ON public.promotion_usage (promotion_id);
CREATE INDEX idx_promotion_usage_order_id ON public.promotion_usage (order_id);
CREATE INDEX idx_promotion_usage_customer_id ON public.promotion_usage (customer_id);
CREATE INDEX idx_promotion_usage_used_at ON public.promotion_usage (used_at DESC);

**promotion_dismissals**
-- ============================================================================
-- PROMOTION DISMISSAL TRACKING TABLE
-- ============================================================================
CREATE TABLE public.promotion_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  session_id varchar(255) NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  branch_id uuid REFERENCES public.branches(id),
  
  -- Dismissal context
  dismissal_type varchar(20) DEFAULT 'user_action' CHECK (dismissal_type IN ('user_action', 'auto_expire', 'admin_disable')),
  dismissed_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT promotion_dismissals_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_dismissals_unique_session UNIQUE (promotion_id, session_id)
);

-- Indexes for dismissal tracking
CREATE INDEX idx_promotion_dismissals_promotion_id ON public.promotion_dismissals (promotion_id);
CREATE INDEX idx_promotion_dismissals_session_id ON public.promotion_dismissals (session_id);
CREATE INDEX idx_promotion_dismissals_dismissed_at ON public.promotion_dismissals (dismissed_at DESC);




**promotions_helpers**
-- ============================================================================
-- PROMOTION HELPER FUNCTIONS
-- ============================================================================

-- Function to get active promotions for a specific context
CREATE OR REPLACE FUNCTION public.get_active_promotions(
  p_branch_id uuid DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL,
  p_session_id varchar DEFAULT NULL,
  p_display_type varchar DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title varchar,
  description text,
  image_url text,
  discount_type varchar,
  discount_value decimal,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  conditions jsonb,
  display_settings jsonb,
  target_audience varchar,
  total_views integer,
  total_clicks integer,
  total_conversions integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.image_url,
    p.discount_type,
    p.discount_value,
    p.valid_from,
    p.valid_until,
    p.conditions,
    p.display_settings,
    p.target_audience,
    p.total_views,
    p.total_clicks,
    p.total_conversions
  FROM public.promotions p
  WHERE 
    p.is_active = true
    AND p.valid_from <= now()
    AND p.valid_until >= now()
    AND (
      p.target_audience = 'all' OR
      (p.target_audience = 'specific_branch' AND p_branch_id = ANY(p.target_branch_ids)) OR
      (p.target_audience = 'new_customers' AND p_customer_id IS NOT NULL AND 
       EXISTS (SELECT 1 FROM public.customers c WHERE c.id = p_customer_id AND c.created_at > now() - INTERVAL '30 days')) OR
      (p.target_audience = 'returning_customers' AND p_customer_id IS NOT NULL AND 
       EXISTS (SELECT 1 FROM public.customers c WHERE c.id = p_customer_id AND c.created_at <= now() - INTERVAL '30 days'))
    )
    AND (p_display_type IS NULL OR p.display_settings->>'showAs' = p_display_type)
    AND (p_branch_id IS NULL OR p.target_branch_ids IS NULL OR p_branch_id = ANY(p.target_branch_ids))
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track promotion events
CREATE OR REPLACE FUNCTION public.track_promotion_event(
  p_promotion_id uuid,
  p_event_type varchar,
  p_session_id varchar DEFAULT NULL,
  p_customer_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_event_data jsonb DEFAULT '{}',
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.promotion_analytics (
    promotion_id, event_type, session_id, customer_id, branch_id,
    event_data, user_agent, ip_address, device_type, browser
  ) VALUES (
    p_promotion_id, p_event_type, p_session_id, p_customer_id, p_branch_id,
    p_event_data, p_user_agent, p_ip_address,
    CASE 
      WHEN p_user_agent ILIKE '%mobile%' THEN 'mobile'
      WHEN p_user_agent ILIKE '%tablet%' THEN 'tablet'
      ELSE 'desktop'
    END,
    CASE 
      WHEN p_user_agent ILIKE '%chrome%' THEN 'chrome'
      WHEN p_user_agent ILIKE '%firefox%' THEN 'firefox'
      WHEN p_user_agent ILIKE '%safari%' THEN 'safari'
      ELSE 'other'
    END
  ) RETURNING id INTO event_id;
  
  -- Update promotion counters
  UPDATE public.promotions 
  SET 
    total_views = CASE WHEN p_event_type = 'view' THEN total_views + 1 ELSE total_views END,
    total_clicks = CASE WHEN p_event_type = 'click' THEN total_clicks + 1 ELSE total_clicks END,
    total_conversions = CASE WHEN p_event_type = 'conversion' THEN total_conversions + 1 ELSE total_conversions END,
    total_uses = CASE WHEN p_event_type = 'use' THEN total_uses + 1 ELSE total_uses END,
    updated_at = now()
  WHERE id = p_promotion_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if promotion is dismissed for session
CREATE OR REPLACE FUNCTION public.is_promotion_dismissed(
  p_promotion_id uuid,
  p_session_id varchar
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.promotion_dismissals 
    WHERE promotion_id = p_promotion_id AND session_id = p_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_dismissals ENABLE ROW LEVEL SECURITY;

-- Policies for promotions table
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Authenticated users can view all promotions" ON public.promotions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for analytics (authenticated users can insert)
CREATE POLICY "Authenticated users can track events" ON public.promotion_analytics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for usage tracking
CREATE POLICY "Authenticated users can track usage" ON public.promotion_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for dismissals
CREATE POLICY "Anyone can track dismissals" ON public.promotion_dismissals
  FOR INSERT WITH CHECK (true);
