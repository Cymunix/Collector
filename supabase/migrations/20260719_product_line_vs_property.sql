-- Split the conflated "Product Line / Property" facet into TWO distinct levels.
--
-- WHY: the Toys taxonomy needs both, and they are different things:
--   Product Line = a commercial toy line owned by the manufacturer/publisher and
--                  often spanning franchises (Jazwares' "Micro Galaxy Squadron",
--                  Funko's "Mystery Minis"). Selected after a Franchise in the UI.
--   Property     = an IP sub-level under the Franchise ("Episode VI: Return of the
--                  Jedi", "Jurassic Park").
-- Until now a single `product_lines` table (UI-labelled "Property") carried both
-- meanings, so a sheet with both columns collapsed into one. Both `product_lines`
-- and `item_product_lines` are currently EMPTY, so this reshuffle moves no data.
--
-- End state:
--   properties / item_properties   → the Property level (new tables).
--   product_lines / item_product_lines → repurposed for the new Product Line level
--                                    (subcategory-owned, franchise-associated).

-- ── Property level (new) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  property_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  franchise_id uuid        REFERENCES public.franchises (franchise_id) ON DELETE CASCADE,
  subset_id    uuid        REFERENCES public.subsets (subset_id)       ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (franchise_id, name)
);
CREATE INDEX IF NOT EXISTS idx_properties_franchise ON public.properties (franchise_id);

CREATE TABLE IF NOT EXISTS public.item_properties (
  item_id     uuid NOT NULL REFERENCES public.items (item_id)          ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties (property_id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_item_properties_property ON public.item_properties (property_id);

-- ── Product Line level (repurpose the empty product_lines table) ─────────────
-- Owner is the subcategory (manufacturer/publisher); franchise_id (already present
-- from the earlier taxonomy step) is the franchise it's associated with for the
-- "pick a Franchise first" UI. Uniqueness moves to (subcategory_id, name).
ALTER TABLE public.product_lines
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.subcategories (subcategory_id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_product_lines_subcategory ON public.product_lines (subcategory_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_lines_subcategory_name
  ON public.product_lines (subcategory_id, name) WHERE subcategory_id IS NOT NULL;

-- ── RLS on the new Property tables (reads open, writes platform-admin) ────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['properties','item_properties'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_read') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t||'_read', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_write') THEN
      EXECUTE format($f$CREATE POLICY %I ON public.%I FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))
        WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.subscription_tier::text = 'platform_admin'))$f$, t||'_write', t);
    END IF;
  END LOOP;
END $$;

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.product_lines DROP COLUMN IF EXISTS subcategory_id;
-- DROP TABLE IF EXISTS public.item_properties;
-- DROP TABLE IF EXISTS public.properties;
