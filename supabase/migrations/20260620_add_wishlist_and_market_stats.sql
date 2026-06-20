-- CollectorsHub: wishlist table + cross-user market stats RPC.
-- Safe to run multiple times.

-- ── Wishlist ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  catalog_item_id  uuid        NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  notes            text,
  priority         integer     NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_items_user_item_unique UNIQUE (user_id, catalog_item_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id          ON public.wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_catalog_item_id  ON public.wishlist_items (catalog_item_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlist_items' AND policyname = 'wishlist_items_owner_select'
  ) THEN
    CREATE POLICY wishlist_items_owner_select ON public.wishlist_items
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlist_items' AND policyname = 'wishlist_items_owner_insert'
  ) THEN
    CREATE POLICY wishlist_items_owner_insert ON public.wishlist_items
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wishlist_items' AND policyname = 'wishlist_items_owner_delete'
  ) THEN
    CREATE POLICY wishlist_items_owner_delete ON public.wishlist_items
      FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;
END;
$$;

-- ── Market stats RPC ───────────────────────────────────────
-- SECURITY DEFINER so it reads across all users' data safely.
-- Only exposes aggregate counts — no user-identifying data.
CREATE OR REPLACE FUNCTION public.get_item_market_stats(item_ids uuid[])
RETURNS TABLE(catalog_item_id uuid, available_count bigint, wanted_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ids.id                                                                      AS catalog_item_id,
    COUNT(DISTINCT oc.id) FILTER (WHERE oc.sale_status IN ('listed', 'trade')) AS available_count,
    COUNT(DISTINCT wi.user_id)                                                  AS wanted_count
  FROM unnest(item_ids) AS ids(id)
  LEFT JOIN public.owned_copies   oc ON oc.catalog_item_id = ids.id
  LEFT JOIN public.wishlist_items wi ON wi.catalog_item_id = ids.id
  GROUP BY ids.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_item_market_stats(uuid[]) TO authenticated;
