-- CollectorsHub: faceted classification rework.
-- New cascading chain:  Category → Subcategory → Franchise → Subset → Product Line
-- Independent pair:      Brand → Collectible Set (repurposed to PACKAGING type)
--
--   Subset       — broad era/grouping within a Franchise (e.g. "Fall of the Jedi").
--                  For flat themes it mirrors the Franchise name.
--   Product Line — specific subtheme within a Subset (e.g. "The Clone Wars",
--                  "Main Line", "Promotional"). MANY-TO-MANY: one item can belong
--                  to several product lines (a minifig in a Main Line AND a Promo set).
--   Collectible Set — repurposed to mean PACKAGING (Box / Polybag / Blister pack).
--                  Stays independent of the Franchise chain.
--
-- Safe to re-run (idempotent). Preserves existing RLS patterns.

-- ── 1. subsets (depends on franchise) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subsets (
  subset_id    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid        NOT NULL REFERENCES public.franchises (franchise_id) ON DELETE CASCADE,
  name         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (franchise_id, name)
);
CREATE INDEX IF NOT EXISTS idx_subsets_franchise ON public.subsets (franchise_id);

-- ── 2. product_lines (depends on subset) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_lines (
  product_line_id uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subset_id       uuid        NOT NULL REFERENCES public.subsets (subset_id) ON DELETE CASCADE,
  name            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subset_id, name)
);
CREATE INDEX IF NOT EXISTS idx_product_lines_subset ON public.product_lines (subset_id);

-- ── 3. item_product_lines (many-to-many) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.item_product_lines (
  item_id         uuid NOT NULL REFERENCES public.items (item_id) ON DELETE CASCADE,
  product_line_id uuid NOT NULL REFERENCES public.product_lines (product_line_id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, product_line_id)
);
CREATE INDEX IF NOT EXISTS idx_item_product_lines_pl ON public.item_product_lines (product_line_id);

-- ── 4. items.subset_id (single-select Subset) ────────────────────────────────
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS subset_id uuid REFERENCES public.subsets (subset_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_items_subset ON public.items (subset_id) WHERE subset_id IS NOT NULL;

-- ── 5. Collectible Set repurposed to PACKAGING ───────────────────────────────
-- collectible_sets.name now holds packaging labels and items.collectible_set_id
-- points at a packaging row. Packaging is global (no brand/franchise), so make
-- brand_id nullable. The packaging VALUES (Box/Polybag/Blister pack) are seeded
-- separately (scripts/seed-packaging.mjs) to keep this migration pure DDL.
ALTER TABLE public.collectible_sets ALTER COLUMN brand_id DROP NOT NULL;

-- ── 6. RLS (reads open; writes platform-admin only) ──────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subsets','product_lines','item_product_lines'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_read') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t||'_read', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_write') THEN
      EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$, t||'_write', t);
    END IF;
  END LOOP;
END $$;

-- ── Down migration ───────────────────────────────────────────────────────────
-- ALTER TABLE public.items DROP COLUMN IF EXISTS subset_id;
-- DROP TABLE IF EXISTS public.item_product_lines;
-- DROP TABLE IF EXISTS public.product_lines;
-- DROP TABLE IF EXISTS public.subsets;
