create table public.orders (
  id uuid not null default gen_random_uuid (),
  order_number character varying(50) not null,
  customer_id uuid null,
  branch_id uuid not null,
  status character varying(20) null default 'pending'::character varying,
  subtotal numeric(10, 2) not null,
  tax_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null,
  payment_method character varying(20) not null,
  payment_reference character varying(100) null,
  payment_notes text null,
  estimated_ready_time timestamp without time zone null,
  is_guest_order boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  order_type character varying(20) null default 'pickup'::character varying,
  payment_status character varying(20) null default 'pending'::character varying,
  discount_amount numeric(10, 2) null default 0,
  customer_name character varying(100) null,
  customer_email character varying(100) null,
  customer_phone character varying(20) null,
  special_instructions text null,
  confirmed_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  constraint orders_pkey primary key (id),
  constraint orders_order_number_key unique (order_number),
  constraint orders_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint chk_order_type check (
    (
      (order_type)::text = any (
        (
          array[
            'pickup'::character varying,
            'delivery'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_payment_status check (
    (
      (payment_status)::text = any (
        (
          array[
            'pending'::character varying,
            'paid'::character varying,
            'failed'::character varying,
            'refunded'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_guest_branch on public.orders using btree (is_guest_order, branch_id, created_at) TABLESPACE pg_default;



create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  product_unit_id uuid not null,
  quantity numeric(10, 3) not null,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  weight numeric(8, 2) null,
  expiry_date date null,
  batch_number character varying(100) null,
  notes text null,
  created_at timestamp without time zone null default now(),
  product_id uuid null,
  base_unit_quantity numeric(10, 3) null,
  product_name character varying(255) null,
  product_sku character varying(100) null,
  unit_name character varying(50) null,
  unit_label character varying(20) null,
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint order_items_product_id_fkey foreign KEY (product_id) references products (id),
  constraint order_items_product_unit_id_fkey foreign KEY (product_unit_id) references product_units (id) on delete set null,
  constraint chk_quantity_positive check ((quantity > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_order_items_product_unit_id on public.order_items using btree (product_unit_id) TABLESPACE pg_default;



create table public.payments (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  payment_method_id uuid not null,
  amount numeric(12, 2) not null,
  reference_number character varying(100) null,
  status character varying(20) not null default 'pending'::character varying,
  payment_date timestamp with time zone not null default now(),
  processing_fee numeric(10, 2) null default 0,
  notes text null,
  processed_by uuid not null,
  created_at timestamp with time zone null default now(),
  sales_transaction_id uuid null,
  constraint payments_pkey primary key (id),
  constraint payments_payment_method_id_fkey foreign KEY (payment_method_id) references payment_methods (id),
  constraint payments_processed_by_fkey foreign KEY (processed_by) references users (id),
  constraint payments_sales_transaction_id_fkey foreign KEY (sales_transaction_id) references sales_transactions (id),
  constraint chk_payment_status check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'completed'::character varying,
            'failed'::character varying,
            'refunded'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payments_order_id on public.payments using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payments_payment_method_id on public.payments using btree (payment_method_id) TABLESPACE pg_default;

create index IF not exists idx_payments_status on public.payments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payments_payment_date on public.payments using btree (payment_date) TABLESPACE pg_default;

create index IF not exists idx_payments_processed_by on public.payments using btree (processed_by) TABLESPACE pg_default;

create trigger audit_payments_trigger
after INSERT
or DELETE
or
update on payments for EACH row
execute FUNCTION audit_trigger_function ();

create trigger calculate_processing_fee_trigger BEFORE INSERT
or
update on payments for EACH row
execute FUNCTION calculate_processing_fee ();

create trigger update_order_payment_status_trigger
after INSERT
or DELETE
or
update on payments for EACH row
execute FUNCTION update_order_payment_status ();



create table public.payment_methods (
  id uuid not null default gen_random_uuid (),
  name character varying(50) not null,
  type character varying(20) not null,
  is_active boolean null default true,
  requires_reference boolean null default false,
  processing_fee numeric(5, 4) null default 0,
  created_at timestamp with time zone null default now(),
  constraint payment_methods_pkey primary key (id),
  constraint payment_methods_name_key unique (name),
  constraint chk_payment_type check (
    (
      (type)::text = any (
        (
          array[
            'cash'::character varying,
            'card'::character varying,
            'digital_wallet'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_type on public.payment_methods using btree (type) TABLESPACE pg_default;

create index IF not exists idx_payment_methods_is_active on public.payment_methods using btree (is_active) TABLESPACE pg_default;




create table public.payment_transactions (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  transaction_id character varying(100) null,
  payment_method character varying(20) not null,
  payment_gateway character varying(50) null,
  amount numeric(10, 2) not null,
  currency character varying(3) null default 'PHP'::character varying,
  processing_fee numeric(10, 2) null default 0,
  status character varying(20) null default 'pending'::character varying,
  gateway_status character varying(50) null,
  reference_number character varying(100) null,
  gateway_response jsonb null,
  failure_reason text null,
  created_at timestamp with time zone null default now(),
  processed_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  constraint payment_transactions_pkey primary key (id),
  constraint payment_transactions_transaction_id_key unique (transaction_id),
  constraint payment_transactions_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint chk_payment_transaction_status check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'processing'::character varying,
            'completed'::character varying,
            'failed'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_order_id on public.payment_transactions using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_status on public.payment_transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_transaction_id on public.payment_transactions using btree (transaction_id) TABLESPACE pg_default;



create table public.order_tracking (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  tracking_number character varying(100) null,
  carrier character varying(50) null,
  current_location character varying(255) null,
  estimated_delivery timestamp with time zone null,
  actual_delivery timestamp with time zone null,
  status character varying(20) null default 'pending'::character varying,
  last_update timestamp with time zone null,
  update_notes text null,
  created_at timestamp with time zone null default now(),
  constraint order_tracking_pkey primary key (id),
  constraint order_tracking_tracking_number_key unique (tracking_number),
  constraint order_tracking_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint chk_tracking_status check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'in_transit'::character varying,
            'out_for_delivery'::character varying,
            'delivered'::character varying,
            'failed'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_order_tracking_order_id on public.order_tracking using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_order_tracking_status on public.order_tracking using btree (status) TABLESPACE pg_default;

create index IF not exists idx_order_tracking_tracking_number on public.order_tracking using btree (tracking_number) TABLESPACE pg_default;




create table public.order_status_history (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  status character varying(20) not null,
  previous_status character varying(20) null,
  changed_by uuid null,
  changed_by_name character varying(100) null,
  notes text null,
  metadata jsonb null,
  created_at timestamp with time zone null default now(),
  constraint order_status_history_pkey primary key (id),
  constraint order_status_history_changed_by_fkey foreign KEY (changed_by) references users (id),
  constraint order_status_history_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;



create table public.email_notifications (
  id uuid not null default gen_random_uuid (),
  order_id uuid null,
  customer_id uuid null,
  email_type character varying(50) not null,
  recipient_email character varying(100) not null,
  recipient_name character varying(100) null,
  subject character varying(255) not null,
  template_name character varying(100) null,
  content_html text null,
  content_text text null,
  status character varying(20) null default 'pending'::character varying,
  sent_at timestamp with time zone null,
  delivered_at timestamp with time zone null,
  error_message text null,
  retry_count integer null default 0,
  max_retries integer null default 3,
  created_at timestamp with time zone null default now(),
  constraint email_notifications_pkey primary key (id),
  constraint email_notifications_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint email_notifications_order_id_fkey foreign KEY (order_id) references orders (id)
) TABLESPACE pg_default;




create table public.email_templates (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  subject_template character varying(255) not null,
  html_template text not null,
  text_template text null,
  variables jsonb null default '[]'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint email_templates_pkey primary key (id),
  constraint email_templates_name_key unique (name)
) TABLESPACE pg_default;

create index IF not exists idx_email_templates_name on public.email_templates using btree (name) TABLESPACE pg_default;

create index IF not exists idx_email_templates_is_active on public.email_templates using btree (is_active) TABLESPACE pg_default;



create table public.inventory (
  id uuid not null default gen_random_uuid (),
  branch_id uuid not null,
  quantity_on_hand numeric(10, 2) not null default 0,
  quantity_reserved numeric(10, 2) not null default 0,
  quantity_available numeric GENERATED ALWAYS as ((quantity_on_hand - quantity_reserved)) STORED (10, 2) null,
  reorder_level numeric(10, 2) not null default 0,
  max_stock_level numeric(10, 2) not null default 0,
  last_counted timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  base_unit character varying(20) null default 'piece'::character varying,
  product_id uuid null,
  constraint inventory_pkey primary key (id),
  constraint inventory_branch_id_product_id_key unique (branch_id, product_id),
  constraint inventory_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint inventory_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_inventory_reorder_level on public.inventory using btree (reorder_level) TABLESPACE pg_default
where
  (quantity_on_hand <= reorder_level);

create index IF not exists idx_inventory_available on public.inventory using btree (branch_id, quantity_available) TABLESPACE pg_default
where
  (quantity_available > (0)::numeric);

create index IF not exists idx_inventory_product_id on public.inventory using btree (product_id) TABLESPACE pg_default;

create trigger audit_inventory_trigger
after INSERT
or DELETE
or
update on inventory for EACH row
execute FUNCTION audit_trigger_function ();

create trigger update_inventory_updated_at BEFORE
update on inventory for EACH row
execute FUNCTION update_updated_at_column ();



create table public.inventory_transactions (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  branch_id uuid not null,
  order_id uuid null,
  transaction_type character varying(20) not null,
  quantity_change numeric(10, 3) not null,
  quantity_before numeric(10, 3) not null,
  quantity_after numeric(10, 3) not null,
  reference_number character varying(100) null,
  notes text null,
  created_by uuid null,
  created_by_name character varying(100) null,
  created_at timestamp with time zone null default now(),
  constraint inventory_transactions_pkey primary key (id),
  constraint inventory_transactions_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint inventory_transactions_created_by_fkey foreign KEY (created_by) references users (id),
  constraint inventory_transactions_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint inventory_transactions_product_id_fkey foreign KEY (product_id) references products (id),
  constraint chk_transaction_type check (
    (
      (transaction_type)::text = any (
        (
          array[
            'sale'::character varying,
            'adjustment'::character varying,
            'restock'::character varying,
            'return'::character varying,
            'reservation'::character varying,
            'release'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_inventory_transactions_product_id on public.inventory_transactions using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_transactions_branch_id on public.inventory_transactions using btree (branch_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_transactions_order_id on public.inventory_transactions using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_transactions_type on public.inventory_transactions using btree (transaction_type) TABLESPACE pg_default;



-- Orders table additional indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Order items table additional indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Order status history table additional indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);

-- Email notifications table additional indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_order_id ON public.email_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_type ON public.email_notifications(email_type);



-- Enable RLS on new tables
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your needs)
CREATE POLICY "Public can read payment transactions" ON public.payment_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payment transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can read order tracking" ON public.order_tracking FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update order tracking" ON public.order_tracking FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read inventory transactions" ON public.inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert inventory transactions" ON public.inventory_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can read email templates" ON public.email_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage email templates" ON public.email_templates FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage system settings" ON public.system_settings FOR ALL USING (auth.role() = 'authenticated');



