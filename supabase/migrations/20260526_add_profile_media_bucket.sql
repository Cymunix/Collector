-- CollectorsHub: settings image uploads for profile/store photos.
-- Safe to run multiple times.

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_media_insert_own_folder'
  ) THEN
    CREATE POLICY profile_media_insert_own_folder
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-media'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_media_update_own_folder'
  ) THEN
    CREATE POLICY profile_media_update_own_folder
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'profile-media'
        AND split_part(name, '/', 1) = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'profile-media'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_media_delete_own_folder'
  ) THEN
    CREATE POLICY profile_media_delete_own_folder
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'profile-media'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;
END
$$;
