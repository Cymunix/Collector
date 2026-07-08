-- CollectorsHub: LEGO minifig identity — code column, franchise abbreviations, property registry.
-- For LEGO, Franchise = Theme. The abbreviation lives on the franchise record directly.
-- Safe to re-run (all statements idempotent).

-- ── 1. minifig_code column on items ──────────────────────────────────────────
-- Format: THEME-PROPERTY-SHORTHAND-NN  (e.g. SW-AHSK-AHSO-01)
-- Human-facing identifier — NOT the PK; FKs never reference it.
-- Generated at mint time by the import script; never hand-typed.
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS minifig_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_minifig_code
  ON public.items (minifig_code)
  WHERE minifig_code IS NOT NULL;

-- ── 2. LEGO abbreviation on franchises ───────────────────────────────────────
-- For LEGO, franchise = theme. The abbreviation (SW, HP, NIN…) lives here.
-- Used as the THEME segment in minifig codes; also keys the property registry.
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS lego_abbreviation TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_franchises_lego_abbreviation
  ON public.franchises (lego_abbreviation)
  WHERE lego_abbreviation IS NOT NULL;

-- ── 3. Property registry ──────────────────────────────────────────────────────
-- Maps property abbreviations (EPIV, TCW, MAND…) to screen properties/subthemes.
-- theme_abbreviation joins to franchises.lego_abbreviation.
-- 'provisional' = auto-derived from subtheme name; needs human confirmation.
CREATE TABLE IF NOT EXISTS public.lego_property_registry (
  abbreviation       TEXT        PRIMARY KEY,
  theme_abbreviation TEXT        NOT NULL,  -- matches franchises.lego_abbreviation
  full_name          TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'confirmed'
                                 CHECK (status IN ('confirmed', 'provisional')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lego_property_theme
  ON public.lego_property_registry (theme_abbreviation);

ALTER TABLE public.lego_property_registry ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lego_property_registry' AND policyname = 'lego_property_registry_read'
  ) THEN
    CREATE POLICY lego_property_registry_read
      ON public.lego_property_registry FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lego_property_registry' AND policyname = 'lego_property_registry_write'
  ) THEN
    CREATE POLICY lego_property_registry_write
      ON public.lego_property_registry FOR ALL TO authenticated
      USING   (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'));
  END IF;
END; $$;

-- Seed known property entries.
-- theme_abbreviation values correspond to franchises.lego_abbreviation once seeded by the import script.
INSERT INTO public.lego_property_registry (abbreviation, theme_abbreviation, full_name, status)
VALUES
  -- Star Wars
  ('EPIV',   'SW', 'A New Hope',                    'confirmed'),
  ('EPV',    'SW', 'The Empire Strikes Back',        'confirmed'),
  ('EPVI',   'SW', 'Return of the Jedi',             'confirmed'),
  ('EPVII',  'SW', 'The Force Awakens',              'confirmed'),
  ('EPVIII', 'SW', 'The Last Jedi',                  'confirmed'),
  ('EPIX',   'SW', 'The Rise of Skywalker',          'confirmed'),
  ('TPM',    'SW', 'The Phantom Menace',              'confirmed'),
  ('AOTC',   'SW', 'Attack of the Clones',            'confirmed'),
  ('ROTS',   'SW', 'Revenge of the Sith',             'confirmed'),
  ('ROGUE',  'SW', 'Rogue One',                       'confirmed'),
  ('SOLO',   'SW', 'Solo: A Star Wars Story',         'confirmed'),
  ('TCW',    'SW', 'The Clone Wars',                  'confirmed'),
  ('REBLS',  'SW', 'Star Wars Rebels',                'confirmed'),
  ('MAND',   'SW', 'The Mandalorian',                 'confirmed'),
  ('AHSK',   'SW', 'Ahsoka',                          'confirmed'),
  ('BOBF',   'SW', 'The Book of Boba Fett',           'confirmed'),
  ('ANDOR',  'SW', 'Andor',                           'confirmed'),
  ('OBIW',   'SW', 'Obi-Wan Kenobi',                  'confirmed'),
  ('BADB',   'SW', 'The Bad Batch',                   'confirmed'),
  ('SKUL',   'SW', 'Skeleton Crew',                   'confirmed'),
  ('ACOL',   'SW', 'The Acolyte',                     'confirmed'),
  -- Harry Potter
  ('HPSS',   'HP', 'Sorcerer''s Stone',               'confirmed'),
  ('HPCOS',  'HP', 'Chamber of Secrets',              'confirmed'),
  ('HPPOA',  'HP', 'Prisoner of Azkaban',             'confirmed'),
  ('HPGOF',  'HP', 'Goblet of Fire',                  'confirmed'),
  ('HPOOTP', 'HP', 'Order of the Phoenix',            'confirmed'),
  ('HPHBP',  'HP', 'Half-Blood Prince',               'confirmed'),
  ('HPDH',   'HP', 'Deathly Hallows',                 'confirmed'),
  ('HPFB',   'HP', 'Fantastic Beasts',                'confirmed')
ON CONFLICT (abbreviation) DO NOTHING;

-- ── Down migration ─────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.lego_property_registry;
-- DROP INDEX IF EXISTS idx_franchises_lego_abbreviation;
-- ALTER TABLE public.franchises DROP COLUMN IF EXISTS lego_abbreviation;
-- DROP INDEX IF EXISTS idx_items_minifig_code;
-- ALTER TABLE public.items DROP COLUMN IF EXISTS minifig_code;
