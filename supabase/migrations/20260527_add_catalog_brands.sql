-- CollectorsHub: Catalog brands – linkable entity for all item categories.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  website text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_brands_is_active
  ON public.catalog_brands (is_active);

DROP TRIGGER IF EXISTS set_catalog_brands_updated_at ON public.catalog_brands;
CREATE TRIGGER set_catalog_brands_updated_at
BEFORE UPDATE ON public.catalog_brands
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.catalog_brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_brands'
      AND policyname = 'catalog_brands_read'
  ) THEN
    CREATE POLICY catalog_brands_read
      ON public.catalog_brands
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_brands'
      AND policyname = 'catalog_brands_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_brands_write_platform_admin
      ON public.catalog_brands
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      );
  END IF;
END
$$;

-- Add brand_id to catalog_items
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.catalog_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_items_brand_id
  ON public.catalog_items (brand_id);

-- Helper RPC: create or find a brand by name (returns brand id).
CREATE OR REPLACE FUNCTION public.upsert_catalog_brand(
  p_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_brand_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.subscription_tier::text = 'platform_admin'
  ) THEN
    RAISE EXCEPTION 'Only platform_admin can create brands';
  END IF;

  p_name := NULLIF(trim(p_name), '');
  IF p_name IS NULL THEN
    RAISE EXCEPTION 'Brand name is required';
  END IF;

  v_slug := public.catalog_slugify(p_name);
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Brand slug cannot be empty';
  END IF;

  INSERT INTO public.catalog_brands (name, slug, is_active, created_by)
  VALUES (p_name, v_slug, true, auth.uid())
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_brand_id;

  RETURN v_brand_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_catalog_brand(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_catalog_brand(text) TO authenticated;
