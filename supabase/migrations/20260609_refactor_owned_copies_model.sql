-- CollectorsHub: refactor ownership from quantity rows to per-copy ownership.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.owned_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  condition text,
  grading_company text,
  grade text,
  cert_number text,
  cert_number_normalized text NOT NULL DEFAULT '',
  purchase_price numeric(12,2),
  purchase_date date,
  estimated_value numeric(12,2),
  storage_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  sale_status text NOT NULL DEFAULT 'private' CHECK (sale_status IN ('private', 'listed', 'sold', 'archived', 'trade')),
  sale_price numeric(12,2),
  sale_date date,
  front_image_url text,
  back_image_url text,
  notes text,
  acquisition_type text NOT NULL DEFAULT 'direct' CHECK (acquisition_type IN ('direct', 'store', 'user', 'gift', 'box_set')),
  box_set_total_price numeric(12,2),
  box_set_item_count integer CHECK (box_set_item_count IS NULL OR box_set_item_count >= 1),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_inventory_item_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owned_copies_user_id
  ON public.owned_copies (user_id);

CREATE INDEX IF NOT EXISTS idx_owned_copies_catalog_item_id
  ON public.owned_copies (catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_owned_copies_collection_id
  ON public.owned_copies (collection_id);

CREATE INDEX IF NOT EXISTS idx_owned_copies_storage_location_id
  ON public.owned_copies (storage_location_id);

CREATE INDEX IF NOT EXISTS idx_owned_copies_sale_status
  ON public.owned_copies (sale_status);

CREATE INDEX IF NOT EXISTS idx_owned_copies_source_inventory_item_id
  ON public.owned_copies (source_inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_owned_copies_user_catalog_item_id
  ON public.owned_copies (user_id, catalog_item_id);

DROP TRIGGER IF EXISTS set_owned_copies_updated_at ON public.owned_copies;
CREATE TRIGGER set_owned_copies_updated_at
BEFORE UPDATE ON public.owned_copies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.sync_owned_copy_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection_user_id uuid;
  v_location_user_id uuid;
BEGIN
  NEW.cert_number_normalized := upper(regexp_replace(COALESCE(NEW.cert_number, ''), '[^A-Za-z0-9]', '', 'g'));

  IF NEW.collection_id IS NOT NULL THEN
    SELECT c.user_id INTO v_collection_user_id
    FROM public.collections c
    WHERE c.id = NEW.collection_id;

    IF v_collection_user_id IS NULL THEN
      RAISE EXCEPTION 'Collection % does not exist.', NEW.collection_id;
    END IF;

    IF NEW.user_id <> v_collection_user_id THEN
      RAISE EXCEPTION 'Collection % belongs to a different user.', NEW.collection_id;
    END IF;
  END IF;

  IF NEW.storage_location_id IS NOT NULL THEN
    SELECT l.user_id INTO v_location_user_id
    FROM public.storage_locations l
    WHERE l.id = NEW.storage_location_id;

    IF v_location_user_id IS NULL THEN
      RAISE EXCEPTION 'Storage location % does not exist.', NEW.storage_location_id;
    END IF;

    IF NEW.user_id <> v_location_user_id THEN
      RAISE EXCEPTION 'Storage location % belongs to a different user.', NEW.storage_location_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_owned_copy_fields_trigger ON public.owned_copies;
CREATE TRIGGER sync_owned_copy_fields_trigger
BEFORE INSERT OR UPDATE OF cert_number, collection_id, storage_location_id, user_id ON public.owned_copies
FOR EACH ROW
EXECUTE FUNCTION public.sync_owned_copy_fields();

ALTER TABLE public.owned_copies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'owned_copies' AND policyname = 'owned_copies_owner_select'
  ) THEN
    CREATE POLICY owned_copies_owner_select
      ON public.owned_copies
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'owned_copies' AND policyname = 'owned_copies_owner_insert'
  ) THEN
    CREATE POLICY owned_copies_owner_insert
      ON public.owned_copies
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'owned_copies' AND policyname = 'owned_copies_owner_update'
  ) THEN
    CREATE POLICY owned_copies_owner_update
      ON public.owned_copies
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'owned_copies' AND policyname = 'owned_copies_owner_delete'
  ) THEN
    CREATE POLICY owned_copies_owner_delete
      ON public.owned_copies
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;

