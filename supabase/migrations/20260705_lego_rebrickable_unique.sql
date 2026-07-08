-- CollectorsHub: LEGO 3-table import support.
-- Adds the fig-num (rebrickable_fig_id) identity guarantee and a derived
-- minifig-count view for sets. Safe to re-run (idempotent).
--
-- Context: the three-file importer (scripts/import-lego-3table.mjs) treats the
-- Rebrickable fig-num as the minifig dedupe key. A partial-unique index makes
-- that guarantee enforced at the DB level so re-imports can never create a
-- second row for the same fig-num.
--
-- PREREQUISITE: any pre-existing duplicate rebrickable_fig_id values must be
-- merged first — run  scripts/dedup-lego-rebrickable.mjs  before this migration.
-- If duplicates still exist the index creation is skipped with a NOTICE (so the
-- migration stays re-runnable); re-apply after deduping.

-- ── 1. Partial UNIQUE index on items.rebrickable_fig_id ───────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'items'
      AND indexname  = 'idx_items_rebrickable_fig_id_unique'
  ) THEN
    BEGIN
      EXECUTE '
        CREATE UNIQUE INDEX idx_items_rebrickable_fig_id_unique
          ON public.items (rebrickable_fig_id)
          WHERE rebrickable_fig_id IS NOT NULL
      ';
      RAISE NOTICE 'Created idx_items_rebrickable_fig_id_unique.';
    EXCEPTION WHEN unique_violation OR others THEN
      RAISE NOTICE 'Skipped idx_items_rebrickable_fig_id_unique — duplicate rebrickable_fig_id values exist. Run scripts/dedup-lego-rebrickable.mjs first, then re-apply.';
    END;
  END IF;
END;
$$;

-- ── 2. Derived minifig-count view ─────────────────────────────────────────────
-- minifig_count is DERIVED from the join table, never stored on the set.
--   distinct_minifigs = number of distinct minifigs in the set
--   total_minifigs    = sum of quantities (battle-pack figs counted per copy)
CREATE OR REPLACE VIEW public.lego_set_minifig_counts AS
SELECT
  sm.set_item_id,
  COUNT(*)::int              AS distinct_minifigs,
  COALESCE(SUM(sm.quantity), 0)::int AS total_minifigs
FROM public.set_minifigs sm
GROUP BY sm.set_item_id;

-- ── Down migration (uncomment to reverse) ────────────────────────────────────
-- DROP VIEW  IF EXISTS public.lego_set_minifig_counts;
-- DROP INDEX IF EXISTS public.idx_items_rebrickable_fig_id_unique;
