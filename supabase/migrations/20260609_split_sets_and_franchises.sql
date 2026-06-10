-- CollectorsHub: split collectible sets from true franchises.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_franchise_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_franchise_brands_name
  ON public.catalog_franchise_brands (name);

DROP TRIGGER IF EXISTS set_catalog_franchise_brands_updated_at ON public.catalog_franchise_brands;
CREATE TRIGGER set_catalog_franchise_brands_updated_at
BEFORE UPDATE ON public.catalog_franchise_brands
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.catalog_franchise_brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_franchise_brands'
      AND policyname = 'catalog_franchise_brands_read'
  ) THEN
    CREATE POLICY catalog_franchise_brands_read
      ON public.catalog_franchise_brands
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_franchise_brands'
      AND policyname = 'catalog_franchise_brands_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_franchise_brands_write_platform_admin
      ON public.catalog_franchise_brands
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
END;
$$;

ALTER TABLE public.collectible_sets
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid,
  ADD COLUMN IF NOT EXISTS franchise_id uuid,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collectible_sets_category_fk'
  ) THEN
    ALTER TABLE public.collectible_sets
      ADD CONSTRAINT collectible_sets_category_fk
      FOREIGN KEY (category_id)
      REFERENCES public.catalog_categories(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collectible_sets_subcategory_category_fk'
  ) THEN
    ALTER TABLE public.collectible_sets
      ADD CONSTRAINT collectible_sets_subcategory_category_fk
      FOREIGN KEY (subcategory_id, category_id)
      REFERENCES public.catalog_subcategories(id, category_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collectible_sets_franchise_fk'
  ) THEN
    ALTER TABLE public.collectible_sets
      ADD CONSTRAINT collectible_sets_franchise_fk
      FOREIGN KEY (franchise_id)
      REFERENCES public.catalog_franchise_brands(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collectible_sets_id_subcategory_category_unique'
  ) THEN
    ALTER TABLE public.collectible_sets
      ADD CONSTRAINT collectible_sets_id_subcategory_category_unique UNIQUE (id, subcategory_id, category_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'collectible_sets_subcategory_slug_unique'
  ) THEN
    ALTER TABLE public.collectible_sets
      ADD CONSTRAINT collectible_sets_subcategory_slug_unique UNIQUE (subcategory_id, slug);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_collectible_sets_category_id
  ON public.collectible_sets (category_id);

CREATE INDEX IF NOT EXISTS idx_collectible_sets_subcategory_id
  ON public.collectible_sets (subcategory_id);

CREATE INDEX IF NOT EXISTS idx_collectible_sets_franchise_id
  ON public.collectible_sets (franchise_id);

DO $$
BEGIN
  -- Only transfer from the legacy table form. If catalog_franchises is already a view,
  -- the transfer has already happened and this block should no-op.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_franchises'
      AND table_type = 'BASE TABLE'
  ) THEN
    INSERT INTO public.collectible_sets (
      id,
      category_id,
      subcategory_id,
      category_name,
      subcategory_name,
      set_name,
      slug,
      total_items,
      is_active,
      sort_order,
      created_by,
      metadata
    )
    SELECT
      f.id,
      f.category_id,
      f.subcategory_id,
      c.name,
      s.name,
      f.name,
      f.slug,
      1,
      f.is_active,
      f.sort_order,
      f.created_by,
      jsonb_build_object('legacy_catalog_franchise_id', f.id::text)
    FROM public.catalog_franchises f
    LEFT JOIN public.catalog_categories c ON c.id = f.category_id
    LEFT JOIN public.catalog_subcategories s ON s.id = f.subcategory_id
    ON CONFLICT (id) DO UPDATE
    SET
      category_id = EXCLUDED.category_id,
      subcategory_id = EXCLUDED.subcategory_id,
      category_name = EXCLUDED.category_name,
      subcategory_name = EXCLUDED.subcategory_name,
      set_name = EXCLUDED.set_name,
      slug = EXCLUDED.slug,
      is_active = EXCLUDED.is_active,
      sort_order = EXCLUDED.sort_order,
      created_by = EXCLUDED.created_by,
      metadata = COALESCE(public.collectible_sets.metadata, '{}'::jsonb) || EXCLUDED.metadata,
      updated_at = now();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_items'
      AND column_name = 'franchise_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_items'
      AND column_name = 'collectible_set_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.catalog_items RENAME COLUMN franchise_id TO collectible_set_id';
  END IF;
END;
$$;

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS collectible_set_id uuid;

-- Drop legacy FK before mapping collectible_set_id values.
-- If franchise_id was renamed, this old FK now points at collectible_set_id
-- but still references catalog_franchises, which blocks backfill updates.
ALTER TABLE public.catalog_items
  DROP CONSTRAINT IF EXISTS catalog_items_franchise_subcategory_category_fk;

