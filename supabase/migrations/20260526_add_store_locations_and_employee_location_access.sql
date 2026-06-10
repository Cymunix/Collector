-- CollectorsHub: Store+ multi-location support and employee location access.
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

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS all_locations boolean NOT NULL DEFAULT true;

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS track_inventory_by_location boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.store_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  street_address text,
  city text,
  province text,
  postal_code text,
  phone_number text,
  manager_employee_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'store_locations'
      AND constraint_name = 'store_locations_manager_employee_fk'
  ) THEN
    ALTER TABLE public.store_locations
      ADD CONSTRAINT store_locations_manager_employee_fk
      FOREIGN KEY (manager_employee_id)
      REFERENCES public.store_employees(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_store_locations_store_owner_id ON public.store_locations (store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_manager_employee_id ON public.store_locations (manager_employee_id);

CREATE TABLE IF NOT EXISTS public.store_employee_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.store_employees(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.store_locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_employee_locations_unique_assignment UNIQUE (employee_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_store_employee_locations_store_owner_id ON public.store_employee_locations (store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_employee_locations_employee_id ON public.store_employee_locations (employee_id);
CREATE INDEX IF NOT EXISTS idx_store_employee_locations_location_id ON public.store_employee_locations (location_id);

CREATE TABLE IF NOT EXISTS public.store_inventory_location_quantities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sku text NOT NULL,
  location_id uuid NOT NULL REFERENCES public.store_locations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_inventory_location_quantities_unique_key UNIQUE (store_owner_id, sku, location_id)
);

CREATE INDEX IF NOT EXISTS idx_store_inventory_location_quantities_store_owner_id
  ON public.store_inventory_location_quantities (store_owner_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_location_quantities_location_id
  ON public.store_inventory_location_quantities (location_id);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_inventory_location_quantities ENABLE ROW LEVEL SECURITY;

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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_locations'
      AND policyname = 'store_locations_owner_full_access'
  ) THEN
    CREATE POLICY store_locations_owner_full_access
      ON public.store_locations
      FOR ALL
      TO authenticated
      USING (store_owner_id = auth.uid())
      WITH CHECK (store_owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_employee_locations'
      AND policyname = 'store_employee_locations_owner_full_access'
  ) THEN
    CREATE POLICY store_employee_locations_owner_full_access
      ON public.store_employee_locations
      FOR ALL
      TO authenticated
      USING (store_owner_id = auth.uid())
      WITH CHECK (store_owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_inventory_location_quantities'
      AND policyname = 'store_inventory_location_quantities_owner_full_access'
  ) THEN
    CREATE POLICY store_inventory_location_quantities_owner_full_access
      ON public.store_inventory_location_quantities
      FOR ALL
      TO authenticated
      USING (store_owner_id = auth.uid())
      WITH CHECK (store_owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_locations'
      AND policyname = 'store_locations_employee_select'
  ) THEN
    CREATE POLICY store_locations_employee_select
      ON public.store_locations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.store_employees employee
          WHERE employee.employee_user_id = auth.uid()
            AND employee.store_owner_id = store_locations.store_owner_id
            AND (
              employee.all_locations
              OR EXISTS (
                SELECT 1
                FROM public.store_employee_locations employee_location
                WHERE employee_location.employee_id = employee.id
                  AND employee_location.location_id = store_locations.id
              )
            )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'store_employee_locations'
      AND policyname = 'store_employee_locations_employee_select'
  ) THEN
    CREATE POLICY store_employee_locations_employee_select
      ON public.store_employee_locations
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.store_employees employee
          WHERE employee.employee_user_id = auth.uid()
            AND employee.id = store_employee_locations.employee_id
        )
      );
  END IF;
END
$$;

DROP TRIGGER IF EXISTS set_store_locations_updated_at ON public.store_locations;
CREATE TRIGGER set_store_locations_updated_at
BEFORE UPDATE ON public.store_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_store_inventory_location_quantities_updated_at ON public.store_inventory_location_quantities;
CREATE TRIGGER set_store_inventory_location_quantities_updated_at
BEFORE UPDATE ON public.store_inventory_location_quantities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
