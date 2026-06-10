-- CollectorsHub: Store settings and employee management tables.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.store_settings (
  store_owner_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_logo_url text,
  store_banner_url text,
  store_name text,
  store_description text,
  store_address text,
  business_hours text,
  store_visibility text NOT NULL DEFAULT 'Public',
  auto_publish_inventory boolean NOT NULL DEFAULT false,
  allow_purchase_requests boolean NOT NULL DEFAULT false,
  enable_marketplace_listings boolean NOT NULL DEFAULT false,
  enable_event_creation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_employees_store_owner_email_key UNIQUE (store_owner_id, email)
);

CREATE INDEX IF NOT EXISTS idx_store_employees_store_owner_id ON public.store_employees (store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_employees_employee_user_id ON public.store_employees (employee_user_id);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_settings'
      AND policyname = 'store_settings_owner_full_access'
  ) THEN
    CREATE POLICY store_settings_owner_full_access
      ON public.store_settings
      FOR ALL
      TO authenticated
      USING (store_owner_id = auth.uid())
      WITH CHECK (store_owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_employees'
      AND policyname = 'store_employees_owner_full_access'
  ) THEN
    CREATE POLICY store_employees_owner_full_access
      ON public.store_employees
      FOR ALL
      TO authenticated
      USING (store_owner_id = auth.uid())
      WITH CHECK (store_owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_employees'
      AND policyname = 'store_employees_self_read'
  ) THEN
    CREATE POLICY store_employees_self_read
      ON public.store_employees
      FOR SELECT
      TO authenticated
      USING (employee_user_id = auth.uid());
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER set_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_store_employees_updated_at ON public.store_employees;
CREATE TRIGGER set_store_employees_updated_at
BEFORE UPDATE ON public.store_employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
