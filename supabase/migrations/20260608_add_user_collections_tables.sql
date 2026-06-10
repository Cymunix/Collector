-- CollectorsHub: user-scoped collections with cert-aware items and sales history.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Collection',
  description text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_collections_user_name_unique UNIQUE (user_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_collections_one_default_per_user
  ON public.user_collections (user_id)
  WHERE is_default = true;

CREATE TABLE IF NOT EXISTS public.user_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.user_collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  grading_company text,
  grade text,
  cert_number text,
  cert_number_normalized text NOT NULL DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'listed', 'sold', 'archived')),
  acquisition_type text NOT NULL DEFAULT 'direct' CHECK (acquisition_type IN ('direct', 'store', 'user', 'gift', 'box_set')),
  purchased_from_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  purchased_from_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  purchase_price numeric(12,2),
  box_set_total_price numeric(12,2),
  box_set_item_count integer CHECK (box_set_item_count IS NULL OR box_set_item_count >= 1),
  purchase_date date,
  sale_price numeric(12,2),
  sale_date date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_collection_items_user_item_cert_unique
  ON public.user_collection_items (user_id, catalog_item_id, cert_number_normalized)
  WHERE cert_number_normalized <> '';

CREATE INDEX IF NOT EXISTS idx_user_collection_items_user_id
  ON public.user_collection_items (user_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_items_collection_id
  ON public.user_collection_items (collection_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_items_catalog_item_id
  ON public.user_collection_items (catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_items_visibility
  ON public.user_collection_items (visibility);

CREATE INDEX IF NOT EXISTS idx_user_collection_items_cert_number_normalized
  ON public.user_collection_items (cert_number_normalized)
  WHERE cert_number_normalized <> '';

CREATE TABLE IF NOT EXISTS public.user_collection_item_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collection_item_id uuid NOT NULL REFERENCES public.user_collection_items(id) ON DELETE CASCADE,
  sale_channel text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  sale_price numeric(12,2),
  buyer_notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_collection_item_sales_user_id
  ON public.user_collection_item_sales (user_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_item_sales_collection_item_id
  ON public.user_collection_item_sales (collection_item_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_item_sales_sold_at
  ON public.user_collection_item_sales (sold_at DESC);

CREATE OR REPLACE FUNCTION public.sync_user_collection_item_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT c.user_id
  INTO v_user_id
  FROM public.user_collections c
  WHERE c.id = NEW.collection_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Collection % does not exist.', NEW.collection_id;
  END IF;

  NEW.user_id := v_user_id;
  NEW.cert_number_normalized := upper(regexp_replace(COALESCE(NEW.cert_number, ''), '[^A-Za-z0-9]', '', 'g'));

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_collection_sale_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT i.user_id
  INTO v_user_id
  FROM public.user_collection_items i
  WHERE i.id = NEW.collection_item_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Collection item % does not exist.', NEW.collection_item_id;
  END IF;

  NEW.user_id := v_user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_collections_updated_at ON public.user_collections;
CREATE TRIGGER set_user_collections_updated_at
BEFORE UPDATE ON public.user_collections
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_user_collection_items_updated_at ON public.user_collection_items;
CREATE TRIGGER set_user_collection_items_updated_at
BEFORE UPDATE ON public.user_collection_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS sync_user_collection_item_owner_trigger ON public.user_collection_items;
CREATE TRIGGER sync_user_collection_item_owner_trigger
BEFORE INSERT OR UPDATE OF collection_id, cert_number ON public.user_collection_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_collection_item_owner();

DROP TRIGGER IF EXISTS sync_user_collection_sale_owner_trigger ON public.user_collection_item_sales;
CREATE TRIGGER sync_user_collection_sale_owner_trigger
BEFORE INSERT OR UPDATE OF collection_item_id ON public.user_collection_item_sales
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_collection_sale_owner();

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_item_sales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collections'
      AND policyname = 'user_collections_owner_select'
  ) THEN
    CREATE POLICY user_collections_owner_select
      ON public.user_collections
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collections'
      AND policyname = 'user_collections_owner_insert'
  ) THEN
    CREATE POLICY user_collections_owner_insert
      ON public.user_collections
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collections'
      AND policyname = 'user_collections_owner_update'
  ) THEN
    CREATE POLICY user_collections_owner_update
      ON public.user_collections
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collections'
      AND policyname = 'user_collections_owner_delete'
  ) THEN
    CREATE POLICY user_collections_owner_delete
      ON public.user_collections
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_items'
      AND policyname = 'user_collection_items_owner_select'
  ) THEN
    CREATE POLICY user_collection_items_owner_select
      ON public.user_collection_items
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_items'
      AND policyname = 'user_collection_items_owner_insert'
  ) THEN
    CREATE POLICY user_collection_items_owner_insert
      ON public.user_collection_items
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_items'
      AND policyname = 'user_collection_items_owner_update'
  ) THEN
    CREATE POLICY user_collection_items_owner_update
      ON public.user_collection_items
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_items'
      AND policyname = 'user_collection_items_owner_delete'
  ) THEN
    CREATE POLICY user_collection_items_owner_delete
      ON public.user_collection_items
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_item_sales'
      AND policyname = 'user_collection_item_sales_owner_select'
  ) THEN
    CREATE POLICY user_collection_item_sales_owner_select
      ON public.user_collection_item_sales
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_item_sales'
      AND policyname = 'user_collection_item_sales_owner_insert'
  ) THEN
    CREATE POLICY user_collection_item_sales_owner_insert
      ON public.user_collection_item_sales
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_item_sales'
      AND policyname = 'user_collection_item_sales_owner_update'
  ) THEN
    CREATE POLICY user_collection_item_sales_owner_update
      ON public.user_collection_item_sales
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_collection_item_sales'
      AND policyname = 'user_collection_item_sales_owner_delete'
  ) THEN
    CREATE POLICY user_collection_item_sales_owner_delete
      ON public.user_collection_item_sales
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;
