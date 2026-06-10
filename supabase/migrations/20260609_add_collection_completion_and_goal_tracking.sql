-- CollectorsHub: Set completion registry and tracked collection goals
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.collectible_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  subcategory_name text,
  franchise_name text,
  set_name text NOT NULL,
  total_items integer NOT NULL CHECK (total_items >= 1),
  total_estimated_value numeric(12,2),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collectible_sets_category_set_unique UNIQUE (category_name, set_name)
);

CREATE TABLE IF NOT EXISTS public.collectible_set_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collectible_set_id uuid NOT NULL REFERENCES public.collectible_sets(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  item_key text NOT NULL,
  item_name text,
  rarity text,
  estimated_market_price numeric(12,2),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collectible_set_entries_set_item_key_unique UNIQUE (collectible_set_id, item_key)
);

CREATE TABLE IF NOT EXISTS public.user_collection_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_type text NOT NULL DEFAULT 'set_completion' CHECK (goal_type IN ('set_completion', 'custom_collection')),
  title text NOT NULL,
  collectible_set_id uuid REFERENCES public.collectible_sets(id) ON DELETE SET NULL,
  target_collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  category_name text,
  set_name text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collectible_sets_category_name
  ON public.collectible_sets (category_name);

CREATE INDEX IF NOT EXISTS idx_collectible_sets_set_name
  ON public.collectible_sets (set_name);

CREATE INDEX IF NOT EXISTS idx_collectible_set_entries_collectible_set_id
  ON public.collectible_set_entries (collectible_set_id);

CREATE INDEX IF NOT EXISTS idx_collectible_set_entries_catalog_item_id
  ON public.collectible_set_entries (catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_goals_user_id
  ON public.user_collection_goals (user_id);

CREATE INDEX IF NOT EXISTS idx_user_collection_goals_collectible_set_id
  ON public.user_collection_goals (collectible_set_id);

DROP TRIGGER IF EXISTS set_collectible_sets_updated_at ON public.collectible_sets;
CREATE TRIGGER set_collectible_sets_updated_at
BEFORE UPDATE ON public.collectible_sets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_user_collection_goals_updated_at ON public.user_collection_goals;
CREATE TRIGGER set_user_collection_goals_updated_at
BEFORE UPDATE ON public.user_collection_goals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.collectible_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectible_set_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collectible_sets' AND policyname = 'collectible_sets_public_select'
  ) THEN
    CREATE POLICY collectible_sets_public_select
      ON public.collectible_sets
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'collectible_set_entries' AND policyname = 'collectible_set_entries_public_select'
  ) THEN
    CREATE POLICY collectible_set_entries_public_select
      ON public.collectible_set_entries
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.collectible_sets s
          WHERE s.id = collectible_set_entries.collectible_set_id
            AND s.is_active = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_collection_goals' AND policyname = 'user_collection_goals_owner_select'
  ) THEN
    CREATE POLICY user_collection_goals_owner_select
      ON public.user_collection_goals
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_collection_goals' AND policyname = 'user_collection_goals_owner_insert'
  ) THEN
    CREATE POLICY user_collection_goals_owner_insert
      ON public.user_collection_goals
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_collection_goals' AND policyname = 'user_collection_goals_owner_update'
  ) THEN
    CREATE POLICY user_collection_goals_owner_update
      ON public.user_collection_goals
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_collection_goals' AND policyname = 'user_collection_goals_owner_delete'
  ) THEN
    CREATE POLICY user_collection_goals_owner_delete
      ON public.user_collection_goals
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END;
$$;
