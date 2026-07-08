-- CollectorsHub: retail_price (MSRP) on items.
-- Catalog-level default price — primarily for LEGO sets — shown on the item
-- screen and used to pre-fill the purchase price when adding to a collection
-- (the collector can still override it per owned copy).
-- Safe to re-run (idempotent).

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2);

COMMENT ON COLUMN public.items.retail_price IS 'Catalog default / MSRP. Pre-fills purchase price on add-to-collection; overridable per owned copy.';

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.items DROP COLUMN IF EXISTS retail_price;
