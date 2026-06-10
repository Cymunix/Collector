-- CollectorsHub: Catalog item variants linked to catalog items.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_item_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  name text,
  slug text NOT NULL,
  sku text,
  identifier text,
  condition text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_item_variants_item_slug_unique UNIQUE (item_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_item_id
  ON public.catalog_item_variants (item_id);

CREATE INDEX IF NOT EXISTS idx_catalog_item_variants_is_active
  ON public.catalog_item_variants (is_active);

DROP TRIGGER IF EXISTS set_catalog_item_variants_updated_at ON public.catalog_item_variants;
CREATE TRIGGER set_catalog_item_variants_updated_at
BEFORE UPDATE ON public.catalog_item_variants
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.catalog_item_variants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_item_variants'
      AND policyname = 'catalog_item_variants_read'
  ) THEN
    CREATE POLICY catalog_item_variants_read
      ON public.catalog_item_variants
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_item_variants'
      AND policyname = 'catalog_item_variants_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_item_variants_write_platform_admin
      ON public.catalog_item_variants
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

CREATE OR REPLACE FUNCTION public.replace_catalog_item_variants(
  p_item_id uuid,
  p_variants jsonb DEFAULT '[]'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_is_platform_admin boolean;
  v_inserted_count integer := 0;
BEGIN
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'item_id is required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor_id
      AND p.subscription_tier::text = 'platform_admin'
  ) INTO v_is_platform_admin;

  IF NOT COALESCE(v_is_platform_admin, false) THEN
    RAISE EXCEPTION 'Only platform admins can manage catalog item variants.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.catalog_items i WHERE i.id = p_item_id) THEN
    RAISE EXCEPTION 'Catalog item not found for supplied item_id.';
  END IF;

  DELETE FROM public.catalog_item_variants
  WHERE item_id = p_item_id;

  INSERT INTO public.catalog_item_variants (
    item_id,
    name,
    slug,
    sku,
    identifier,
    condition,
    attributes,
    sort_order,
    created_by
  )
  SELECT
    p_item_id,
    NULLIF(trim(variant.value->>'name'), ''),
    public.catalog_slugify(
      COALESCE(
        NULLIF(trim(variant.value->>'name'), ''),
        NULLIF(trim(variant.value->>'sku'), ''),
        NULLIF(trim(variant.value->>'identifier'), ''),
        'variant'
      ) || '-' || variant.ordinality::text
    ),
    NULLIF(trim(variant.value->>'sku'), ''),
    NULLIF(trim(variant.value->>'identifier'), ''),
    NULLIF(trim(variant.value->>'condition'), ''),
    COALESCE(variant.value - 'name' - 'sku' - 'identifier' - 'condition', '{}'::jsonb),
    GREATEST(variant.ordinality::integer - 1, 0),
    v_actor_id
  FROM jsonb_array_elements(COALESCE(p_variants, '[]'::jsonb)) WITH ORDINALITY AS variant(value, ordinality)
  WHERE jsonb_typeof(variant.value) = 'object'
    AND (
      NULLIF(trim(variant.value->>'name'), '') IS NOT NULL
      OR NULLIF(trim(variant.value->>'sku'), '') IS NOT NULL
      OR NULLIF(trim(variant.value->>'identifier'), '') IS NOT NULL
      OR NULLIF(trim(variant.value->>'condition'), '') IS NOT NULL
    );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_catalog_item_variants(uuid, jsonb) TO authenticated;
