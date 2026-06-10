-- Seed Event Organizer subscription plan.
-- Run after the enum value event_organizer exists.

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}'::text[];

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