UPDATE public.catalog_items i
SET collectible_set_id = s.id
FROM public.collectible_sets s
WHERE (s.metadata->>'legacy_catalog_franchise_id')::uuid = i.collectible_set_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'catalog_items'
      AND column_name = 'franchise_id'
  ) THEN
    EXECUTE '
      UPDATE public.catalog_items i
      SET collectible_set_id = s.id
      FROM public.collectible_sets s
      WHERE i.collectible_set_id IS NULL
        AND (s.metadata->>''legacy_catalog_franchise_id'')::uuid = i.franchise_id
    ';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'catalog_items_collectible_set_slug_unique'
  ) THEN
    ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_franchise_slug_unique;
    ALTER TABLE public.catalog_items
      ADD CONSTRAINT catalog_items_collectible_set_slug_unique UNIQUE (collectible_set_id, slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'catalog_items_collectible_set_subcategory_category_fk'
  ) THEN
    ALTER TABLE public.catalog_items
      ADD CONSTRAINT catalog_items_collectible_set_subcategory_category_fk
      FOREIGN KEY (collectible_set_id, subcategory_id, category_id)
      REFERENCES public.collectible_sets(id, subcategory_id, category_id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_catalog_items_collectible_set_id
  ON public.catalog_items (collectible_set_id);

DO $$
BEGIN
  -- Retire legacy set table name and keep a compatibility view for read/query safety.
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_franchises'
      AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_franchises_legacy'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE 'ALTER TABLE public.catalog_franchises RENAME TO catalog_franchises_legacy';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'catalog_franchises'
      AND table_type = 'BASE TABLE'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE VIEW public.catalog_franchises AS
      SELECT
        id,
        category_id,
        subcategory_id,
        set_name AS name,
        slug,
        is_active,
        sort_order,
        created_by,
        created_at,
        updated_at
      FROM public.collectible_sets
    ';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_catalog_collectible_set(
  p_category_id uuid,
  p_subcategory_id uuid,
  p_set_name text,
  p_franchise_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
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
    RAISE EXCEPTION 'Only platform_admin can manage catalog sets';
  END IF;

  IF p_set_name IS NULL OR trim(p_set_name) = '' THEN
    RAISE EXCEPTION 'Set name is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.catalog_subcategories s
    WHERE s.id = p_subcategory_id
      AND s.category_id = p_category_id
  ) THEN
    RAISE EXCEPTION 'Subcategory does not belong to category';
  END IF;

  IF p_franchise_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.catalog_franchise_brands f
    WHERE f.id = p_franchise_id
      AND f.is_active = true
  ) THEN
    RAISE EXCEPTION 'Franchise not found or inactive';
  END IF;

  v_slug := public.catalog_slugify(p_set_name);
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Set slug cannot be empty';
  END IF;

  INSERT INTO public.collectible_sets (
    category_id,
    subcategory_id,
    category_name,
    subcategory_name,
    franchise_id,
    franchise_name,
    set_name,
    slug,
    total_items,
    is_active,
    created_by
  )
  SELECT
    p_category_id,
    p_subcategory_id,
    c.name,
    s.name,
    p_franchise_id,
    f.name,
    trim(p_set_name),
    v_slug,
    1,
    true,
    auth.uid()
  FROM public.catalog_categories c
  JOIN public.catalog_subcategories s ON s.id = p_subcategory_id AND s.category_id = c.id
  LEFT JOIN public.catalog_franchise_brands f ON f.id = p_franchise_id
  WHERE c.id = p_category_id
  ON CONFLICT (subcategory_id, slug) DO UPDATE
  SET
    category_id = EXCLUDED.category_id,
    category_name = EXCLUDED.category_name,
    subcategory_name = EXCLUDED.subcategory_name,
    franchise_id = EXCLUDED.franchise_id,
    franchise_name = EXCLUDED.franchise_name,
    set_name = EXCLUDED.set_name,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_catalog_franchise(
  p_category_id uuid,
  p_subcategory_id uuid,
  p_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.upsert_catalog_collectible_set(
    p_category_id,
    p_subcategory_id,
    p_name,
    NULL
  );
END;
$$;

DROP FUNCTION IF EXISTS public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, uuid, jsonb);

CREATE FUNCTION public.create_catalog_item_direct(
  p_category_id uuid,
  p_subcategory_id uuid,
  p_collectible_set_id uuid,
  p_item_name text,
  p_release_year integer DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_brand_id uuid DEFAULT NULL,
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
    FROM public.collectible_sets s
    WHERE s.id = p_collectible_set_id
      AND s.subcategory_id = p_subcategory_id
      AND s.category_id = p_category_id
      AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'Collectible set does not belong to category/subcategory';
  END IF;

  IF p_brand_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.catalog_brands b WHERE b.id = p_brand_id AND b.is_active = true
  ) THEN
    RAISE EXCEPTION 'Brand not found or inactive';
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
    collectible_set_id,
    brand_id,
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
    p_collectible_set_id,
    p_brand_id,
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
  ON CONFLICT (collectible_set_id, slug) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    release_year = EXCLUDED.release_year,
    brand_id = EXCLUDED.brand_id,
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

REVOKE ALL ON FUNCTION public.upsert_catalog_collectible_set(uuid, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_catalog_franchise(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upsert_catalog_collectible_set(uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_catalog_franchise(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_catalog_item_direct(uuid, uuid, uuid, text, integer, text, uuid, jsonb) TO authenticated;