-- Manage Images — Step 2: automated image discovery architecture
--
-- Two new admin-only tables. They are deliberately separate from item_images:
-- item_images holds APPROVED catalogue images that normal users can view; these
-- two hold the discovery pipeline (unreviewed suggestions + search jobs) which is
-- admin-only and never shown in the public catalogue.
--
-- FKs point at items(item_id) — the catalogue item — matching the rest of the schema.
-- No web scraping is implemented; these tables are the provider-agnostic substrate
-- an external image API/provider can populate later.

-- ── Candidates ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.image_candidates (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id             uuid        NOT NULL REFERENCES public.items (item_id) ON DELETE CASCADE,
  search_job_id       uuid,       -- soft link to image_search_jobs.id (set below)
  image_url           text        NOT NULL,
  thumb_url           text,
  source_url          text,
  source_name         text,
  external_product_id text,       -- provider's product id, for de-dup / re-query
  match_score         numeric     NOT NULL DEFAULT 0,
  match_reasons       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  reviewed_by         uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  -- Same candidate (same image) must not be suggested twice for one item, so a
  -- rejected candidate stays rejected instead of reappearing.
  UNIQUE (item_id, image_url)
);
CREATE INDEX IF NOT EXISTS idx_image_candidates_item   ON public.image_candidates (item_id);
CREATE INDEX IF NOT EXISTS idx_image_candidates_status ON public.image_candidates (item_id, status);

-- ── Search jobs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.image_search_jobs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          uuid        NOT NULL REFERENCES public.items (item_id) ON DELETE CASCADE,
  status           text        NOT NULL DEFAULT 'ready'
                               CHECK (status IN ('ready','searching','candidates_found','no_candidates','needs_review','error','completed')),
  trigger          text        NOT NULL DEFAULT 'manual'
                               CHECK (trigger IN ('manual','item_created','bulk_import','missing_items_action','last_image_deleted')),
  search_metadata  jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- prioritised query terms built from taxonomy
  candidates_found integer     NOT NULL DEFAULT 0,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  completed_at     timestamptz,
  created_by       uuid        REFERENCES public.profiles (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_image_search_jobs_item   ON public.image_search_jobs (item_id);
CREATE INDEX IF NOT EXISTS idx_image_search_jobs_status ON public.image_search_jobs (status);
-- At most one *active* (ready/searching) job per item, so the automatic pipeline
-- never double-queues an item that is already being processed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_image_search_jobs_active
  ON public.image_search_jobs (item_id) WHERE status IN ('ready','searching');

ALTER TABLE public.image_candidates
  ADD CONSTRAINT image_candidates_job_fk
  FOREIGN KEY (search_job_id) REFERENCES public.image_search_jobs (id) ON DELETE SET NULL;

-- ── Security ─────────────────────────────────────────────────────────────────
-- The discovery pipeline is admin-only for BOTH read and write. Nothing here is
-- surfaced to normal users, so there is no public-read policy (unlike item_images).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['image_candidates','image_search_jobs'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_admin') THEN
      EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$, t||'_admin', t);
    END IF;
  END LOOP;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.image_candidates;
-- DROP TABLE IF EXISTS public.image_search_jobs;
