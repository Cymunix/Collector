-- CollectorsHub: Catalog taxonomy and items.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.catalog_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_subcategories_category_slug_unique UNIQUE (category_id, slug),
  CONSTRAINT catalog_subcategories_id_category_unique UNIQUE (id, category_id)
);

CREATE TABLE IF NOT EXISTS public.catalog_franchises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  subcategory_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_franchises_subcategory_slug_unique UNIQUE (subcategory_id, slug),
  CONSTRAINT catalog_franchises_id_subcategory_category_unique UNIQUE (id, subcategory_id, category_id),
  CONSTRAINT catalog_franchises_subcategory_category_fk FOREIGN KEY (subcategory_id, category_id)
    REFERENCES public.catalog_subcategories(id, category_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  subcategory_id uuid NOT NULL,
  franchise_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  release_year integer CHECK (release_year IS NULL OR (release_year >= 1800 AND release_year <= 2200)),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_items_franchise_slug_unique UNIQUE (franchise_id, slug),
  CONSTRAINT catalog_items_subcategory_category_fk FOREIGN KEY (subcategory_id, category_id)
    REFERENCES public.catalog_subcategories(id, category_id)
    ON DELETE RESTRICT,
  CONSTRAINT catalog_items_franchise_subcategory_category_fk FOREIGN KEY (franchise_id, subcategory_id, category_id)
    REFERENCES public.catalog_franchises(id, subcategory_id, category_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_catalog_subcategories_category_id
  ON public.catalog_subcategories (category_id);

CREATE INDEX IF NOT EXISTS idx_catalog_franchises_category_id
  ON public.catalog_franchises (category_id);

CREATE INDEX IF NOT EXISTS idx_catalog_franchises_subcategory_id
  ON public.catalog_franchises (subcategory_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_category_id
  ON public.catalog_items (category_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_subcategory_id
  ON public.catalog_items (subcategory_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_franchise_id
  ON public.catalog_items (franchise_id);

CREATE INDEX IF NOT EXISTS idx_catalog_items_release_year
  ON public.catalog_items (release_year);

CREATE INDEX IF NOT EXISTS idx_catalog_items_is_active
  ON public.catalog_items (is_active);

DROP TRIGGER IF EXISTS set_catalog_categories_updated_at ON public.catalog_categories;
CREATE TRIGGER set_catalog_categories_updated_at
BEFORE UPDATE ON public.catalog_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_subcategories_updated_at ON public.catalog_subcategories;
CREATE TRIGGER set_catalog_subcategories_updated_at
BEFORE UPDATE ON public.catalog_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_franchises_updated_at ON public.catalog_franchises;
CREATE TRIGGER set_catalog_franchises_updated_at
BEFORE UPDATE ON public.catalog_franchises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER set_catalog_items_updated_at
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_categories'
      AND policyname = 'catalog_categories_read'
  ) THEN
    CREATE POLICY catalog_categories_read
      ON public.catalog_categories
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_subcategories'
      AND policyname = 'catalog_subcategories_read'
  ) THEN
    CREATE POLICY catalog_subcategories_read
      ON public.catalog_subcategories
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_franchises'
      AND policyname = 'catalog_franchises_read'
  ) THEN
    CREATE POLICY catalog_franchises_read
      ON public.catalog_franchises
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_items'
      AND policyname = 'catalog_items_read'
  ) THEN
    CREATE POLICY catalog_items_read
      ON public.catalog_items
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_categories'
      AND policyname = 'catalog_categories_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_categories_write_platform_admin
      ON public.catalog_categories
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_subcategories'
      AND policyname = 'catalog_subcategories_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_subcategories_write_platform_admin
      ON public.catalog_subcategories
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_franchises'
      AND policyname = 'catalog_franchises_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_franchises_write_platform_admin
      ON public.catalog_franchises
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_items'
      AND policyname = 'catalog_items_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_items_write_platform_admin
      ON public.catalog_items
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

INSERT INTO public.catalog_categories (name, slug, sort_order)
VALUES
  ('Trading Cards', 'trading-cards', 10),
  ('Sports Cards', 'sports-cards', 20),
  ('Comics', 'comics', 30),
  ('Music', 'music', 40),
  ('Movies', 'movies', 50),
  ('Building Blocks', 'building-blocks', 60),
  ('Video Games', 'video-games', 70)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

WITH subcategory_seed(category_slug, name, slug, sort_order) AS (
  VALUES
    ('trading-cards', 'Pokemon', 'pokemon', 10),
    ('trading-cards', 'Yu-Gi-Oh!', 'yugioh', 20),
    ('trading-cards', 'Magic: The Gathering', 'magic-the-gathering', 30),
    ('trading-cards', 'One Piece', 'one-piece', 40),
    ('trading-cards', 'Digimon', 'digimon', 50),

    ('sports-cards', 'Hockey', 'hockey', 10),
    ('sports-cards', 'Basketball', 'basketball', 20),
    ('sports-cards', 'Baseball', 'baseball', 30),
    ('sports-cards', 'Football', 'football', 40),
    ('sports-cards', 'Soccer', 'soccer', 50),
    ('sports-cards', 'UFC', 'ufc', 60),

    ('comics', 'Marvel', 'marvel', 10),
    ('comics', 'DC', 'dc', 20),
    ('comics', 'Manga', 'manga', 30),
    ('comics', 'Indie', 'indie', 40),

    ('music', 'Vinyl', 'vinyl', 10),
    ('music', 'CDs', 'cds', 20),
    ('music', 'Cassette Tapes', 'cassette-tapes', 30),

    ('movies', 'Blu-ray', 'bluray', 10),
    ('movies', 'DVD', 'dvd', 20),
    ('movies', 'VHS', 'vhs', 30),
    ('movies', 'Steelbooks', 'steelbooks', 40),

    ('building-blocks', 'LEGO', 'lego', 10),
    ('building-blocks', 'Mega Construx', 'mega-construx', 20),
    ('building-blocks', 'Minifigures', 'minifigures', 30),

    ('video-games', 'PlayStation', 'playstation', 10),
    ('video-games', 'Xbox', 'xbox', 20),
    ('video-games', 'Nintendo', 'nintendo', 30),
    ('video-games', 'PC', 'pc', 40),
    ('video-games', 'Retro', 'retro', 50)
)
INSERT INTO public.catalog_subcategories (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.sort_order
FROM subcategory_seed s
JOIN public.catalog_categories c ON c.slug = s.category_slug
ON CONFLICT (category_id, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
