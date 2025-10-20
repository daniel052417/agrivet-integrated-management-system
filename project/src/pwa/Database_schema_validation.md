## **Branches**
create table public.branches (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  code character varying(10) not null,
  address text not null,
  city character varying(50) not null,
  province character varying(50) not null,
  postal_code character varying(10) null,
  phone character varying(20) null,
  email character varying(255) null,
  manager_id uuid null,
  is_active boolean null default true,
  operating_hours jsonb null,
  created_at timestamp with time zone null default now(),
  branch_type character varying(20) null default 'satellite'::character varying,
  constraint branches_pkey primary key (id),
  constraint branches_code_key unique (code),
  constraint branches_manager_id_fkey foreign KEY (manager_id) references users (id),
  constraint branches_branch_type_check check (
    (
      (branch_type)::text = any (
        (
          array[
            'main'::character varying,
            'satellite'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_branches_code on public.branches using btree (code) TABLESPACE pg_default;

create index IF not exists idx_branches_is_active on public.branches using btree (is_active) TABLESPACE pg_default;

create trigger audit_branches_trigger
after INSERT
or DELETE
or
update on branches for EACH row
execute FUNCTION audit_trigger_function ();

---
## **Products**
create table public.products (
  id uuid not null default gen_random_uuid (),
  sku character varying(50) not null,
  name character varying(200) not null,
  description text null,
  category_id uuid not null,
  brand character varying(100) null,
  unit_of_measure character varying(20) not null,
  weight numeric(10, 3) null,
  dimensions jsonb null,
  is_prescription_required boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  barcode text null,
  supplier_id uuid null,
  constraint products_pkey primary key (id),
  constraint products_sku_key unique (sku),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id),
  constraint products_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id)
) TABLESPACE pg_default;

create index IF not exists idx_products_category_id on public.products using btree (category_id) TABLESPACE pg_default;

create index IF not exists idx_products_sku on public.products using btree (sku) TABLESPACE pg_default;

create index IF not exists idx_products_is_active on public.products using btree (is_active) TABLESPACE pg_default;

create trigger audit_products_trigger
after INSERT
or DELETE
or
update on products for EACH row
execute FUNCTION audit_trigger_function ();

create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();

---

## **product_variants**
create table public.product_variants (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  sku character varying(50) not null,
  name character varying(200) not null,
  variant_type character varying(50) not null,
  variant_value character varying(100) not null,
  price numeric(10, 2) not null,
  cost numeric(10, 2) null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  stock_quantity integer null default 0,
  minimum_stock integer null default 0,
  maximum_stock integer null,
  pos_pricing_type character varying(20) null default 'fixed'::character varying,
  weight_per_unit numeric(10, 3) null default null::numeric,
  bulk_discount_threshold integer null,
  bulk_discount_percentage numeric(5, 2) null default null::numeric,
  requires_expiry_date boolean null default false,
  requires_batch_tracking boolean null default false,
  is_quick_sale boolean null default false,
  barcode text null,
  expiry_date date null,
  batch_number character varying(50) null,
  image_url text null,
  constraint product_variants_pkey primary key (id),
  constraint product_variants_sku_key unique (sku),
  constraint product_variants_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint chk_product_variants_pos_pricing_type check (
    (
      (pos_pricing_type)::text = any (
        (
          array[
            'fixed'::character varying,
            'weight_based'::character varying,
            'bulk'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_product_variants_product_id on public.product_variants using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_variants_sku on public.product_variants using btree (sku) TABLESPACE pg_default;

create index IF not exists idx_product_variants_is_active on public.product_variants using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_product_variants_stock_quantity on public.product_variants using btree (stock_quantity) TABLESPACE pg_default;

create index IF not exists idx_product_variants_pos_pricing_type on public.product_variants using btree (pos_pricing_type) TABLESPACE pg_default;

create index IF not exists idx_product_variants_is_quick_sale on public.product_variants using btree (is_quick_sale) TABLESPACE pg_default;

create index IF not exists idx_product_variants_barcode on public.product_variants using btree (barcode) TABLESPACE pg_default;

create index IF not exists idx_product_variants_active_branch on public.product_variants using btree (is_active) INCLUDE (id, name, price, sku) TABLESPACE pg_default;

create trigger audit_product_variants_trigger
after INSERT
or DELETE
or
update on product_variants for EACH row
execute FUNCTION audit_trigger_function ();

---

## **categories**
create table public.categories (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  description text null,
  parent_id uuid null,
  sort_order integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_parent_id_fkey foreign KEY (parent_id) references categories (id)
) TABLESPACE pg_default;

create index IF not exists idx_categories_parent_id on public.categories using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_categories_is_active on public.categories using btree (is_active) TABLESPACE pg_default;

create trigger audit_categories_trigger
after INSERT
or DELETE
or
update on categories for EACH row
execute FUNCTION audit_trigger_function ();

---

## **inventory**
create table public.inventory (
  id uuid not null default gen_random_uuid (),
  branch_id uuid not null,
  product_variant_id uuid not null,
  quantity_on_hand numeric(10, 2) not null default 0,
  quantity_reserved numeric(10, 2) not null default 0,
  quantity_available numeric GENERATED ALWAYS as ((quantity_on_hand - quantity_reserved)) STORED (10, 2) null,
  reorder_level numeric(10, 2) not null default 0,
  max_stock_level numeric(10, 2) not null default 0,
  last_counted timestamp with time zone null,
  updated_at timestamp with time zone null default now(),
  constraint inventory_pkey primary key (id),
  constraint inventory_branch_id_product_variant_id_key unique (branch_id, product_variant_id),
  constraint inventory_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint inventory_product_variant_id_fkey foreign KEY (product_variant_id) references product_variants (id)
) TABLESPACE pg_default;

create index IF not exists idx_inventory_branch_product on public.inventory using btree (branch_id, product_variant_id) TABLESPACE pg_default;

create index IF not exists idx_inventory_reorder_level on public.inventory using btree (reorder_level) TABLESPACE pg_default
where
  (quantity_on_hand <= reorder_level);

create index IF not exists idx_inventory_available on public.inventory using btree (branch_id, quantity_available) TABLESPACE pg_default
where
  (quantity_available > (0)::numeric);

create trigger audit_inventory_trigger
after INSERT
or DELETE
or
update on inventory for EACH row
execute FUNCTION audit_trigger_function ();

create trigger update_inventory_updated_at BEFORE
update on inventory for EACH row
execute FUNCTION update_updated_at_column ();

---

## **custmoers**
create table public.customers (
  id uuid not null default gen_random_uuid (),
  customer_number character varying(20) not null,
  first_name character varying(100) not null,
  last_name character varying(100) not null,
  email character varying(255) null,
  phone character varying(20) null,
  address text null,
  city character varying(50) null,
  province character varying(50) null,
  customer_type character varying(20) not null default 'regular'::character varying,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  user_id uuid null,
  customer_code character varying(20) null,
  date_of_birth date null,
  registration_date timestamp with time zone null default now(),
  total_spent numeric(12, 2) null default 0.00,
  last_purchase_date timestamp with time zone null,
  loyalty_points integer null default 0,
  loyalty_tier character varying(20) null default 'bronze'::character varying,
  total_lifetime_spent numeric(12, 2) null default 0.00,
  is_guest boolean null default false,
  guest_session_id character varying(255) null,
  updated_at timestamp with time zone null default now(),
  preferred_branch_id uuid null,
  constraint customers_pkey primary key (id),
  constraint customers_customer_code_key unique (customer_code),
  constraint customers_customer_number_key unique (customer_number),
  constraint customers_email_key unique (email),
  constraint customers_user_id_key unique (user_id),
  constraint customers_preferred_branch_id_fkey foreign KEY (preferred_branch_id) references branches (id),
  constraint customers_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint chk_loyalty_tier check (
    (
      (loyalty_tier)::text = any (
        (
          array[
            'bronze'::character varying,
            'silver'::character varying,
            'gold'::character varying,
            'platinum'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_customer_type check (
    (
      (customer_type)::text = any (
        (
          array[
            'regular'::character varying,
            'vip'::character varying,
            'wholesale'::character varying,
            'individual'::character varying,
            'business'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_customers_customer_number on public.customers using btree (customer_number) TABLESPACE pg_default;

create index IF not exists idx_customers_email on public.customers using btree (email) TABLESPACE pg_default;

create index IF not exists idx_customers_phone on public.customers using btree (phone) TABLESPACE pg_default;

create index IF not exists idx_customers_customer_type on public.customers using btree (customer_type) TABLESPACE pg_default;

create index IF not exists idx_customers_customer_code on public.customers using btree (customer_code) TABLESPACE pg_default;

create index IF not exists idx_customers_loyalty_tier on public.customers using btree (loyalty_tier) TABLESPACE pg_default;

create index IF not exists idx_customers_user_id on public.customers using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_customers_is_active on public.customers using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_customers_registration_date on public.customers using btree (registration_date) TABLESPACE pg_default;

create index IF not exists idx_customers_total_spent on public.customers using btree (total_spent) TABLESPACE pg_default;

create index IF not exists idx_customers_preferred_branch_id on public.customers using btree (preferred_branch_id) TABLESPACE pg_default;

create trigger audit_customers_trigger
after INSERT
or DELETE
or
update on customers for EACH row
execute FUNCTION audit_trigger_function ();

create trigger set_customer_code_trigger BEFORE INSERT on customers for EACH row
execute FUNCTION set_customer_code ();

create trigger set_customer_number_trigger BEFORE INSERT on customers for EACH row
execute FUNCTION set_customer_number ();

create trigger update_customers_updated_at BEFORE
update on customers for EACH row
execute FUNCTION update_updated_at_column ();

---

## **orders**
create table public.orders (
  id uuid not null default gen_random_uuid (),
  order_number character varying(50) not null,
  customer_id uuid null,
  branch_id uuid not null,
  status character varying(20) null default 'pending'::character varying,
  subtotal numeric(10, 2) not null,
  tax_amount numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  payment_method character varying(20) not null,
  payment_reference character varying(100) null,
  payment_notes text null,
  estimated_ready_time timestamp without time zone null,
  is_guest_order boolean null default false,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_order_number_key unique (order_number),
  constraint orders_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references customers (id)
) TABLESPACE pg_default;

create index IF not exists idx_orders_guest_branch on public.orders using btree (is_guest_order, branch_id, created_at) TABLESPACE pg_default;

---

## **order_items**
create table public.order_items (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  product_variant_id uuid not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null,
  weight numeric(8, 2) null,
  expiry_date date null,
  batch_number character varying(100) null,
  notes text null,
  created_at timestamp without time zone null default now(),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint order_items_product_variant_id_fkey foreign KEY (product_variant_id) references product_variants (id)
) TABLESPACE pg_default;

---

## **promotions**
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

---

## **promotion_usage**
create table public.promotion_usage (
  id uuid not null default gen_random_uuid (),
  promotion_id uuid not null,
  customer_id uuid null,
  order_id uuid null,
  used_at timestamp without time zone null default now(),
  constraint promotion_usage_pkey primary key (id),
  constraint promotion_usage_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint promotion_usage_order_id_fkey foreign KEY (order_id) references orders (id),
  constraint promotion_usage_promotion_id_fkey foreign KEY (promotion_id) references promotions (id)
) TABLESPACE pg_default;

---

## **promotion_branches**
create table public.promotion_branches (
  id uuid not null default gen_random_uuid (),
  promotion_id uuid not null,
  branch_id uuid not null,
  created_at timestamp without time zone null default now(),
  constraint promotion_branches_pkey primary key (id),
  constraint promotion_branches_promotion_id_branch_id_key unique (promotion_id, branch_id),
  constraint promotion_branches_branch_id_fkey foreign KEY (branch_id) references branches (id),
  constraint promotion_branches_promotion_id_fkey foreign KEY (promotion_id) references promotions (id)
) TABLESPACE pg_default;

## **promotion_products**
create table public.promotion_products (
  promotion_id uuid not null,
  product_id uuid null,
  category_id uuid null,
  constraint uq_promotion_category unique (promotion_id, category_id),
  constraint uq_promotion_product unique (promotion_id, product_id),
  constraint promotion_products_category_id_fkey foreign KEY (category_id) references categories (id),
  constraint promotion_products_product_id_fkey foreign KEY (product_id) references products (id),
  constraint promotion_products_promotion_id_fkey foreign KEY (promotion_id) references promotions (id) on delete CASCADE,
  constraint chk_product_or_category check (
    (
      (
        (product_id is not null)
        and (category_id is null)
      )
      or (
        (product_id is null)
        and (category_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_promotion_products_promotion_id on public.promotion_products using btree (promotion_id) TABLESPACE pg_default;

create index IF not exists idx_promotion_products_product_id on public.promotion_products using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_promotion_products_category_id on public.promotion_products using btree (category_id) TABLESPACE pg_default;

## **user_preferences**
create table public.user_preferences (
  id uuid not null default gen_random_uuid (),
  customer_id uuid not null,
  preferred_branch_id uuid null,
  special_instructions text null,
  primary_phone character varying(20) null,
  preferred_contact_method character varying(20) null default 'phone'::character varying,
  order_ready_alerts boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_customer_id_key unique (customer_id),
  constraint user_preferences_branch_id_fkey foreign KEY (preferred_branch_id) references branches (id),
  constraint user_preferences_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_preferences_customer_id on public.user_preferences using btree (customer_id) TABLESPACE pg_default;

create index IF not exists idx_user_preferences_branch_id on public.user_preferences using btree (preferred_branch_id) TABLESPACE pg_default;

---

## **cart_items**
create table public.cart_items (
  id uuid not null default gen_random_uuid (),
  customer_id uuid null,
  guest_session_id character varying(255) null,
  product_variant_id uuid null,
  quantity integer not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cart_items_pkey primary key (id),
  constraint cart_items_customer_id_fkey foreign KEY (customer_id) references customers (id),
  constraint cart_items_product_variant_id_fkey foreign KEY (product_variant_id) references product_variants (id)
) TABLESPACE pg_default;