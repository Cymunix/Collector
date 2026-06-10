-- CollectorsHub: People/roles and minifigure linkage for catalog items.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.catalog_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_person_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_item_people (
  item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.catalog_people(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.catalog_person_roles(id) ON DELETE RESTRICT,
  credit_order integer NOT NULL DEFAULT 0,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, person_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.catalog_minifigures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  theme text,
  identifier text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_item_minifigures (
  item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  minifigure_id uuid NOT NULL REFERENCES public.catalog_minifigures(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, minifigure_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_people_is_active
  ON public.catalog_people (is_active);

CREATE INDEX IF NOT EXISTS idx_catalog_item_people_item_id
  ON public.catalog_item_people (item_id);

CREATE INDEX IF NOT EXISTS idx_catalog_item_people_person_id
  ON public.catalog_item_people (person_id);

CREATE INDEX IF NOT EXISTS idx_catalog_item_people_role_id
  ON public.catalog_item_people (role_id);

CREATE INDEX IF NOT EXISTS idx_catalog_minifigures_is_active
  ON public.catalog_minifigures (is_active);

CREATE INDEX IF NOT EXISTS idx_catalog_minifigures_identifier
  ON public.catalog_minifigures (identifier);

CREATE INDEX IF NOT EXISTS idx_catalog_item_minifigures_item_id
  ON public.catalog_item_minifigures (item_id);

CREATE INDEX IF NOT EXISTS idx_catalog_item_minifigures_minifigure_id
  ON public.catalog_item_minifigures (minifigure_id);

DROP TRIGGER IF EXISTS set_catalog_people_updated_at ON public.catalog_people;
CREATE TRIGGER set_catalog_people_updated_at
BEFORE UPDATE ON public.catalog_people
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_person_roles_updated_at ON public.catalog_person_roles;
CREATE TRIGGER set_catalog_person_roles_updated_at
BEFORE UPDATE ON public.catalog_person_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_item_people_updated_at ON public.catalog_item_people;
CREATE TRIGGER set_catalog_item_people_updated_at
BEFORE UPDATE ON public.catalog_item_people
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_minifigures_updated_at ON public.catalog_minifigures;
CREATE TRIGGER set_catalog_minifigures_updated_at
BEFORE UPDATE ON public.catalog_minifigures
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_catalog_item_minifigures_updated_at ON public.catalog_item_minifigures;
CREATE TRIGGER set_catalog_item_minifigures_updated_at
BEFORE UPDATE ON public.catalog_item_minifigures
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

INSERT INTO public.catalog_person_roles (code, label, sort_order)
VALUES
  ('actor', 'Actor', 10),
  ('director', 'Director', 20),
  ('artist', 'Artist', 30),
  ('writer', 'Writer', 40)
ON CONFLICT (code) DO UPDATE
SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

ALTER TABLE public.catalog_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_person_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_item_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_minifigures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_item_minifigures ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_people'
      AND policyname = 'catalog_people_read'
  ) THEN
    CREATE POLICY catalog_people_read
      ON public.catalog_people
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_person_roles'
      AND policyname = 'catalog_person_roles_read'
  ) THEN
    CREATE POLICY catalog_person_roles_read
      ON public.catalog_person_roles
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_item_people'
      AND policyname = 'catalog_item_people_read'
  ) THEN
    CREATE POLICY catalog_item_people_read
      ON public.catalog_item_people
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_minifigures'
      AND policyname = 'catalog_minifigures_read'
  ) THEN
    CREATE POLICY catalog_minifigures_read
      ON public.catalog_minifigures
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_item_minifigures'
      AND policyname = 'catalog_item_minifigures_read'
  ) THEN
    CREATE POLICY catalog_item_minifigures_read
      ON public.catalog_item_minifigures
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'catalog_people'
      AND policyname = 'catalog_people_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_people_write_platform_admin
      ON public.catalog_people
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
      AND tablename = 'catalog_person_roles'
      AND policyname = 'catalog_person_roles_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_person_roles_write_platform_admin
      ON public.catalog_person_roles
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
      AND tablename = 'catalog_item_people'
      AND policyname = 'catalog_item_people_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_item_people_write_platform_admin
      ON public.catalog_item_people
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
      AND tablename = 'catalog_minifigures'
      AND policyname = 'catalog_minifigures_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_minifigures_write_platform_admin
      ON public.catalog_minifigures
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
      AND tablename = 'catalog_item_minifigures'
      AND policyname = 'catalog_item_minifigures_write_platform_admin'
  ) THEN
    CREATE POLICY catalog_item_minifigures_write_platform_admin
      ON public.catalog_item_minifigures
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

