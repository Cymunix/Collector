-- Manage Images — Step 1: extend the EXISTING item_images table (do not fork it)
--
-- WHY: item_images is already the catalogue image table
--   (item_image_id, item_id, image_path, position, created_at). image_path holds
--   either a storage path in the public `item-images` bucket OR an external http
--   URL. "Primary" is currently encoded implicitly as position = 0 (the detail
--   page, catalogue list and completion views all derive the front photo from
--   position 0). The Manage Images feature needs provenance + an explicit primary
--   flag + a verification flag. Rather than create a duplicate `catalog_item_images`
--   table, we extend the one that already exists. `position` stays as the sort order.
--
-- Additive + reversible. No existing column is renamed or dropped.

ALTER TABLE public.item_images ADD COLUMN IF NOT EXISTS source_url   text;
ALTER TABLE public.item_images ADD COLUMN IF NOT EXISTS source_name  text;
ALTER TABLE public.item_images ADD COLUMN IF NOT EXISTS is_verified  boolean NOT NULL DEFAULT false;
ALTER TABLE public.item_images ADD COLUMN IF NOT EXISTS is_primary   boolean NOT NULL DEFAULT false;
ALTER TABLE public.item_images ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

-- Backfill: the historical primary is position 0. Keep the two in sync so nothing
-- that still reads position 0 breaks. The app's "Set as Primary" action also moves
-- the chosen image to position 0, preserving this invariant going forward.
UPDATE public.item_images SET is_primary = true  WHERE position = 0 AND is_primary = false;
UPDATE public.item_images SET is_primary = false WHERE position <> 0 AND is_primary = true;

-- Enforce "at most one primary per item" at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_images_one_primary
  ON public.item_images (item_id) WHERE is_primary;

-- ── Security ─────────────────────────────────────────────────────────────────
-- item_images currently has no write restriction: an anonymous client can INSERT
-- (verified — an anon insert reached the FK check instead of being blocked). Close
-- that hole. Reads stay open (normal users must still VIEW approved images through
-- the catalogue); writes become platform-admin only. Mirrors the series/subsets
-- policy pattern so the admin's authenticated session keeps working unchanged.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY';

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='item_images' AND policyname='item_images_read') THEN
    EXECUTE 'CREATE POLICY item_images_read ON public.item_images FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='item_images' AND policyname='item_images_write') THEN
    EXECUTE $f$CREATE POLICY item_images_write ON public.item_images FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$;
  END IF;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS item_images_write ON public.item_images;
-- DROP POLICY IF EXISTS item_images_read  ON public.item_images;
-- ALTER TABLE public.item_images DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS public.uq_item_images_one_primary;
-- ALTER TABLE public.item_images DROP COLUMN IF EXISTS updated_at;
-- ALTER TABLE public.item_images DROP COLUMN IF EXISTS is_primary;
-- ALTER TABLE public.item_images DROP COLUMN IF EXISTS is_verified;
-- ALTER TABLE public.item_images DROP COLUMN IF EXISTS source_name;
-- ALTER TABLE public.item_images DROP COLUMN IF EXISTS source_url;
