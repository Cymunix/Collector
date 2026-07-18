-- Manage Images — Step 3: lock down writes to the `item-images` storage bucket
--
-- WHY: the spec requires that non-admins cannot upload catalogue images "through
-- direct API requests". item_images (the row) is now admin-write only, but the
-- underlying storage bucket needs the same treatment or a non-admin could still
-- PUT objects into it via the Storage API. Public READ stays open (the bucket is
-- public and normal users must view images); write/update/delete become admin-only.
--
-- NOTE: Postgres RLS policies are PERMISSIVE (OR-combined). If a broader
-- "allow all authenticated/anon to write" policy already exists on storage.objects
-- for this bucket, adding this one does NOT override it. After applying, verify with:
--   select policyname, cmd, roles from pg_policies
--    where schemaname='storage' and tablename='objects';
-- and drop any pre-existing permissive write policy that targets item-images.

DO $$
BEGIN
  -- Admin-only INSERT/UPDATE/DELETE on objects in the item-images bucket.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='item_images_bucket_admin_write') THEN
    EXECUTE $f$CREATE POLICY item_images_bucket_admin_write ON storage.objects FOR ALL TO authenticated
      USING (bucket_id = 'item-images'
             AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (bucket_id = 'item-images'
             AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$;
  END IF;

  -- Ensure public read of the bucket remains available.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='item_images_bucket_public_read') THEN
    EXECUTE $f$CREATE POLICY item_images_bucket_public_read ON storage.objects FOR SELECT TO anon, authenticated
      USING (bucket_id = 'item-images')$f$;
  END IF;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- DROP POLICY IF EXISTS item_images_bucket_admin_write ON storage.objects;
-- DROP POLICY IF EXISTS item_images_bucket_public_read ON storage.objects;
