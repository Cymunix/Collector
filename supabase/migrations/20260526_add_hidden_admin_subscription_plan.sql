-- CollectorsHub: Internal admin subscription plan (hidden from site selection).
-- Safe to run multiple times.

ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'subscription_tier'
      AND e.enumlabel = 'platform_admin'
  ) THEN
    ALTER TYPE public.subscription_tier ADD VALUE 'platform_admin';
  END IF;
END
$$;
