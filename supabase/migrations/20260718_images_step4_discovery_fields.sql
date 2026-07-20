-- Manage Images — Step 4: fields for the Google discovery provider
--
-- Additive columns for the `discover-catalog-images` edge function. The candidate
-- and job tables (steps 1-3) are already live; this only adds columns.
--
--   image_candidates.metadata  – normalised extras Google returns that don't have
--                                their own column (width, height, mime, title,
--                                snippet, source_domain). Kept as JSONB so the
--                                provider can evolve without schema churn.
--   image_search_jobs.provider – which provider produced the job
--                                (e.g. 'google_programmable_search').
--   image_search_jobs.query    – the exact query string sent to the provider,
--                                stored for debugging.

ALTER TABLE public.image_candidates  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.image_search_jobs ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.image_search_jobs ADD COLUMN IF NOT EXISTS query    text;

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.image_search_jobs DROP COLUMN IF EXISTS query;
-- ALTER TABLE public.image_search_jobs DROP COLUMN IF EXISTS provider;
-- ALTER TABLE public.image_candidates  DROP COLUMN IF EXISTS metadata;
