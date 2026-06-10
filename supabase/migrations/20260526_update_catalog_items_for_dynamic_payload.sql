-- CollectorsHub: Make catalog_items accept structured admin payload fields.
-- Safe to run multiple times.

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS identifier text,
  ADD COLUMN IF NOT EXISTS item_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS dynamic_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'catalog_items_item_status_check'
      AND conrelid = 'public.catalog_items'::regclass
  ) THEN
    ALTER TABLE public.catalog_items
      ADD CONSTRAINT catalog_items_item_status_check
      CHECK (item_status IN ('draft', 'published'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_catalog_items_item_status
  ON public.catalog_items (item_status);

CREATE INDEX IF NOT EXISTS idx_catalog_items_identifier
  ON public.catalog_items (identifier);

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
  v_identifier text;
  v_item_status text;
  v_dynamic_fields jsonb;
  v_metadata_clean jsonb;
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

  v_identifier := NULLIF(trim(COALESCE(p_metadata->>'identifier', '')), '');
  v_item_status := lower(COALESCE(NULLIF(trim(COALESCE(p_metadata->>'status', '')), ''), 'draft'));

  IF v_item_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid item status: %. Allowed values are draft, published.', v_item_status;
  END IF;

  v_dynamic_fields := CASE
    WHEN jsonb_typeof(COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)) = 'object'
      THEN COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)
    ELSE '{}'::jsonb
  END;

  v_metadata_clean := COALESCE(p_metadata, '{}'::jsonb) - 'identifier' - 'status' - 'dynamic_fields' - 'variants';

  INSERT INTO public.catalog_items (
    category_id,
    subcategory_id,
    franchise_id,
    name,
    slug,
    description,
    release_year,
    identifier,
    item_status,
    dynamic_fields,
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
    v_identifier,
    v_item_status,
    v_dynamic_fields,
    v_metadata_clean,
    auth.uid()
  )
  ON CONFLICT (franchise_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    release_year = EXCLUDED.release_year,
    identifier = EXCLUDED.identifier,
    item_status = EXCLUDED.item_status,
    dynamic_fields = EXCLUDED.dynamic_fields,
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
  v_identifier text;
  v_item_status text;
  v_dynamic_fields jsonb;
  v_metadata_clean jsonb;
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

  v_identifier := NULLIF(trim(COALESCE(p_metadata->>'identifier', '')), '');
  v_item_status := lower(COALESCE(NULLIF(trim(COALESCE(p_metadata->>'status', '')), ''), 'draft'));

  IF v_item_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid item status: %. Allowed values are draft, published.', v_item_status;
  END IF;

  v_dynamic_fields := CASE
    WHEN jsonb_typeof(COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)) = 'object'
      THEN COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)
    ELSE '{}'::jsonb
  END;

  v_metadata_clean := COALESCE(p_metadata, '{}'::jsonb) - 'identifier' - 'status' - 'dynamic_fields' - 'variants';

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
    identifier,
    item_status,
    dynamic_fields,
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
    v_identifier,
    v_item_status,
    v_dynamic_fields,
    v_metadata_clean,
    v_api_key_row.created_by
  )
  ON CONFLICT (franchise_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    release_year = EXCLUDED.release_year,
    identifier = EXCLUDED.identifier,
    item_status = EXCLUDED.item_status,
    dynamic_fields = EXCLUDED.dynamic_fields,
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

REVOKE ALL ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb) TO anon, authenticated;