DO $$
BEGIN
  -- Add copy-level references to existing assignment tables.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.collection_items
      ALTER COLUMN inventory_item_id DROP NOT NULL;

    ALTER TABLE public.collection_items
      DROP CONSTRAINT IF EXISTS collection_items_collection_inventory_unique;

    ALTER TABLE public.collection_items
      ADD COLUMN IF NOT EXISTS owned_copy_id uuid;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'collection_items_owned_copy_fk'
    ) THEN
      ALTER TABLE public.collection_items
        ADD CONSTRAINT collection_items_owned_copy_fk
        FOREIGN KEY (owned_copy_id)
        REFERENCES public.owned_copies(id)
        ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_collection_items_owned_copy_id
      ON public.collection_items (owned_copy_id);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'collection_items_collection_owned_copy_unique'
    ) THEN
      ALTER TABLE public.collection_items
        ADD CONSTRAINT collection_items_collection_owned_copy_unique UNIQUE (collection_id, owned_copy_id);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_item_locations' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.inventory_item_locations
      ALTER COLUMN inventory_item_id DROP NOT NULL;

    ALTER TABLE public.inventory_item_locations
      DROP CONSTRAINT IF EXISTS inventory_item_locations_unique;

    ALTER TABLE public.inventory_item_locations
      ADD COLUMN IF NOT EXISTS owned_copy_id uuid;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inventory_item_locations_owned_copy_fk'
    ) THEN
      ALTER TABLE public.inventory_item_locations
        ADD CONSTRAINT inventory_item_locations_owned_copy_fk
        FOREIGN KEY (owned_copy_id)
        REFERENCES public.owned_copies(id)
        ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_inventory_item_locations_owned_copy_id
      ON public.inventory_item_locations (owned_copy_id);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inventory_item_locations_owned_copy_location_unique'
    ) THEN
      ALTER TABLE public.inventory_item_locations
        ADD CONSTRAINT inventory_item_locations_owned_copy_location_unique UNIQUE (owned_copy_id, storage_location_id);
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  -- Migrate quantity-based rows into per-copy ownership only when owned_copies is empty for that source row.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_collection_items' AND table_type = 'BASE TABLE'
  ) THEN
    CREATE TEMP TABLE tmp_owned_copy_map (
      source_inventory_item_id uuid NOT NULL,
      owned_copy_id uuid NOT NULL
    ) ON COMMIT DROP;

    INSERT INTO public.owned_copies (
      user_id,
      catalog_item_id,
      grading_company,
      grade,
      cert_number,
      purchase_price,
      purchase_date,
      acquisition_type,
      box_set_total_price,
      box_set_item_count,
      sale_status,
      sale_price,
      sale_date,
      metadata,
      source_inventory_item_id,
      created_at,
      updated_at
    )
    SELECT
      i.user_id,
      i.catalog_item_id,
      i.grading_company,
      i.grade,
      i.cert_number,
      i.purchase_price,
      i.purchase_date,
      i.acquisition_type,
      i.box_set_total_price,
      i.box_set_item_count,
      COALESCE(i.visibility, 'private'),
      i.sale_price,
      i.sale_date,
      COALESCE(i.metadata, '{}'::jsonb),
      i.id,
      i.created_at,
      i.updated_at
    FROM public.user_collection_items i
    CROSS JOIN LATERAL generate_series(1, GREATEST(COALESCE(i.quantity, 1), 1)) AS copy_index
    WHERE NOT EXISTS (
      SELECT 1 FROM public.owned_copies oc WHERE oc.source_inventory_item_id = i.id
    );

    INSERT INTO tmp_owned_copy_map (source_inventory_item_id, owned_copy_id)
    SELECT source_inventory_item_id, id
    FROM public.owned_copies
    WHERE source_inventory_item_id IS NOT NULL;

    -- Fan out collection assignments to every migrated copy from a source inventory row.
    INSERT INTO public.collection_items (collection_id, inventory_item_id, owned_copy_id, created_at)
    SELECT
      ci.collection_id,
      ci.inventory_item_id,
      m.owned_copy_id,
      ci.created_at
    FROM public.collection_items ci
    JOIN tmp_owned_copy_map m
      ON m.source_inventory_item_id = ci.inventory_item_id
    WHERE ci.owned_copy_id IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.collection_items existing_ci
        WHERE existing_ci.collection_id = ci.collection_id
          AND existing_ci.owned_copy_id = m.owned_copy_id
      );

    -- Fan out storage assignments to every migrated copy from a source inventory row.
    INSERT INTO public.inventory_item_locations (inventory_item_id, owned_copy_id, storage_location_id, created_at)
    SELECT
      il.inventory_item_id,
      m.owned_copy_id,
      il.storage_location_id,
      il.created_at
    FROM public.inventory_item_locations il
    JOIN tmp_owned_copy_map m
      ON m.source_inventory_item_id = il.inventory_item_id
    WHERE il.owned_copy_id IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.inventory_item_locations existing_il
        WHERE existing_il.owned_copy_id = m.owned_copy_id
          AND existing_il.storage_location_id = il.storage_location_id
      );

    -- Backfill legacy rows to a deterministic owned_copy_id as well.
    UPDATE public.collection_items ci
    SET owned_copy_id = mapped.owned_copy_id
    FROM (
      SELECT DISTINCT ON (source_inventory_item_id)
        source_inventory_item_id,
        owned_copy_id
      FROM tmp_owned_copy_map
      ORDER BY source_inventory_item_id, owned_copy_id::text
    ) mapped
    WHERE ci.inventory_item_id = mapped.source_inventory_item_id
      AND ci.owned_copy_id IS NULL;

    UPDATE public.inventory_item_locations il
    SET owned_copy_id = mapped.owned_copy_id
    FROM (
      SELECT DISTINCT ON (source_inventory_item_id)
        source_inventory_item_id,
        owned_copy_id
      FROM tmp_owned_copy_map
      ORDER BY source_inventory_item_id, owned_copy_id::text
    ) mapped
    WHERE il.inventory_item_id = mapped.source_inventory_item_id
      AND il.owned_copy_id IS NULL;

    -- Fill direct links on owned_copies where possible from assignment tables.
    UPDATE public.owned_copies oc
    SET collection_id = ci.collection_id
    FROM public.collection_items ci
    WHERE ci.owned_copy_id = oc.id
      AND oc.collection_id IS NULL;

    UPDATE public.owned_copies oc
    SET storage_location_id = il.storage_location_id
    FROM public.inventory_item_locations il
    WHERE il.owned_copy_id = oc.id
      AND oc.storage_location_id IS NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_owned_copies_for_legacy_inventory_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.owned_copies
  WHERE source_inventory_item_id = OLD.id;

  RETURN OLD;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_collection_items' AND table_type = 'BASE TABLE'
  ) THEN
    -- Remove migrated copies whose legacy inventory row was already deleted.
    DELETE FROM public.owned_copies oc
    WHERE oc.source_inventory_item_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_collection_items i
        WHERE i.id = oc.source_inventory_item_id
      );

    DROP TRIGGER IF EXISTS delete_owned_copies_for_legacy_inventory_item_trigger
      ON public.user_collection_items;

    CREATE TRIGGER delete_owned_copies_for_legacy_inventory_item_trigger
    AFTER DELETE ON public.user_collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_owned_copies_for_legacy_inventory_item();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_collection_item_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection_user_id uuid;
  v_copy_user_id uuid;
  v_inventory_user_id uuid;
