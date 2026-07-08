-- CollectorsHub: Add lego_set_number to items.
-- This is the canonical LEGO set number (e.g. "75357") without the BrickLink
-- variant suffix (e.g. "75357-1"). Most sets have only a -1 variant so this is
-- usually derivable, but storing it explicitly avoids repeated string parsing
-- and makes it searchable/displayable directly.
-- Safe to re-run (idempotent).

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS lego_set_number TEXT;

CREATE INDEX IF NOT EXISTS idx_items_lego_set_number
  ON public.items (lego_set_number)
  WHERE lego_set_number IS NOT NULL;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP INDEX IF EXISTS idx_items_lego_set_number;
-- ALTER TABLE public.items DROP COLUMN IF EXISTS lego_set_number;