CREATE OR REPLACE FUNCTION public.replace_catalog_item_people(
  p_item_id uuid,
  p_people jsonb DEFAULT '[]'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_is_platform_admin boolean;
  v_person_entry record;
  v_role_entry record;
  v_person_id uuid;
  v_role_id uuid;
  v_person_name text;
  v_person_slug text;
  v_role_label text;
  v_role_code text;
  v_roles jsonb;
  v_inserted_count integer := 0;
BEGIN
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'item_id is required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor_id
      AND p.subscription_tier::text = 'platform_admin'
  ) INTO v_is_platform_admin;

  IF NOT COALESCE(v_is_platform_admin, false) THEN
    RAISE EXCEPTION 'Only platform admins can manage catalog item people.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.catalog_items i WHERE i.id = p_item_id) THEN
    RAISE EXCEPTION 'Catalog item not found for supplied item_id.';
  END IF;

  DELETE FROM public.catalog_item_people
  WHERE item_id = p_item_id;

  FOR v_person_entry IN
    SELECT value, ordinality
    FROM jsonb_array_elements(COALESCE(p_people, '[]'::jsonb)) WITH ORDINALITY AS t(value, ordinality)
  LOOP
    IF jsonb_typeof(v_person_entry.value) <> 'object' THEN
      CONTINUE;
    END IF;

    v_person_name := NULLIF(trim(v_person_entry.value->>'name'), '');
    IF v_person_name IS NULL THEN
      CONTINUE;
    END IF;

    v_person_slug := public.catalog_slugify(v_person_name);
    IF v_person_slug = '' THEN
      CONTINUE;
    END IF;

    INSERT INTO public.catalog_people (name, slug, metadata, is_active, created_by)
    VALUES (
      v_person_name,
      v_person_slug,
      CASE
        WHEN jsonb_typeof(COALESCE(v_person_entry.value->'metadata', '{}'::jsonb)) = 'object'
          THEN COALESCE(v_person_entry.value->'metadata', '{}'::jsonb)
        ELSE '{}'::jsonb
      END,
      true,
      v_actor_id
    )
    ON CONFLICT (slug) DO UPDATE
    SET
      name = EXCLUDED.name,
      metadata = COALESCE(public.catalog_people.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
      is_active = true,
      updated_at = now()
    RETURNING id INTO v_person_id;

    v_roles := v_person_entry.value->'roles';

    IF jsonb_typeof(v_roles) = 'array' AND jsonb_array_length(v_roles) > 0 THEN
      FOR v_role_entry IN
        SELECT value
        FROM jsonb_array_elements(v_roles)
      LOOP
        IF jsonb_typeof(v_role_entry.value) <> 'string' THEN
          CONTINUE;
        END IF;

        v_role_label := NULLIF(trim(both '"' from v_role_entry.value::text), '');
        IF v_role_label IS NULL THEN
          CONTINUE;
        END IF;

        v_role_code := public.catalog_slugify(v_role_label);
        IF v_role_code = '' THEN
          CONTINUE;
        END IF;

        INSERT INTO public.catalog_person_roles (code, label, sort_order, is_active)
        VALUES (v_role_code, initcap(replace(v_role_code, '-', ' ')), 100, true)
        ON CONFLICT (code) DO UPDATE
        SET
          label = EXCLUDED.label,
          is_active = true,
          updated_at = now()
        RETURNING id INTO v_role_id;

        INSERT INTO public.catalog_item_people (
          item_id,
          person_id,
          role_id,
          credit_order,
          notes,
          metadata,
          created_by
        )
        VALUES (
          p_item_id,
          v_person_id,
          v_role_id,
          GREATEST(v_person_entry.ordinality::integer - 1, 0),
          NULLIF(trim(v_person_entry.value->>'notes'), ''),
          CASE
            WHEN jsonb_typeof(COALESCE(v_person_entry.value->'item_metadata', '{}'::jsonb)) = 'object'
              THEN COALESCE(v_person_entry.value->'item_metadata', '{}'::jsonb)
            ELSE '{}'::jsonb
          END,
          v_actor_id
        )
        ON CONFLICT (item_id, person_id, role_id) DO UPDATE
        SET
          credit_order = EXCLUDED.credit_order,
          notes = EXCLUDED.notes,
          metadata = EXCLUDED.metadata,
          updated_at = now();

        v_inserted_count := v_inserted_count + 1;
      END LOOP;
    ELSE
      v_role_label := NULLIF(trim(COALESCE(v_person_entry.value->>'role', '')), '');
      IF v_role_label IS NULL THEN
        CONTINUE;
      END IF;

      v_role_code := public.catalog_slugify(v_role_label);
      IF v_role_code = '' THEN
        CONTINUE;
      END IF;

      INSERT INTO public.catalog_person_roles (code, label, sort_order, is_active)
      VALUES (v_role_code, initcap(replace(v_role_code, '-', ' ')), 100, true)
      ON CONFLICT (code) DO UPDATE
      SET
        label = EXCLUDED.label,
        is_active = true,
        updated_at = now()
      RETURNING id INTO v_role_id;

      INSERT INTO public.catalog_item_people (
        item_id,
        person_id,
        role_id,
        credit_order,
        notes,
        metadata,
        created_by
      )
      VALUES (
        p_item_id,
        v_person_id,
        v_role_id,
        GREATEST(v_person_entry.ordinality::integer - 1, 0),
        NULLIF(trim(v_person_entry.value->>'notes'), ''),
        CASE
          WHEN jsonb_typeof(COALESCE(v_person_entry.value->'item_metadata', '{}'::jsonb)) = 'object'
            THEN COALESCE(v_person_entry.value->'item_metadata', '{}'::jsonb)
          ELSE '{}'::jsonb
        END,
        v_actor_id
      )
      ON CONFLICT (item_id, person_id, role_id) DO UPDATE
      SET
        credit_order = EXCLUDED.credit_order,
        notes = EXCLUDED.notes,
        metadata = EXCLUDED.metadata,
        updated_at = now();

      v_inserted_count := v_inserted_count + 1;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_catalog_item_minifigures(
  p_item_id uuid,
  p_minifigures jsonb DEFAULT '[]'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_is_platform_admin boolean;
  v_entry record;
  v_minifigure_id uuid;
  v_minifigure_name text;
  v_minifigure_slug text;
  v_quantity integer;
  v_inserted_count integer := 0;
BEGIN
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'item_id is required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor_id
      AND p.subscription_tier::text = 'platform_admin'
  ) INTO v_is_platform_admin;

  IF NOT COALESCE(v_is_platform_admin, false) THEN
    RAISE EXCEPTION 'Only platform admins can manage catalog item minifigures.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.catalog_items i WHERE i.id = p_item_id) THEN
    RAISE EXCEPTION 'Catalog item not found for supplied item_id.';
  END IF;

  DELETE FROM public.catalog_item_minifigures
  WHERE item_id = p_item_id;

  FOR v_entry IN
    SELECT value, ordinality
    FROM jsonb_array_elements(COALESCE(p_minifigures, '[]'::jsonb)) WITH ORDINALITY AS t(value, ordinality)
  LOOP
    IF jsonb_typeof(v_entry.value) <> 'object' THEN
      CONTINUE;
    END IF;

    v_minifigure_name := NULLIF(trim(v_entry.value->>'name'), '');
    IF v_minifigure_name IS NULL THEN
      CONTINUE;
    END IF;

    v_minifigure_slug := public.catalog_slugify(v_minifigure_name);
    IF v_minifigure_slug = '' THEN
      CONTINUE;
    END IF;

    v_quantity := CASE
      WHEN COALESCE(v_entry.value->>'quantity', '') ~ '^[0-9]+$'
        THEN GREATEST((v_entry.value->>'quantity')::integer, 1)
      ELSE 1
    END;

    INSERT INTO public.catalog_minifigures (
      name,
      slug,
      theme,
      identifier,
      metadata,
      is_active,
      created_by
    )
    VALUES (
      v_minifigure_name,
      v_minifigure_slug,
      NULLIF(trim(v_entry.value->>'theme'), ''),
      NULLIF(trim(v_entry.value->>'identifier'), ''),
      CASE
        WHEN jsonb_typeof(COALESCE(v_entry.value->'metadata', '{}'::jsonb)) = 'object'
          THEN COALESCE(v_entry.value->'metadata', '{}'::jsonb)
        ELSE '{}'::jsonb
      END,
      true,
      v_actor_id
    )
    ON CONFLICT (slug) DO UPDATE
    SET
      name = EXCLUDED.name,
      theme = EXCLUDED.theme,
      identifier = EXCLUDED.identifier,
      metadata = COALESCE(public.catalog_minifigures.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
      is_active = true,
      updated_at = now()
    RETURNING id INTO v_minifigure_id;

    INSERT INTO public.catalog_item_minifigures (
      item_id,
      minifigure_id,
      quantity,
      notes,
      metadata,
      created_by
    )
    VALUES (
      p_item_id,
      v_minifigure_id,
      v_quantity,
      NULLIF(trim(v_entry.value->>'notes'), ''),
      CASE
        WHEN jsonb_typeof(COALESCE(v_entry.value->'item_metadata', '{}'::jsonb)) = 'object'
          THEN COALESCE(v_entry.value->'item_metadata', '{}'::jsonb)
        ELSE '{}'::jsonb
      END,
      v_actor_id
    )
    ON CONFLICT (item_id, minifigure_id) DO UPDATE
    SET
      quantity = EXCLUDED.quantity,
      notes = EXCLUDED.notes,
      metadata = EXCLUDED.metadata,
      updated_at = now();

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_catalog_item_people(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_catalog_item_minifigures(uuid, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.replace_catalog_item_people(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_catalog_item_minifigures(uuid, jsonb) TO authenticated;
