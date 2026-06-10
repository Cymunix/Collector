-- CollectorsHub: Extend create_catalog_item_via_api to support brand linkage,
-- people credits, minifigures, and variants saving.
-- Must DROP old signature first (new optional params cannot be added via OR REPLACE).

DROP FUNCTION IF EXISTS public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb);

CREATE FUNCTION public.create_catalog_item_via_api(
  p_api_key         text,
  p_category_name   text,
  p_subcategory_name text,
  p_franchise_name  text,
  p_item_name       text,
  p_release_year    integer DEFAULT NULL,
  p_description     text    DEFAULT NULL,
  p_metadata        jsonb   DEFAULT '{}'::jsonb,
  -- New optional fields (all backward-compatible with DEFAULT NULL / DEFAULT)
  p_brand_name      text    DEFAULT NULL,
  p_people          jsonb   DEFAULT NULL,   -- [{name, roles:["Actor",...], notes}]
  p_minifigures     jsonb   DEFAULT NULL,   -- [{name, quantity, identifier, theme}]
  p_variants        jsonb   DEFAULT NULL    -- [{name, sku, identifier, condition}]
                                            -- falls back to p_metadata->'variants' if NULL
)
RETURNS public.catalog_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_hash          text;
  v_api_key_row       public.catalog_api_keys;
  v_category_id       uuid;
  v_subcategory_id    uuid;
  v_franchise_id      uuid;
  v_brand_id          uuid;
  v_item              public.catalog_items;

  v_category_slug     text;
  v_subcategory_slug  text;
  v_franchise_slug    text;
  v_item_slug         text;
  v_brand_slug        text;
  v_person_slug       text;

  v_identifier        text;
  v_item_status       text;
  v_dynamic_fields    jsonb;
  v_metadata_clean    jsonb;

  v_variants_to_save  jsonb;
  v_variant           jsonb;
  v_variant_idx       integer;

  v_person_entry      jsonb;
  v_person_name       text;
  v_person_id         uuid;
  v_role_label        text;
  v_role_id           uuid;

  v_minifig_entry     jsonb;
  v_minifig_name      text;
  v_minifig_slug      text;
  v_minifig_id        uuid;
  v_minifig_qty       integer;
