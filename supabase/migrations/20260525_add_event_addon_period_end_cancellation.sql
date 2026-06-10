-- CollectorsHub: support scheduling Event Organizer removal at period end.
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cancel_event_addon_at_period_end boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET cancel_event_addon_at_period_end = false
WHERE cancel_event_addon_at_period_end IS NULL;