-- CollectorsHub: support requests submitted from in-app modal
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_email text,
  request_type text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  current_plan text,
  locations text,
  employee_count text,
  additional_info text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS support_requests_set_updated_at ON public.support_requests;
CREATE TRIGGER support_requests_set_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_requests'
      AND policyname = 'support_requests_insert_own'
  ) THEN
    CREATE POLICY support_requests_insert_own
      ON public.support_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_requests'
      AND policyname = 'support_requests_select_own'
  ) THEN
    CREATE POLICY support_requests_select_own
      ON public.support_requests
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;
