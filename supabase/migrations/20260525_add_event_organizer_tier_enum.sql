-- Add Event Organizer tier to the subscription_tier enum.
-- Must be run/committed before any SQL that inserts this enum value.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'subscription_tier'
      AND e.enumlabel = 'event_organizer'
  ) THEN
    ALTER TYPE public.subscription_tier ADD VALUE 'event_organizer';
  END IF;
END
$$;
