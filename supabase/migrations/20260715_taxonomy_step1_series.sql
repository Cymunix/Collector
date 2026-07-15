-- Taxonomy Step 1 — Series (facet)
--
-- WHY: The finalized taxonomy introduces "Series" — an optional *branded
-- manufacturer/publisher grouping* used for filtering only (Ultimate Collector
-- Series, Battle Pack, Topps Chrome, Nintendo Selects, Greatest Hits). It is NOT
-- part of navigation and NOT part of the IP hierarchy. Nothing in the current
-- schema provides it — the closest thing ("Battle Pack" mis-filed in
-- collectible_sets) will be re-imported here.
--
-- NOTE: This is deliberately a NEW table. The existing `collections` table is the
-- users' *personal* collections (id, user_id, name) and must not be reused.
--
-- Scope: a Series belongs to the manufacturer/publisher, i.e. the Subcategory
-- (UCS -> LEGO, Topps Chrome -> Topps). subcategory_id is nullable so a series
-- can exist before its manufacturer is set, but it is the intended owner.
--
-- Additive + reversible (down migration at the bottom).

CREATE TABLE IF NOT EXISTS public.series (
  series_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid        REFERENCES public.subcategories (subcategory_id) ON DELETE CASCADE,
  name           text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subcategory_id, name)
);
CREATE INDEX IF NOT EXISTS idx_series_subcategory ON public.series (subcategory_id);

-- Item facet: optional link to a Series.
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.series (series_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_items_series ON public.items (series_id) WHERE series_id IS NOT NULL;

-- RLS (reads open to everyone; writes platform-admin only) — matches the
-- pattern used by subsets / product_lines in 20260711_faceted_classification.sql.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.series ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='series' AND policyname='series_read') THEN
    EXECUTE 'CREATE POLICY series_read ON public.series FOR SELECT TO anon, authenticated USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='series' AND policyname='series_write') THEN
    EXECUTE $f$CREATE POLICY series_write ON public.series FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$;
  END IF;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.items DROP COLUMN IF EXISTS series_id;
-- DROP TABLE IF EXISTS public.series;
