-- Promotions table enhancements: add optional design, CTA, and multi-image support
-- Safe ALTERs (IF NOT EXISTS via DO blocks for Postgres)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN image_urls text[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'layout_style'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN layout_style varchar(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'text_alignment'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN text_alignment varchar(50);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'font_family'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN font_family varchar(100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'font_size'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN font_size varchar(20);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'text_color'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN text_color varchar(20);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'button_text'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN button_text varchar(100);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'button_link'
  ) THEN
    ALTER TABLE public.promotions ADD COLUMN button_link text;
  END IF;
END $$;

-- Optional: A single JSONB column as fallback to store all design settings
-- Uncomment if you prefer storing everything in one place instead of discrete columns
-- DO $$ BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_schema = 'public' AND table_name = 'promotions' AND column_name = 'design_settings'
--   ) THEN
--     ALTER TABLE public.promotions ADD COLUMN design_settings jsonb;
--   END IF;
-- END $$;




