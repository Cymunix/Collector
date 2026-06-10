-- CollectorsHub: track subscription periods and scheduled downgrades
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_downgrade_tier public.subscription_tier,
  ADD COLUMN IF NOT EXISTS has_event_organizer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly';

-- Normalize old model where event organizer was stored as a base tier.
UPDATE public.profiles
SET
  subscription_tier = 'free_collector',
  has_event_organizer = true
WHERE subscription_tier = 'event_organizer';

-- Store plans always include event organizer.
UPDATE public.profiles
SET has_event_organizer = true
WHERE subscription_tier IN ('store', 'store_pro');

-- Backfill paid users with a billing window when missing.
UPDATE public.profiles
SET
  subscription_started_at = COALESCE(subscription_started_at, created_at),
  subscription_current_period_end = COALESCE(
    subscription_current_period_end,
    COALESCE(subscription_started_at, created_at) + interval '1 month'
  )
WHERE subscription_tier <> 'free_collector';

-- Free tier should not carry paid-period metadata.
UPDATE public.profiles
SET
  subscription_started_at = NULL,
  subscription_current_period_end = NULL,
  cancel_at_period_end = false,
  scheduled_downgrade_tier = NULL
WHERE subscription_tier = 'free_collector';

-- Free collector with Event Organizer add-on is still a paid subscription.
UPDATE public.profiles
SET
  subscription_started_at = COALESCE(subscription_started_at, created_at),
  subscription_current_period_end = COALESCE(
    subscription_current_period_end,
    COALESCE(subscription_started_at, created_at) + interval '1 month'
  )
WHERE subscription_tier = 'free_collector'
  AND has_event_organizer = true;

-- If cancellation was previously flagged without a target tier, default to free tier.
UPDATE public.profiles
SET scheduled_downgrade_tier = 'free_collector'
WHERE cancel_at_period_end = true
  AND scheduled_downgrade_tier IS NULL;
