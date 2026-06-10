-- CollectorsHub: Dedicated Magic cards table.
-- Fields based on provided Scryfall bulk dataset metadata.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.magic_cards (
  id text PRIMARY KEY,
  category text,
  subcategory text,
  franchise text,
  brand text,
  uri text NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  download_uri text,
  updated_at timestamptz,
  size bigint,
  content_type text,
  content_encoding text,
  created_at timestamptz NOT NULL DEFAULT now(),
  row_updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT magic_cards_size_non_negative CHECK (size IS NULL OR size >= 0)
);

ALTER TABLE public.magic_cards
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS franchise text,
  ADD COLUMN IF NOT EXISTS brand text;

CREATE INDEX IF NOT EXISTS idx_magic_cards_type
  ON public.magic_cards (type);

CREATE INDEX IF NOT EXISTS idx_magic_cards_category
  ON public.magic_cards (category);

CREATE INDEX IF NOT EXISTS idx_magic_cards_subcategory
  ON public.magic_cards (subcategory);

CREATE INDEX IF NOT EXISTS idx_magic_cards_franchise
  ON public.magic_cards (franchise);

CREATE INDEX IF NOT EXISTS idx_magic_cards_brand
  ON public.magic_cards (brand);

CREATE INDEX IF NOT EXISTS idx_magic_cards_updated_at
  ON public.magic_cards (updated_at DESC);

DROP TRIGGER IF EXISTS set_magic_cards_row_updated_at ON public.magic_cards;
CREATE TRIGGER set_magic_cards_row_updated_at
BEFORE UPDATE ON public.magic_cards
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.magic_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'magic_cards'
      AND policyname = 'magic_cards_read'
  ) THEN
    CREATE POLICY magic_cards_read
      ON public.magic_cards
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'magic_cards'
      AND policyname = 'magic_cards_write_platform_admin'
  ) THEN
    CREATE POLICY magic_cards_write_platform_admin
      ON public.magic_cards
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_tier::text = 'platform_admin'
        )
      );
  END IF;
END
$$;
