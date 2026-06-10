-- CollectorsHub: support request metadata and secure document uploads
-- Safe to run multiple times.

ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS business_hours text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS certificate_details text,
  ADD COLUMN IF NOT EXISTS certificate_scan_path text,
  ADD COLUMN IF NOT EXISTS proof_of_address_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('support-documents', 'support-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'support_docs_insert_own_folder'
  ) THEN
    CREATE POLICY support_docs_insert_own_folder
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'support-documents'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'support_docs_select_own_folder'
  ) THEN
    CREATE POLICY support_docs_select_own_folder
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'support-documents'
        AND split_part(name, '/', 1) = auth.uid()::text
      );
  END IF;
END
$$;