BEGIN
  -- ── Validate required inputs ────────────────────────────────────────────
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

  -- ── Authenticate API key ────────────────────────────────────────────────
  v_key_hash := encode(extensions.digest(trim(p_api_key), 'sha256'), 'hex');

  SELECT *
  INTO v_api_key_row
  FROM public.catalog_api_keys k
  WHERE k.key_hash = v_key_hash
    AND k.is_active = true
  LIMIT 1;

  IF v_api_key_row.id IS NULL THEN
    RAISE EXCEPTION 'Invalid API key';
  END IF;

  -- ── Parse metadata fields ───────────────────────────────────────────────
  v_identifier    := NULLIF(trim(COALESCE(p_metadata->>'identifier', '')), '');
  v_item_status   := lower(COALESCE(NULLIF(trim(COALESCE(p_metadata->>'status', '')), ''), 'draft'));

  -- ── Build slugs ─────────────────────────────────────────────────────────
  v_category_slug    := public.catalog_slugify(p_category_name);
  v_subcategory_slug := public.catalog_slugify(p_subcategory_name);
  v_franchise_slug   := public.catalog_slugify(p_franchise_name);
  v_item_slug        := public.catalog_slugify(
    CASE
      WHEN v_identifier IS NOT NULL THEN trim(p_item_name) || ' ' || v_identifier
      ELSE p_item_name
    END
  );

  IF v_category_slug = '' OR v_subcategory_slug = '' OR v_franchise_slug = '' OR v_item_slug = '' THEN
    RAISE EXCEPTION 'Category, subcategory, franchise, and item slugs must be non-empty';
  END IF;

  IF v_item_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid item status: %. Allowed values are draft, published.', v_item_status;
  END IF;

  v_dynamic_fields := CASE
    WHEN jsonb_typeof(COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)) = 'object'
      THEN COALESCE(p_metadata->'dynamic_fields', '{}'::jsonb)
    ELSE '{}'::jsonb
  END;

  v_metadata_clean := COALESCE(p_metadata, '{}'::jsonb)
    - 'identifier' - 'status' - 'dynamic_fields' - 'variants';

  -- ── Upsert category / subcategory / franchise ───────────────────────────
  INSERT INTO public.catalog_categories (name, slug, sort_order)
  VALUES (trim(p_category_name), v_category_slug, 0)
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, is_active = true, updated_at = now()
  RETURNING id INTO v_category_id;

  INSERT INTO public.catalog_subcategories (category_id, name, slug, sort_order)
  VALUES (v_category_id, trim(p_subcategory_name), v_subcategory_slug, 0)
  ON CONFLICT (category_id, slug) DO UPDATE
  SET name = EXCLUDED.name, is_active = true, updated_at = now()
  RETURNING id INTO v_subcategory_id;

  INSERT INTO public.catalog_franchises (category_id, subcategory_id, name, slug, sort_order, created_by)
  VALUES (v_category_id, v_subcategory_id, trim(p_franchise_name), v_franchise_slug, 0, v_api_key_row.created_by)
  ON CONFLICT (subcategory_id, slug) DO UPDATE
  SET name = EXCLUDED.name, is_active = true, updated_at = now()
  RETURNING id INTO v_franchise_id;

  -- ── Upsert brand (if provided) ──────────────────────────────────────────
  IF p_brand_name IS NOT NULL AND trim(p_brand_name) != '' THEN
    v_brand_slug := public.catalog_slugify(p_brand_name);
    IF v_brand_slug = '' THEN
      RAISE EXCEPTION 'Brand name produces an empty slug';
    END IF;

    INSERT INTO public.catalog_brands (name, slug, is_active, created_by)
    VALUES (trim(p_brand_name), v_brand_slug, true, v_api_key_row.created_by)
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name, is_active = true, updated_at = now()
    RETURNING id INTO v_brand_id;
  END IF;

  -- ── Upsert catalog item ─────────────────────────────────────────────────
  INSERT INTO public.catalog_items (
    category_id,
    subcategory_id,
    franchise_id,
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
    v_category_id,
    v_subcategory_id,
    v_franchise_id,
    v_brand_id,
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
    name           = EXCLUDED.name,
    description    = EXCLUDED.description,
    release_year   = EXCLUDED.release_year,
    brand_id       = COALESCE(EXCLUDED.brand_id, catalog_items.brand_id),
    identifier     = EXCLUDED.identifier,
    item_status    = EXCLUDED.item_status,
    dynamic_fields = EXCLUDED.dynamic_fields,
    metadata       = EXCLUDED.metadata,
    is_active      = true,
    updated_at     = now()
  RETURNING * INTO v_item;

  -- ── Save variants ───────────────────────────────────────────────────────
  -- Accept explicit p_variants OR fall back to metadata.variants array.
  v_variants_to_save := CASE
    WHEN p_variants IS NOT NULL AND jsonb_typeof(p_variants) = 'array' THEN p_variants
    WHEN jsonb_typeof(COALESCE(p_metadata->'variants', 'null'::jsonb)) = 'array' THEN p_metadata->'variants'
    ELSE NULL
  END;

  IF v_variants_to_save IS NOT NULL AND jsonb_array_length(v_variants_to_save) > 0 THEN
    DELETE FROM public.catalog_item_variants WHERE item_id = v_item.id;

    v_variant_idx := 0;
    FOR v_variant IN SELECT * FROM jsonb_array_elements(v_variants_to_save) LOOP
      DECLARE
        v_variant_name text;
        v_variant_slug text;
      BEGIN
        v_variant_name := NULLIF(trim(COALESCE(v_variant->>'name', '')), '');
        -- Build a unique slug: use name if present, otherwise fall back to positional index
        v_variant_slug := COALESCE(
          NULLIF(public.catalog_slugify(COALESCE(v_variant_name, '')), ''),
          'variant-' || v_variant_idx::text
        );

        INSERT INTO public.catalog_item_variants (
          item_id, name, slug, sku, identifier, condition, sort_order, created_by
        )
        VALUES (
          v_item.id,
          v_variant_name,
          v_variant_slug,
          NULLIF(trim(COALESCE(v_variant->>'sku', '')), ''),
          NULLIF(trim(COALESCE(v_variant->>'identifier', '')), ''),
          NULLIF(trim(COALESCE(v_variant->>'condition', '')), ''),
          v_variant_idx,
          v_api_key_row.created_by
        )
        ON CONFLICT (item_id, slug) DO UPDATE
        SET
          name       = EXCLUDED.name,
          sku        = EXCLUDED.sku,
          identifier = EXCLUDED.identifier,
          condition  = EXCLUDED.condition,
          sort_order = EXCLUDED.sort_order,
          updated_at = now();
      END;

      v_variant_idx := v_variant_idx + 1;
    END LOOP;
  END IF;

  -- ── Save people credits ─────────────────────────────────────────────────
  -- Format: [{"name": "Jane Doe", "roles": ["Director", "Writer"], "notes": "optional"}]
  IF p_people IS NOT NULL AND jsonb_typeof(p_people) = 'array' AND jsonb_array_length(p_people) > 0 THEN
    DELETE FROM public.catalog_item_people WHERE item_id = v_item.id;

    FOR v_person_entry IN SELECT * FROM jsonb_array_elements(p_people) LOOP
      v_person_name := NULLIF(trim(COALESCE(v_person_entry->>'name', '')), '');
      CONTINUE WHEN v_person_name IS NULL;

      v_person_slug := public.catalog_slugify(v_person_name);
      CONTINUE WHEN v_person_slug = '';

      INSERT INTO public.catalog_people (name, slug, is_active, created_by)
      VALUES (v_person_name, v_person_slug, true, v_api_key_row.created_by)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, is_active = true, updated_at = now()
      RETURNING id INTO v_person_id;

      IF v_person_entry->'roles' IS NOT NULL AND jsonb_typeof(v_person_entry->'roles') = 'array' THEN
        FOR v_role_label IN SELECT * FROM jsonb_array_elements_text(v_person_entry->'roles') LOOP
          SELECT id INTO v_role_id
          FROM public.catalog_person_roles
          WHERE lower(label) = lower(trim(v_role_label))
          LIMIT 1;

          CONTINUE WHEN v_role_id IS NULL;

          INSERT INTO public.catalog_item_people (
            item_id, person_id, role_id, credit_order, notes, created_by
          )
          VALUES (
            v_item.id,
            v_person_id,
            v_role_id,
            0,
            NULLIF(trim(COALESCE(v_person_entry->>'notes', '')), ''),
            v_api_key_row.created_by
          )
          ON CONFLICT (item_id, person_id, role_id) DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- ── Save minifigures ────────────────────────────────────────────────────
  -- Format: [{"name": "Luke Skywalker", "quantity": 1, "identifier": "sw0001", "theme": "Star Wars"}]
  IF p_minifigures IS NOT NULL AND jsonb_typeof(p_minifigures) = 'array' AND jsonb_array_length(p_minifigures) > 0 THEN
    DELETE FROM public.catalog_item_minifigures WHERE item_id = v_item.id;

    FOR v_minifig_entry IN SELECT * FROM jsonb_array_elements(p_minifigures) LOOP
      v_minifig_name := NULLIF(trim(COALESCE(v_minifig_entry->>'name', '')), '');
      CONTINUE WHEN v_minifig_name IS NULL;

      v_minifig_slug := public.catalog_slugify(v_minifig_name);
      CONTINUE WHEN v_minifig_slug = '';

      v_minifig_qty := GREATEST(1, COALESCE((v_minifig_entry->>'quantity')::integer, 1));

      INSERT INTO public.catalog_minifigures (name, slug, theme, identifier, is_active, created_by)
      VALUES (
        v_minifig_name,
        v_minifig_slug,
        NULLIF(trim(COALESCE(v_minifig_entry->>'theme', '')), ''),
        NULLIF(trim(COALESCE(v_minifig_entry->>'identifier', '')), ''),
        true,
        v_api_key_row.created_by
      )
      ON CONFLICT (slug) DO UPDATE
      SET
        name       = EXCLUDED.name,
        theme      = COALESCE(EXCLUDED.theme, catalog_minifigures.theme),
        identifier = COALESCE(EXCLUDED.identifier, catalog_minifigures.identifier),
        is_active  = true,
        updated_at = now()
      RETURNING id INTO v_minifig_id;

      INSERT INTO public.catalog_item_minifigures (
        item_id, minifigure_id, quantity, created_by
      )
      VALUES (v_item.id, v_minifig_id, v_minifig_qty, v_api_key_row.created_by)
      ON CONFLICT (item_id, minifigure_id) DO UPDATE
      SET quantity = EXCLUDED.quantity, updated_at = now();
    END LOOP;
  END IF;

  -- ── Update API key usage timestamp ──────────────────────────────────────
  UPDATE public.catalog_api_keys
  SET last_used_at = now()
  WHERE id = v_api_key_row.id;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb, text, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_catalog_item_via_api(text, text, text, text, text, integer, text, jsonb, text, jsonb, jsonb, jsonb) TO anon, authenticated;
