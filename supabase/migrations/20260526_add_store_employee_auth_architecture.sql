-- CollectorsHub: Store-linked employee auth architecture with custom Store Code + Username + PIN login.
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SEQUENCE IF NOT EXISTS public.store_code_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code text UNIQUE NOT NULL DEFAULT lpad(nextval('public.store_code_seq')::text, 4, '0'),
  store_name text NOT NULL DEFAULT 'CollectorsHub Store',
  owner_user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_type text NOT NULL DEFAULT 'store',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.store_locations
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS internal_email text;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS pin_hash text;

ALTER TABLE public.store_employees
ADD COLUMN IF NOT EXISTS action_permissions jsonb;

ALTER TABLE public.store_employee_locations
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.store_employees
SET auth_user_id = employee_user_id
WHERE employee_user_id IS NOT NULL
  AND auth_user_id IS NULL;

INSERT INTO public.stores (store_name, owner_user_id, subscription_type)
SELECT
  COALESCE(NULLIF(ss.store_name, ''), 'CollectorsHub Store') AS store_name,
  p.id AS owner_user_id,
  CASE
    WHEN p.subscription_tier = 'store_pro' THEN 'store_plus'
    ELSE 'store'
  END AS subscription_type
FROM public.profiles p
LEFT JOIN public.store_settings ss ON ss.store_owner_id = p.id
WHERE p.subscription_tier IN ('store', 'store_pro')
ON CONFLICT (owner_user_id) DO NOTHING;

UPDATE public.store_settings ss
SET store_id = s.id
FROM public.stores s
WHERE s.owner_user_id = ss.store_owner_id
  AND ss.store_id IS NULL;

UPDATE public.store_locations sl
SET store_id = s.id
FROM public.stores s
WHERE s.owner_user_id = sl.store_owner_id
  AND sl.store_id IS NULL;

UPDATE public.store_employees se
SET store_id = s.id
FROM public.stores s
WHERE s.owner_user_id = se.store_owner_id
  AND se.store_id IS NULL;

UPDATE public.store_employee_locations sel
SET store_id = s.id
FROM public.stores s
WHERE s.owner_user_id = sel.store_owner_id
  AND sel.store_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_employees_username_unique
  ON public.store_employees (username)
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_employees_internal_email_unique
  ON public.store_employees (internal_email)
  WHERE internal_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_employees_store_id ON public.store_employees (store_id);
CREATE INDEX IF NOT EXISTS idx_store_locations_store_id ON public.store_locations (store_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_store_id ON public.store_settings (store_id);
CREATE INDEX IF NOT EXISTS idx_store_employee_locations_store_id ON public.store_employee_locations (store_id);

CREATE TABLE IF NOT EXISTS public.store_employee_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.store_employees(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_employee_audit_logs_store_id
  ON public.store_employee_audit_logs (store_id);

CREATE INDEX IF NOT EXISTS idx_store_employee_audit_logs_employee_id
  ON public.store_employee_audit_logs (employee_id);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_employee_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'stores_owner_full_access'
  ) THEN
    CREATE POLICY stores_owner_full_access
      ON public.stores
      FOR ALL
      TO authenticated
      USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'stores_employee_select'
  ) THEN
    CREATE POLICY stores_employee_select
      ON public.stores
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.store_employees se
          WHERE se.auth_user_id = auth.uid()
            AND se.store_id = stores.id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_employee_audit_logs' AND policyname = 'store_employee_audit_logs_owner_select'
  ) THEN
    CREATE POLICY store_employee_audit_logs_owner_select
      ON public.store_employee_audit_logs
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = store_employee_audit_logs.store_id
            AND s.owner_user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'store_employee_audit_logs' AND policyname = 'store_employee_audit_logs_employee_insert'
  ) THEN
    CREATE POLICY store_employee_audit_logs_employee_insert
      ON public.store_employee_audit_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.store_employees se
          WHERE se.auth_user_id = auth.uid()
            AND se.store_id = store_employee_audit_logs.store_id
        )
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.generate_store_employee_username(
  p_store_id uuid,
  p_first_name text,
  p_last_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_code text;
  v_first text;
  v_last_initial text;
  v_candidate text;
  v_attempt integer := 0;
BEGIN
  SELECT store_code INTO v_store_code
  FROM public.stores
  WHERE id = p_store_id;

  IF v_store_code IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  v_first := regexp_replace(COALESCE(p_first_name, ''), '[^a-zA-Z0-9]', '', 'g');
  v_last_initial := upper(left(regexp_replace(COALESCE(p_last_name, ''), '[^a-zA-Z0-9]', '', 'g'), 1));

  IF v_first = '' THEN
    v_first := 'User';
  END IF;

  IF v_last_initial = '' THEN
    v_last_initial := 'X';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_candidate := format('%s%s%s.%s', v_first, v_last_initial, floor(random() * 10)::int, v_store_code);

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.store_employees se
      WHERE lower(se.username) = lower(v_candidate)
    );

    IF v_attempt > 50 THEN
      RAISE EXCEPTION 'Could not generate unique username';
    END IF;
  END LOOP;

  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_store_employee_pin(
  p_employee_id uuid,
  p_pin text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_pin IS NULL OR char_length(trim(p_pin)) < 4 THEN
    RAISE EXCEPTION 'PIN must be at least 4 characters';
  END IF;

  UPDATE public.store_employees
  SET pin_hash = crypt(trim(p_pin), gen_salt('bf'))
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_store_employee_pin(
  p_store_code text,
  p_username text,
  p_pin text
)
RETURNS TABLE (
  store_id uuid,
  employee_id uuid,
  auth_user_id uuid,
  internal_email text,
  role text,
  permissions jsonb,
  all_locations boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    s.id,
    se.id,
    se.auth_user_id,
    se.internal_email,
    se.role,
    COALESCE(se.action_permissions, se.permissions, '{}'::jsonb) AS permissions,
    COALESCE(se.all_locations, true) AS all_locations
  FROM public.stores s
  JOIN public.store_employees se ON se.store_id = s.id
  WHERE s.store_code = trim(p_store_code)
    AND lower(se.username) = lower(trim(p_username))
    AND se.status IN ('active', 'invited')
    AND se.pin_hash IS NOT NULL
    AND crypt(trim(p_pin), se.pin_hash) = se.pin_hash
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.log_store_employee_action(
  p_store_id uuid,
  p_employee_id uuid,
  p_action text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.store_employee_audit_logs (store_id, employee_id, action, metadata)
  VALUES (p_store_id, p_employee_id, p_action, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;
