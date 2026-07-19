-- Set-to-set (and pack-to-item) containment: "value packs" and bundles.
--
-- WHY: some catalogue items CONTAIN other catalogue items that are not minifigs —
-- a value/super pack contains several sets (66365 → 8057, 8058, 8059, 8080), a
-- magnet set contains individual magnets. The existing set_minifigs join only
-- models set→minifig and its minifig side is treated as a minifig everywhere, so
-- it can't represent these. This is the generic parent→child containment table.
--
-- Deliberately separate from set_minifigs (which stays the set↔minifig relation).
-- Ownership does NOT cascade by default — owning a parent does not mark children
-- owned; the app decides how (if at all) to use this for completion. The link is
-- stored regardless, so cascade can be layered on later without a data change.

CREATE TABLE IF NOT EXISTS public.set_contents (
  parent_item_id uuid    NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  child_item_id  uuid    NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  quantity       integer NOT NULL DEFAULT 1,
  CONSTRAINT set_contents_pkey              PRIMARY KEY (parent_item_id, child_item_id),
  CONSTRAINT set_contents_no_self_reference CHECK (parent_item_id <> child_item_id),
  CONSTRAINT set_contents_quantity_positive CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_set_contents_parent ON public.set_contents (parent_item_id);
CREATE INDEX IF NOT EXISTS idx_set_contents_child  ON public.set_contents (child_item_id);

-- RLS: reads open (children/packs are shown in the catalogue); writes admin-only.
-- Same pattern as set_minifigs / series / subsets.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.set_contents ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='set_contents' AND policyname='set_contents_read') THEN
    EXECUTE 'CREATE POLICY set_contents_read ON public.set_contents FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='set_contents' AND policyname='set_contents_write') THEN
    EXECUTE $f$CREATE POLICY set_contents_write ON public.set_contents FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$;
  END IF;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.set_contents;
