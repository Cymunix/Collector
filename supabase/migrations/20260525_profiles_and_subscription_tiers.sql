-- CollectorsHub: profiles + subscription tiers
-- Safe to run multiple times.

-- 1) Subscription tier enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'subscription_tier'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.subscription_tier AS ENUM (
      'free_collector',
      'collector_plus',
      'store',
      'store_pro',
      'event_organizer'
    );
  END IF;
END
$$;

-- 2) Plan catalog table (pricing + audience)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  tier public.subscription_tier PRIMARY KEY,
  display_name text NOT NULL,
  monthly_price_cents integer CHECK (monthly_price_cents IS NULL OR monthly_price_cents >= 0),
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}'::text[],
  audience text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backward compatibility: migrate old min/max schema to single fixed price if needed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscription_plans'
      AND column_name = 'monthly_price_min_cents'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD COLUMN IF NOT EXISTS monthly_price_cents integer;

    ALTER TABLE public.subscription_plans
      ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

    ALTER TABLE public.subscription_plans
      ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}'::text[];

    UPDATE public.subscription_plans
    SET monthly_price_cents = COALESCE(monthly_price_cents, monthly_price_min_cents)
    WHERE monthly_price_cents IS NULL;

    ALTER TABLE public.subscription_plans
      DROP COLUMN IF EXISTS monthly_price_max_cents,
      DROP COLUMN IF EXISTS monthly_price_min_cents;
  END IF;
END
$$;

ALTER TABLE public.subscription_plans
  ALTER COLUMN monthly_price_cents DROP NOT NULL;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}'::text[];

-- Seed the plan rows from your proposed model.
INSERT INTO public.subscription_plans (
  tier,
  display_name,
  monthly_price_cents,
  description,
  features,
  audience
)
VALUES
  (
    'free_collector',
    'Free Collector',
    0,
    'Start building and tracking your collection',
    ARRAY[
      'Collection tracker',
      'Wishlist',
      'Marketplace access',
      'Monthly collection reports',
      'Public collector profile'
    ]::text[],
    'Everyone'
  ),
  (
    'collector_plus',
    'Collector+',
    500,
    'Advanced tools for serious collectors',
    ARRAY[
      'Deal alerts',
      'Collection analytics',
      'Grading recommendations',
      'Unlimited collection folders',
      'Portfolio insights'
    ]::text[],
    'Enthusiasts'
  ),
  (
    'store',
    'Store',
    4900,
    'Grow your shop and reach local collectors',
    ARRAY[
      'Store profile page',
      'Inventory management',
      'Promotions and sales tools',
      'Buy collections from users',
      'Store analytics'
    ]::text[],
    'Independent shops'
  ),
  (
    'store_pro',
    'Store Pro',
    NULL,
    'Custom solutions for larger retailers',
    ARRAY[
      'Multi-location support',
      'POS integration',
      'API access',
      'Advanced reporting',
      'Dedicated support'
    ]::text[],
    'Larger retailers'
  )
ON CONFLICT (tier) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  audience = EXCLUDED.audience,
  updated_at = now();

-- 3) Profiles table linked 1:1 to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text UNIQUE,
  display_name text,
  avatar_url text,
  subscription_tier public.subscription_tier NOT NULL DEFAULT 'free_collector',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS subscription_plans_set_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_set_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 5) Auto-create a profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 6) Row Level Security policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_plans'
      AND policyname = 'plans_select_all'
  ) THEN
    CREATE POLICY plans_select_all
      ON public.subscription_plans
      FOR SELECT
      USING (true);
  END IF;
END
$$;
