-- Fix plan labels and pricing semantics.
-- Goal: fixed monthly price for most tiers, and Contact Sales via NULL price for Store Pro.

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_price_cents integer;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}'::text[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscription_plans'
      AND column_name = 'monthly_price_min_cents'
  ) THEN
    UPDATE public.subscription_plans
    SET monthly_price_cents = COALESCE(monthly_price_cents, monthly_price_min_cents)
    WHERE monthly_price_cents IS NULL;
  END IF;
END
$$;

ALTER TABLE public.subscription_plans
  ALTER COLUMN monthly_price_cents DROP NOT NULL;

ALTER TABLE public.subscription_plans
  DROP COLUMN IF EXISTS monthly_price_max_cents,
  DROP COLUMN IF EXISTS monthly_price_min_cents;

UPDATE public.subscription_plans
SET
  display_name = CASE
    WHEN tier::text = 'free_collector' THEN 'Free Collector'
    WHEN tier::text = 'collector_plus' THEN 'Collector+'
    WHEN tier::text = 'store' THEN 'Store'
    WHEN tier::text = 'store_pro' THEN 'Store Pro'
    WHEN tier::text = 'event_organizer' THEN 'Event Organizer'
    ELSE display_name
  END,
  monthly_price_cents = CASE
    WHEN tier::text = 'free_collector' THEN 0
    WHEN tier::text = 'collector_plus' THEN 500
    WHEN tier::text = 'store' THEN 4900
    WHEN tier::text = 'store_pro' THEN NULL
    WHEN tier::text = 'event_organizer' THEN 1500
    ELSE monthly_price_cents
  END,
  description = CASE
    WHEN tier::text = 'free_collector' THEN 'Start building and tracking your collection'
    WHEN tier::text = 'collector_plus' THEN 'Advanced tools for serious collectors'
    WHEN tier::text = 'event_organizer' THEN 'Promote events and connect with collectors'
    WHEN tier::text = 'store' THEN 'Grow your shop and reach local collectors'
    WHEN tier::text = 'store_pro' THEN 'Custom solutions for larger retailers'
    ELSE description
  END,
  features = CASE
    WHEN tier::text = 'free_collector' THEN ARRAY[
      'Collection tracker',
      'Wishlist',
      'Marketplace access',
      'Monthly collection reports',
      'Public collector profile'
    ]::text[]
    WHEN tier::text = 'collector_plus' THEN ARRAY[
      'Deal alerts',
      'Collection analytics',
      'Grading recommendations',
      'Unlimited collection folders',
      'Portfolio insights'
    ]::text[]
    WHEN tier::text = 'event_organizer' THEN ARRAY[
      'Create and manage events',
      'Event pages and schedules',
      'Vendor listings',
      'Attendance tracking',
      'Local promotion tools'
    ]::text[]
    WHEN tier::text = 'store' THEN ARRAY[
      'Store profile page',
      'Inventory management',
      'Promotions and sales tools',
      'Buy collections from users',
      'Store analytics'
    ]::text[]
    WHEN tier::text = 'store_pro' THEN ARRAY[
      'Multi-location support',
      'POS integration',
      'API access',
      'Advanced reporting',
      'Dedicated support'
    ]::text[]
    ELSE features
  END,
  audience = CASE
    WHEN tier::text = 'free_collector' THEN 'Everyone'
    WHEN tier::text = 'collector_plus' THEN 'Enthusiasts'
    WHEN tier::text = 'store' THEN 'Independent shops'
    WHEN tier::text = 'store_pro' THEN 'Larger retailers'
    WHEN tier::text = 'event_organizer' THEN 'Event organizers'
    ELSE audience
  END,
  updated_at = now()
WHERE tier::text IN ('free_collector', 'collector_plus', 'store', 'store_pro', 'event_organizer');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_tier'
      AND e.enumlabel = 'event_organizer'
  ) THEN
    INSERT INTO public.subscription_plans (
      tier,
      display_name,
      monthly_price_cents,
      description,
      features,
      audience
    )
    VALUES (
      'event_organizer',
      'Event Organizer',
      1500,
      'Promote events and connect with collectors',
      ARRAY[
        'Create and manage events',
        'Event pages and schedules',
        'Vendor listings',
        'Attendance tracking',
        'Local promotion tools'
      ]::text[],
      'Event organizers'
    )
    ON CONFLICT (tier) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      monthly_price_cents = EXCLUDED.monthly_price_cents,
      description = EXCLUDED.description,
      features = EXCLUDED.features,
      audience = EXCLUDED.audience,
      updated_at = now();
  END IF;
END
$$;
