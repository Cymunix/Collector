-- CollectorsHub: compliance purchase ledger for subscription checkouts
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.subscription_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_email text,
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL CHECK (tax_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'CAD',
  status text NOT NULL DEFAULT 'completed',
  resulting_subscription_tier public.subscription_tier NOT NULL,
  resulting_has_event_organizer boolean NOT NULL DEFAULT false,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS subscription_purchases_set_updated_at ON public.subscription_purchases;
CREATE TRIGGER subscription_purchases_set_updated_at
BEFORE UPDATE ON public.subscription_purchases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscription_purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_purchases'
      AND policyname = 'subscription_purchases_insert_own'
  ) THEN
    CREATE POLICY subscription_purchases_insert_own
      ON public.subscription_purchases
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_purchases'
      AND policyname = 'subscription_purchases_select_own'
  ) THEN
    CREATE POLICY subscription_purchases_select_own
      ON public.subscription_purchases
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;
