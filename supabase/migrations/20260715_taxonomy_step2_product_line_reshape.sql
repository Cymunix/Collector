-- Taxonomy Step 2 — Product Line can attach directly to a Franchise
--
-- WHY: The finalized taxonomy makes BOTH Subfranchise and Product Line optional,
-- and a franchise with no natural middle level must be able to hold a Product
-- Line directly (e.g. Pokémon -> [no subfranchise] -> Journey Together). Today
-- product_lines hangs only off a subset (subfranchise) via a NOT NULL FK, so a
-- Product Line without a Subfranchise is impossible. This fixes that without
-- inventing "mirror" subfranchise rows.
--
-- Change: add product_lines.franchise_id (the always-present anchor) and relax
-- product_lines.subset_id (the Subfranchise) to NULL.
--
-- Additive: one new column + one relaxed constraint. product_lines currently has
-- 0 rows, so the backfill is a no-op today but is correct if data exists. The
-- existing UNIQUE(subset_id, name) is left in place; the import/mapping layer is
-- responsible for de-duplication (franchise_id, subset_id, name).

ALTER TABLE public.product_lines
  ADD COLUMN IF NOT EXISTS franchise_id uuid REFERENCES public.franchises (franchise_id) ON DELETE CASCADE;

-- Backfill franchise_id from the current Subfranchise link where possible.
UPDATE public.product_lines pl
   SET franchise_id = s.franchise_id
  FROM public.subsets s
 WHERE pl.subset_id = s.subset_id
   AND pl.franchise_id IS NULL;

-- A Product Line no longer requires a Subfranchise.
ALTER TABLE public.product_lines
  ALTER COLUMN subset_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_lines_franchise ON public.product_lines (franchise_id);

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.product_lines ALTER COLUMN subset_id SET NOT NULL;  -- only if no NULLs exist
-- ALTER TABLE public.product_lines DROP COLUMN IF EXISTS franchise_id;
