# Landing Page Database Requirements

This document outlines the database tables required for the landing page to be accurate and fully functional.

## Required Database Tables

### 1. **`categories`** ✅ Required
**Purpose:** Product categorization and navigation
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
---

### 2. **`products`** ✅ Required
**Purpose:** Product information and listings
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
  image_url text null,
  cost numeric(10, 2) null default 0,
  requires_expiry_date boolean null default false,
  requires_batch_tracking boolean null default false,
  is_quick_sale boolean null default false,
  constraint products_pkey primary key (id),
  constraint products_category_id_fkey foreign KEY (category_id) references categories (id),
  constraint products_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id)
) TABLESPACE pg_default;

create index IF not exists idx_products_category_id on public.products using btree (category_id) TABLESPACE pg_default;
---

### 3. **`brands`** ✅ Required
**Purpose:** Brand information with images
create table public.brands (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint brands_pkey primary key (id),
  constraint brands_name_key unique (name)
) TABLESPACE pg_default;

create index IF not exists idx_brands_name on public.brands using btree (name) TABLESPACE pg_default;

create trigger update_brands_updated_at BEFORE
update on brands for EACH row
execute FUNCTION update_updated_at_column ();
---

### 4. **`product_units`** ✅ Required
**Purpose:** Product pricing and unit information
create table public.product_units (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null,
  unit_name character varying(50) not null,
  unit_label character varying(20) not null,
  conversion_factor numeric(10, 4) not null,
  is_base_unit boolean null default false,
  is_sellable boolean null default true,
  price_per_unit numeric(10, 2) not null,
  min_sellable_quantity numeric(10, 3) null default 1,
  created_at timestamp with time zone null default now(),
  constraint product_units_pkey primary key (id),
  constraint product_units_product_id_unit_name_key unique (product_id, unit_name),
  constraint unique_base_unit_per_product unique (product_id, is_base_unit) deferrable initially DEFERRED,
  constraint product_units_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_product_units_sellable on public.product_units using btree (product_id, is_sellable) TABLESPACE pg_default;

create index IF not exists idx_product_units_base on public.product_units using btree (product_id, is_base_unit) TABLESPACE pg_default
where
  (is_base_unit = true);
---

## Optional/Not Currently Used

### **`promotions`** ⚠️ Not Currently Used
**Status:** The `Promotions.tsx` component uses **hardcoded data**, not database queries.
create table public.promotions (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  start_date date not null,
  end_date date not null,
  products jsonb null default '[]'::jsonb,
  categories jsonb null default '[]'::jsonb,
  show_on_pwa boolean null default true,
  share_to_facebook boolean null default false,
  status text null default 'upcoming'::text,
  max_uses integer null,
  total_uses integer null default 0,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  image_url text null,
  promotion_type text not null,
  total_views integer null default 0,
  total_clicks integer null default 0,
  updated_by uuid null,
  image_urls text[] null,
  layout_style character varying(50) null,
  text_alignment character varying(50) null,
  font_family character varying(100) null,
  font_size character varying(20) null,
  text_color character varying(20) null,
  button_text character varying(100) null,
  button_link text null,
  is_active boolean null default true,
  display_priority integer null default 0,
  display_settings jsonb null default '{"showAsModal": false, "modalTrigger": "immediate", "showAsBanner": false, "bannerPosition": "top", "showAsCarousel": false, "carouselInterval": 5000, "carouselPosition": "both", "showAsNotification": false, "notificationTrigger": "immediate"}'::jsonb,
  display_mode text null default 'banner'::text,
  auto_end boolean null default false,
  pin_to_top boolean null default false,
  show_on_landing_page boolean null default false,
  slideshow_autoplay boolean null default false,
  slideshow_speed integer null,
  constraint promotions_pkey primary key (id),
  constraint promotions_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint promotions_updated_by_fkey foreign KEY (updated_by) references auth.users (id) on delete set null,
  constraint promotions_display_mode_check check (
    (
      display_mode = any (
        array[
          'banner'::text,
          'modal'::text,
          'notification'::text,
          'carousel'::text
        ]
      )
    )
  ),
  constraint promotions_promotion_type_check check (
    (
      promotion_type = any (
        array['new_item'::text, 'restock'::text, 'event'::text]
      )
    )
  ),
  constraint promotions_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'active'::text,
          'upcoming'::text,
          'expired'::text,
          'archived'::text
        ]
      )
    )
  ),
  constraint promotions_total_clicks_check check ((total_clicks >= 0)),
  constraint promotions_total_uses_check check ((total_uses >= 0)),
  constraint promotions_total_views_check check ((total_views >= 0)),
  constraint promotions_max_uses_check check (
    (
      (max_uses is null)
      or (max_uses > 0)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_promotions_status on public.promotions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_promotions_dates on public.promotions using btree (start_date, end_date) TABLESPACE pg_default;

create index IF not exists idx_promotions_pwa on public.promotions using btree (show_on_pwa) TABLESPACE pg_default
where
  (show_on_pwa = true);

create index IF not exists idx_promotions_facebook on public.promotions using btree (share_to_facebook) TABLESPACE pg_default
where
  (share_to_facebook = true);

create index IF not exists idx_promotions_created_by on public.promotions using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_promotions_promotion_type on public.promotions using btree (promotion_type) TABLESPACE pg_default;

create index IF not exists idx_promotions_total_views on public.promotions using btree (total_views) TABLESPACE pg_default;

create index IF not exists idx_promotions_total_clicks on public.promotions using btree (total_clicks) TABLESPACE pg_default;

create trigger update_promotion_status_trigger BEFORE INSERT
or
update on promotions for EACH row
execute FUNCTION update_promotion_status ();

create trigger update_promotions_updated_at BEFORE
update on promotions for EACH row
execute FUNCTION update_updated_at_column ();
---

### **`branches`** ⚠️ Not Currently Used
**Status:** The `Branches.tsx` component uses **hardcoded data**, not database queries.
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
  latitude numeric(10, 8) null,
  longitude numeric(11, 8) null,
  attendance_pin character varying(20) null,
  attendance_security_settings jsonb null default '{"enableActivityLogging": true, "enablePinAccessControl": false, "pinSessionDurationHours": 24, "enableDeviceVerification": false, "requirePinForEachSession": false, "geoLocationToleranceMeters": 100, "enableGeoLocationVerification": false}'::jsonb,
  allow_device_registration boolean not null default false,
  allow_attendance_device_for_pos boolean not null default false,
  constraint branches_pkey primary key (id),
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

create index IF not exists idx_branches_coordinates on public.branches using btree (latitude, longitude) TABLESPACE pg_default
where
  (
    (latitude is not null)
    and (longitude is not null)
  );

create index IF not exists idx_branches_allow_device_registration on public.branches using btree (allow_device_registration) TABLESPACE pg_default
where
  (allow_device_registration = true);

create index IF not exists idx_branches_allow_attendance_device_for_pos on public.branches using btree (allow_attendance_device_for_pos) TABLESPACE pg_default
where
  (allow_attendance_device_for_pos = true);
---

## Data Relationships

```
categories (1) ──< (many) products
products (1) ──< (many) product_units
products.brand (text) ── matches ──> brands.name
```

## Required Row Level Security (RLS) Policies

For the landing page to work properly, these tables should have **public read access**:

1. **`categories`**: Allow SELECT for `is_active = true` records
2. **`products`**: Allow SELECT for `is_active = true` records
3. **`brands`**: Allow SELECT for all records
4. **`product_units`**: Allow SELECT for `is_sellable = true` records

## Summary

### ✅ Currently Required (4 tables):
1. `categories` - Product categories
2. `products` - Product information
3. `brands` - Brand information
4. `product_units` - Product pricing and units

### ⚠️ Recommended for Full Functionality (2 tables):
5. `promotions` - Dynamic promotions (currently hardcoded)
6. `branches` - Dynamic branch information (currently hardcoded)

### 📋 Key Requirements:
- All tables must have proper foreign key relationships
- `products.brand` must match `brands.name` for proper joining
- Products must be filtered by `is_active = true`
- Product units must be filtered by `is_sellable = true`
- Categories must be filtered by `is_active = true`
- RLS policies must allow public read access for landing page visitors

