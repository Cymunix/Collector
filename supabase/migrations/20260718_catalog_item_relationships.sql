-- Universal item-to-item relationships (bidirectional, single-row).
--
-- WHY: relationships were category-specific and split across two tables —
-- set_minifigs (set→minifig) and set_contents (parent→child). The catalogue needs
-- ONE universal directional containment relationship that works for every category
-- (LEGO sets↔minifigs, value packs↔sets, multipacks↔figures, advent calendars↔
-- pocket pops, box sets↔items). "Included In" is DERIVED by querying where an item
-- is the child — it is never stored as a second row.
--
-- Directional: parent_item_id INCLUDES child_item_id. relationship_type is future-
-- proof ('includes' now; 'variant_of' / 'reissue_of' / etc. later) but the UI only
-- uses 'includes'. quantity is carried over from set_minifigs (e.g. "×2 in set").
--
-- The legacy set_minifigs / set_contents tables are KEPT (LEGO completion + import
-- matching still read set_minifigs); this table is backfilled from both and becomes
-- the source of truth for the Related Items UI and admin management.

CREATE TABLE IF NOT EXISTS public.catalog_item_relationships (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_item_id    uuid        NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  child_item_id     uuid        NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  relationship_type text        NOT NULL DEFAULT 'includes',
  quantity          integer     NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT cir_unique          UNIQUE (parent_item_id, child_item_id, relationship_type),
  CONSTRAINT cir_no_self         CHECK (parent_item_id <> child_item_id),
  CONSTRAINT cir_quantity_pos    CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_cir_parent ON public.catalog_item_relationships (parent_item_id);
CREATE INDEX IF NOT EXISTS idx_cir_child  ON public.catalog_item_relationships (child_item_id);
CREATE INDEX IF NOT EXISTS idx_cir_type   ON public.catalog_item_relationships (relationship_type);

-- ── Backfill from the two legacy relationship tables (idempotent) ─────────────
INSERT INTO public.catalog_item_relationships (parent_item_id, child_item_id, relationship_type, quantity)
SELECT set_item_id, minifig_item_id, 'includes', COALESCE(quantity, 1)
  FROM public.set_minifigs
ON CONFLICT (parent_item_id, child_item_id, relationship_type) DO NOTHING;

INSERT INTO public.catalog_item_relationships (parent_item_id, child_item_id, relationship_type, quantity)
SELECT parent_item_id, child_item_id, 'includes', COALESCE(quantity, 1)
  FROM public.set_contents
ON CONFLICT (parent_item_id, child_item_id, relationship_type) DO NOTHING;

-- ── RLS: reads open (relationships are shown in the catalogue); writes admin-only.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.catalog_item_relationships ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='catalog_item_relationships' AND policyname='cir_read') THEN
    EXECUTE 'CREATE POLICY cir_read ON public.catalog_item_relationships FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='catalog_item_relationships' AND policyname='cir_write') THEN
    EXECUTE $f$CREATE POLICY cir_write ON public.catalog_item_relationships FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$;
  END IF;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.catalog_item_relationships;
