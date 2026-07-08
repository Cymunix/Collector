-- CollectorsHub: set_minifigs — bidirectional join between LEGO set items and minifig items.
-- Safe to run multiple times.

-- ── 1. Partial UNIQUE index on items.bricklink_id ─────────────────────────────
-- Ensures the same BrickLink code cannot produce two item rows (canonical key).
-- If duplicates already exist, the index is skipped with a NOTICE.
-- Run scripts/dedup-lego-items.mjs first, then re-apply this migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'items'
      AND indexname  = 'idx_items_bricklink_id_unique'
  ) THEN
    BEGIN
      EXECUTE '
        CREATE UNIQUE INDEX idx_items_bricklink_id_unique
          ON public.items (bricklink_id)
          WHERE bricklink_id IS NOT NULL
      ';
      RAISE NOTICE 'Created idx_items_bricklink_id_unique.';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipped idx_items_bricklink_id_unique — duplicate bricklink_id values exist. Run dedup-lego-items.mjs first.';
    END;
  END IF;
END;
$$;

-- ── 2. Join table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.set_minifigs (
  set_item_id     uuid NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  minifig_item_id uuid NOT NULL REFERENCES public.items(item_id) ON DELETE CASCADE,
  quantity        integer NOT NULL DEFAULT 1,
  CONSTRAINT set_minifigs_pkey              PRIMARY KEY (set_item_id, minifig_item_id),
  CONSTRAINT set_minifigs_no_self_reference CHECK (set_item_id <> minifig_item_id),
  CONSTRAINT set_minifigs_quantity_positive CHECK (quantity > 0)
);

-- Indexes for both traversal directions
CREATE INDEX IF NOT EXISTS idx_set_minifigs_set_item_id
  ON public.set_minifigs (set_item_id);
CREATE INDEX IF NOT EXISTS idx_set_minifigs_minifig_item_id
  ON public.set_minifigs (minifig_item_id);

-- ── 3. RLS (matches existing join-table pattern) ──────────────────────────────
ALTER TABLE public.set_minifigs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public read
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'set_minifigs'
      AND policyname = 'set_minifigs_read'
  ) THEN
    CREATE POLICY set_minifigs_read
      ON public.set_minifigs
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  -- Platform admin write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'set_minifigs'
      AND policyname = 'set_minifigs_write_platform_admin'
  ) THEN
    CREATE POLICY set_minifigs_write_platform_admin
      ON public.set_minifigs
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      );
  END IF;
END;
$$;

-- ── 4. Read views ─────────────────────────────────────────────────────────────

-- "What minifigs are in set X?"  query: WHERE set_item_id = $1
CREATE OR REPLACE VIEW public.set_minifig_contents AS
SELECT
  sm.set_item_id,
  sm.minifig_item_id,
  sm.quantity,
  mf.bricklink_id         AS minifig_bricklink_id,
  mf.description          AS minifig_name,
  mf.subject_id           AS minifig_subject_id,
  mf.piece_count          AS minifig_piece_count,
  mf.brand_id             AS minifig_brand_id,
  mf.franchise_id         AS minifig_franchise_id,
  mf.collectible_set_id   AS minifig_collectible_set_id
FROM public.set_minifigs sm
JOIN public.items mf ON mf.item_id = sm.minifig_item_id;

-- "What sets does minifig Y appear in?"  query: WHERE minifig_item_id = $1
CREATE OR REPLACE VIEW public.minifig_set_appearances AS
SELECT
  sm.minifig_item_id,
  sm.set_item_id,
  sm.quantity,
  s.bricklink_id          AS set_bricklink_id,
  s.description           AS set_name,
  s.release_year          AS set_release_year,
  s.piece_count           AS set_piece_count,
  s.franchise_id          AS set_franchise_id,
  s.collectible_set_id    AS set_collectible_set_id
FROM public.set_minifigs sm
JOIN public.items s ON s.item_id = sm.set_item_id;

-- ── Down migration (uncomment to reverse) ────────────────────────────────────
-- DROP VIEW  IF EXISTS public.minifig_set_appearances;
-- DROP VIEW  IF EXISTS public.set_minifig_contents;
-- DROP TABLE IF EXISTS public.set_minifigs;
-- DROP INDEX IF EXISTS idx_items_bricklink_id_unique;
