-- CollectorsHub: Seed hidden Platform Admin plan after enum value exists.
-- Safe to run multiple times.

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
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO public.subscription_plans (
      tier,
      display_name,
      monthly_price_cents,
      description,
      features,
      audience,
      is_public
    )
    VALUES (
      'platform_admin',
      'Platform Admin',
      0,
      'Internal administrative access tier.',
      ARRAY[
        'Internal admin tools',
        'Platform configuration access',
        'Operational support controls'
      ],
      'Internal',
      false
    )
    ON CONFLICT (tier) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      monthly_price_cents = EXCLUDED.monthly_price_cents,
      description = EXCLUDED.description,
      features = EXCLUDED.features,
      audience = EXCLUDED.audience,
      is_public = EXCLUDED.is_public,
      updated_at = now()
  $sql$;
END
$$;
