-- CollectorsHub: Direct + API catalog item ingestion.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_api_keys_is_active
  ON public.catalog_api_keys (is_active);

ALTER TABLE public.catalog_api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_api_keys'
      AND policyname = 'catalog_api_keys_platform_admin_read'
  ) THEN
    CREATE POLICY catalog_api_keys_platform_admin_read
      ON public.catalog_api_keys
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_api_keys'
      AND policyname = 'catalog_api_keys_platform_admin_write'
  ) THEN
    CREATE POLICY catalog_api_keys_platform_admin_write
      ON public.catalog_api_keys
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

DROP TRIGGER IF EXISTS set_catalog_api_keys_updated_at ON public.catalog_api_keys;
CREATE TRIGGER set_catalog_api_keys_updated_at
BEFORE UPDATE ON public.catalog_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.catalog_slugify(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' from regexp_replace(lower(COALESCE(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.create_catalog_api_key(p_key_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_raw_key text;
  v_key_hash text;
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
    RAISE EXCEPTION 'Only platform_admin can create catalog API keys';
  END IF;

  IF p_key_name IS NULL OR trim(p_key_name) = '' THEN
    RAISE EXCEPTION 'Key name is required';
  END IF;

  v_raw_key := encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');

  INSERT INTO public.catalog_api_keys (key_name, key_hash, created_by)
  VALUES (trim(p_key_name), v_key_hash, auth.uid());

  RETURN v_raw_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_catalog_item_direct(
  p_category_id uuid,
  p_subcategory_id uuid,
  p_franchise_id uuid,
  p_item_name text,
  p_release_year integer DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.catalog_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item public.catalog_items;
  v_slug text;
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
    RAISE EXCEPTION 'Only platform_admin can create catalog items directly';
  END IF;

  IF p_item_name IS NULL OR trim(p_item_name) = '' THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.catalog_subcategories s
    WHERE s.id = p_subcategory_id
      AND s.category_id = p_category_id
  ) THEN
    RAISE EXCEPTION 'Subcategory does not belong to category';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.catalog_franchises f
    WHERE f.id = p_franchise_id
      AND f.subcategory_id = p_subcategory_id
      AND f.category_id = p_category_id
  ) THEN
    RAISE EXCEPTION 'Franchise does not belong to category/subcategory';
  END IF;

  v_slug := public.catalog_slugify(p_item_name);
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Item slug cannot be empty';
  END IF;

  INSERT INTO public.catalog_items (
    category_id,
    subcategory_id,
    franchise_id,
    name,
    slug,
    description,
    release_year,
    metadata,
    created_by
  )
  VALUES (
    p_category_id,
    p_subcategory_id,
    p_franchise_id,
    trim(p_item_name),
    v_slug,
    NULLIF(trim(COALESCE(p_description, '')), ''),
    p_release_year,
    COALESCE(p_metadata, '{}'::jsonb),
    auth.uid()
  )
  ON CONFLICT (franchise_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    release_year = EXCLUDED.release_year,
    metadata = EXCLUDED.metadata,
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_catalog_item_via_api(
  p_api_key text,
  p_category_name text,
  p_subcategory_name text,
  p_franchise_name text,
  p_item_name text,
  p_release_year integer DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.catalog_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key_hash text;
  v_api_key_row public.catalog_api_keys;
  v_category_id uuid;
  v_subcategory_id uuid;
  v_franchise_id uuid;
  v_item public.catalog_items;
  v_category_slug text;
  v_subcategory_slug text;
  v_franchise_slug text;
  v_item_slug text;
BEGIN
  IF p_api_key IS NULL OR trim(p_api_key) = '' THEN
    RAISE EXCEPTION 'API key is required';
  END IF;

  IF p_category_name IS NULL OR trim(p_category_name) = '' THEN
    RAISE EXCEPTION 'Category name is required';
  END IF;

  IF p_subcategory_name IS NULL OR trim(p_subcategory_name) = '' THEN
    RAISE EXCEPTION 'Subcategory name is required';
  END IF;

  IF p_franchise_name IS NULL OR trim(p_franchise_name) = '' THEN
    RAISE EXCEPTION 'Franchise name is required';
  END IF;

  IF p_item_name IS NULL OR trim(p_item_name) = '' THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  v_key_hash := encode(digest(trim(p_api_key), 'sha256'), 'hex');

  SELECT *
  INTO v_api_key_row
  FROM public.catalog_api_keys k
  WHERE k.key_hash = v_key_hash
    AND k.is_active = true
  LIMIT 1;

  IF v_api_key_row.id IS NULL THEN
    RAISE EXCEPTION 'Invalid API key';
  END IF;

  v_category_slug := public.catalog_slugify(p_category_name);
  v_subcategory_slug := public.catalog_slugify(p_subcategory_name);
  v_franchise_slug := public.catalog_slugify(p_franchise_name);
  v_item_slug := public.catalog_slugify(p_item_name);

  IF v_category_slug = '' OR v_subcategory_slug = '' OR v_franchise_slug = '' OR v_item_slug = '' THEN
    RAISE EXCEPTION 'Category, subcategory, franchise, and item slugs must be non-empty';
  END IF;

  INSERT INTO public.catalog_categories (name, slug, sort_order)
  VALUES (trim(p_category_name), v_category_slug, 0)
  ON CONFLICT (slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_category_id;

  INSERT INTO public.catalog_subcategories (category_id, name, slug, sort_order)
  VALUES (v_category_id, trim(p_subcategory_name), v_subcategory_slug, 0)
  ON CONFLICT (category_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_subcategory_id;

  INSERT INTO public.catalog_franchises (category_id, subcategory_id, name, slug, sort_order, created_by)
  VALUES (v_category_id, v_subcategory_id, trim(p_franchise_name), v_franchise_slug, 0, v_api_key_row.created_by)
  ON CONFLICT (subcategory_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_franchise_id;

  INSERT INTO public.catalog_items (
    category_id,
    subcategory_id,
    franchise_id,
    name,
    slug,
    description,
    release_year,
    metadata,
    created_by
  )
  VALUES (
    v_category_id,
    v_subcategory_id,
    v_franchise_id,
    trim(p_item_name),
    v_item_slug,
    NULLIF(trim(COALESCE(p_description, '')), ''),
    p_release_year,
    COALESCE(p_metadata, '{}'::jsonb),
    v_api_key_row.created_by
  )
  ON CONFLICT (franchise_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    release_year = EXCLUDED.release_year,
    metadata = EXCLUDED.metadata,
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_item;

  UPDATE public.catalog_api_keys
  SET last_used_at = now()
  WHERE id = v_api_key_row.id;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.create_catalog_api_key(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_catalog_api_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb) TO anon, authenticated;
