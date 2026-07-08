-- CollectorsHub: Species table for character subjects.
-- A species is franchise-scoped (Star Wars Wookiees ≠ some other franchise's "Wookiees").
-- subjects.species_id is nullable — only characters need a species.
-- Safe to re-run (idempotent).

CREATE TABLE IF NOT EXISTS public.species (
  species_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  franchise_id UUID        REFERENCES public.franchises (franchise_id) ON DELETE SET NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, franchise_id)
);

CREATE INDEX IF NOT EXISTS idx_species_franchise ON public.species (franchise_id);

ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'species' AND policyname = 'species_read'
  ) THEN
    CREATE POLICY species_read ON public.species FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'species' AND policyname = 'species_write'
  ) THEN
    CREATE POLICY species_write ON public.species FOR ALL TO authenticated
      USING   (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'));
  END IF;
END; $$;

-- Add species_id to subjects (nullable — only characters need this)
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS species_id UUID REFERENCES public.species (species_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subjects_species ON public.subjects (species_id) WHERE species_id IS NOT NULL;

-- ── Down migration ─────────────────────────────────────────────────────────────
-- ALTER TABLE public.subjects DROP COLUMN IF EXISTS species_id;
-- DROP TABLE IF EXISTS public.species;
