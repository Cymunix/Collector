-- CollectorsHub: Custom collections and physical storage locations
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collections_user_name_unique UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.user_collection_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collection_items_collection_inventory_unique UNIQUE (collection_id, inventory_item_id)
);

CREATE TABLE IF NOT EXISTS public.storage_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_location_id uuid REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT storage_locations_user_parent_name_unique UNIQUE (user_id, parent_location_id, name)
);

CREATE TABLE IF NOT EXISTS public.inventory_item_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES public.user_collection_items(id) ON DELETE CASCADE,
  storage_location_id uuid NOT NULL REFERENCES public.storage_locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_item_locations_unique UNIQUE (inventory_item_id, storage_location_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id
  ON public.collections (user_id);

CREATE INDEX IF NOT EXISTS idx_collections_is_public
  ON public.collections (is_public);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id
  ON public.collection_items (collection_id);

CREATE INDEX IF NOT EXISTS idx_collection_items_inventory_item_id
  ON public.collection_items (inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_storage_locations_user_id
  ON public.storage_locations (user_id);

CREATE INDEX IF NOT EXISTS idx_storage_locations_parent_location_id
  ON public.storage_locations (parent_location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_item_locations_inventory_item_id
  ON public.inventory_item_locations (inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_item_locations_storage_location_id
  ON public.inventory_item_locations (storage_location_id);

DROP TRIGGER IF EXISTS set_collections_updated_at ON public.collections;
CREATE TRIGGER set_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_storage_locations_updated_at ON public.storage_locations;
CREATE TRIGGER set_storage_locations_updated_at
BEFORE UPDATE ON public.storage_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.sync_collection_item_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_collection_user_id uuid;
  v_inventory_user_id uuid;
BEGIN
  SELECT c.user_id INTO v_collection_user_id
  FROM public.collections c
  WHERE c.id = NEW.collection_id;

  IF v_collection_user_id IS NULL THEN
    RAISE EXCEPTION 'Collection % does not exist.', NEW.collection_id;
  END IF;

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
  v_inventory_user_id uuid;
BEGIN
  SELECT l.user_id INTO v_location_user_id
  FROM public.storage_locations l
  WHERE l.id = NEW.storage_location_id;

  IF v_location_user_id IS NULL THEN
    RAISE EXCEPTION 'Storage location % does not exist.', NEW.storage_location_id;
  END IF;

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

DROP TRIGGER IF EXISTS sync_collection_item_owner_trigger ON public.collection_items;
CREATE TRIGGER sync_collection_item_owner_trigger
BEFORE INSERT OR UPDATE OF collection_id, inventory_item_id ON public.collection_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_collection_item_owner();

DROP TRIGGER IF EXISTS sync_inventory_item_location_owner_trigger ON public.inventory_item_locations;
CREATE TRIGGER sync_inventory_item_location_owner_trigger
BEFORE INSERT OR UPDATE OF inventory_item_id, storage_location_id ON public.inventory_item_locations
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_item_location_owner();

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collections' AND policyname = 'collections_owner_select'
  ) THEN
    CREATE POLICY collections_owner_select
      ON public.collections
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collections' AND policyname = 'collections_owner_insert'
  ) THEN
    CREATE POLICY collections_owner_insert
      ON public.collections
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collections' AND policyname = 'collections_owner_update'
  ) THEN
    CREATE POLICY collections_owner_update
      ON public.collections
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collections' AND policyname = 'collections_owner_delete'
  ) THEN
    CREATE POLICY collections_owner_delete
      ON public.collections
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collection_items' AND policyname = 'collection_items_owner_select'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collection_items' AND policyname = 'collection_items_owner_insert'
  ) THEN
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
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collection_items' AND policyname = 'collection_items_owner_update'
  ) THEN
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
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collection_items' AND policyname = 'collection_items_owner_delete'
  ) THEN
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'storage_locations' AND policyname = 'storage_locations_owner_select'
  ) THEN
    CREATE POLICY storage_locations_owner_select
      ON public.storage_locations
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'storage_locations' AND policyname = 'storage_locations_owner_insert'
  ) THEN
    CREATE POLICY storage_locations_owner_insert
      ON public.storage_locations
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'storage_locations' AND policyname = 'storage_locations_owner_update'
  ) THEN
    CREATE POLICY storage_locations_owner_update
      ON public.storage_locations
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'storage_locations' AND policyname = 'storage_locations_owner_delete'
  ) THEN
    CREATE POLICY storage_locations_owner_delete
      ON public.storage_locations
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_item_locations' AND policyname = 'inventory_item_locations_owner_select'
  ) THEN
    CREATE POLICY inventory_item_locations_owner_select
      ON public.inventory_item_locations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_collection_items i
          WHERE i.id = inventory_item_locations.inventory_item_id
            AND i.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_item_locations' AND policyname = 'inventory_item_locations_owner_insert'
  ) THEN
    CREATE POLICY inventory_item_locations_owner_insert
      ON public.inventory_item_locations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.user_collection_items i
          WHERE i.id = inventory_item_locations.inventory_item_id
            AND i.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_item_locations' AND policyname = 'inventory_item_locations_owner_update'
  ) THEN
    CREATE POLICY inventory_item_locations_owner_update
      ON public.inventory_item_locations
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_collection_items i
          WHERE i.id = inventory_item_locations.inventory_item_id
            AND i.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.user_collection_items i
          WHERE i.id = inventory_item_locations.inventory_item_id
            AND i.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory_item_locations' AND policyname = 'inventory_item_locations_owner_delete'
  ) THEN
    CREATE POLICY inventory_item_locations_owner_delete
      ON public.inventory_item_locations
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_collection_items i
          WHERE i.id = inventory_item_locations.inventory_item_id
            AND i.user_id = auth.uid()
        )
      );
  END IF;
END;
$$;