BEGIN
  SELECT c.user_id INTO v_collection_user_id
  FROM public.collections c
  WHERE c.id = NEW.collection_id;

  IF v_collection_user_id IS NULL THEN
    RAISE EXCEPTION 'Collection % does not exist.', NEW.collection_id;
  END IF;

  IF NEW.owned_copy_id IS NOT NULL THEN
    SELECT oc.user_id INTO v_copy_user_id
    FROM public.owned_copies oc
    WHERE oc.id = NEW.owned_copy_id;

    IF v_copy_user_id IS NULL THEN
      RAISE EXCEPTION 'Owned copy % does not exist.', NEW.owned_copy_id;
    END IF;

    IF v_collection_user_id <> v_copy_user_id THEN
      RAISE EXCEPTION 'Collection % and owned copy % belong to different users.', NEW.collection_id, NEW.owned_copy_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Backward-compatibility path.
  SELECT i.user_id INTO v_inventory_user_id
  FROM public.user_collection_items i
  WHERE i.id = NEW.inventory_item_id;

  IF v_inventory_user_id IS NULL THEN
    RAISE EXCEPTION 'Inventory item % does not exist.', NEW.inventory_item_id;
  END IF;

  IF v_collection_user_id <> v_inventory_user_id THEN
    RAISE EXCEPTION 'Collection % and inventory item % belong to different users.', NEW.collection_id, NEW.inventory_item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_item_location_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location_user_id uuid;
  v_copy_user_id uuid;
  v_inventory_user_id uuid;
BEGIN
  SELECT l.user_id INTO v_location_user_id
  FROM public.storage_locations l
  WHERE l.id = NEW.storage_location_id;

  IF v_location_user_id IS NULL THEN
    RAISE EXCEPTION 'Storage location % does not exist.', NEW.storage_location_id;
  END IF;

  IF NEW.owned_copy_id IS NOT NULL THEN
    SELECT oc.user_id INTO v_copy_user_id
    FROM public.owned_copies oc
    WHERE oc.id = NEW.owned_copy_id;

    IF v_copy_user_id IS NULL THEN
      RAISE EXCEPTION 'Owned copy % does not exist.', NEW.owned_copy_id;
    END IF;

    IF v_location_user_id <> v_copy_user_id THEN
      RAISE EXCEPTION 'Storage location % and owned copy % belong to different users.', NEW.storage_location_id, NEW.owned_copy_id;
    END IF;

    RETURN NEW;
  END IF;

  -- Backward-compatibility path.
  SELECT i.user_id INTO v_inventory_user_id
  FROM public.user_collection_items i
  WHERE i.id = NEW.inventory_item_id;

  IF v_inventory_user_id IS NULL THEN
    RAISE EXCEPTION 'Inventory item % does not exist.', NEW.inventory_item_id;
  END IF;

  IF v_location_user_id <> v_inventory_user_id THEN
    RAISE EXCEPTION 'Storage location % and inventory item % belong to different users.', NEW.storage_location_id, NEW.inventory_item_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'collection_items' AND table_type = 'BASE TABLE'
  ) THEN
    DROP TRIGGER IF EXISTS sync_collection_item_owner_trigger ON public.collection_items;
    CREATE TRIGGER sync_collection_item_owner_trigger
    BEFORE INSERT OR UPDATE OF collection_id, inventory_item_id, owned_copy_id ON public.collection_items
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_collection_item_owner();

    DROP POLICY IF EXISTS collection_items_owner_select ON public.collection_items;
    CREATE POLICY collection_items_owner_select
      ON public.collection_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.collections c
          WHERE c.id = collection_items.collection_id
            AND c.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS collection_items_owner_insert ON public.collection_items;
    CREATE POLICY collection_items_owner_insert
      ON public.collection_items
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.collections c
          WHERE c.id = collection_items.collection_id
            AND c.user_id = auth.uid()
        )
        AND (
          collection_items.owned_copy_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.owned_copies oc
            WHERE oc.id = collection_items.owned_copy_id
              AND oc.user_id = auth.uid()
          )
        )
        AND (
          collection_items.inventory_item_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.user_collection_items i
            WHERE i.id = collection_items.inventory_item_id
              AND i.user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS collection_items_owner_update ON public.collection_items;
    CREATE POLICY collection_items_owner_update
      ON public.collection_items
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.collections c
          WHERE c.id = collection_items.collection_id
            AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.collections c
          WHERE c.id = collection_items.collection_id
            AND c.user_id = auth.uid()
        )
        AND (
          collection_items.owned_copy_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.owned_copies oc
            WHERE oc.id = collection_items.owned_copy_id
              AND oc.user_id = auth.uid()
          )
        )
        AND (
          collection_items.inventory_item_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.user_collection_items i
            WHERE i.id = collection_items.inventory_item_id
              AND i.user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS collection_items_owner_delete ON public.collection_items;
    CREATE POLICY collection_items_owner_delete
      ON public.collection_items
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.collections c
          WHERE c.id = collection_items.collection_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_item_locations' AND table_type = 'BASE TABLE'
  ) THEN
    DROP TRIGGER IF EXISTS sync_inventory_item_location_owner_trigger ON public.inventory_item_locations;
    CREATE TRIGGER sync_inventory_item_location_owner_trigger
    BEFORE INSERT OR UPDATE OF storage_location_id, inventory_item_id, owned_copy_id ON public.inventory_item_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_inventory_item_location_owner();

    DROP POLICY IF EXISTS inventory_item_locations_owner_select ON public.inventory_item_locations;
    CREATE POLICY inventory_item_locations_owner_select
      ON public.inventory_item_locations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storage_locations l
          WHERE l.id = inventory_item_locations.storage_location_id
            AND l.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS inventory_item_locations_owner_insert ON public.inventory_item_locations;
    CREATE POLICY inventory_item_locations_owner_insert
      ON public.inventory_item_locations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.storage_locations l
          WHERE l.id = inventory_item_locations.storage_location_id
            AND l.user_id = auth.uid()
        )
        AND (
          inventory_item_locations.owned_copy_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.owned_copies oc
            WHERE oc.id = inventory_item_locations.owned_copy_id
              AND oc.user_id = auth.uid()
          )
        )
        AND (
          inventory_item_locations.inventory_item_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.user_collection_items i
            WHERE i.id = inventory_item_locations.inventory_item_id
              AND i.user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS inventory_item_locations_owner_update ON public.inventory_item_locations;
    CREATE POLICY inventory_item_locations_owner_update
      ON public.inventory_item_locations
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storage_locations l
          WHERE l.id = inventory_item_locations.storage_location_id
            AND l.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.storage_locations l
          WHERE l.id = inventory_item_locations.storage_location_id
            AND l.user_id = auth.uid()
        )
        AND (
          inventory_item_locations.owned_copy_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.owned_copies oc
            WHERE oc.id = inventory_item_locations.owned_copy_id
              AND oc.user_id = auth.uid()
          )
        )
        AND (
          inventory_item_locations.inventory_item_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.user_collection_items i
            WHERE i.id = inventory_item_locations.inventory_item_id
              AND i.user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS inventory_item_locations_owner_delete ON public.inventory_item_locations;
    CREATE POLICY inventory_item_locations_owner_delete
      ON public.inventory_item_locations
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.storage_locations l
          WHERE l.id = inventory_item_locations.storage_location_id
            AND l.user_id = auth.uid()
        )
      );
  END IF;
END;
$$;
