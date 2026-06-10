-- CollectorsHub: Admin class helpers for store authorization.
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION public.get_admin_class(
  p_user_id uuid DEFAULT auth.uid(),
  p_store_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_is_store_owner boolean := false;
  v_is_store_admin boolean := false;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 'none';
  END IF;

  IF p_store_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.id = p_store_id
        AND s.owner_user_id = p_user_id
    )
    INTO v_is_store_owner;

    SELECT EXISTS (
      SELECT 1
      FROM public.store_employees se
      WHERE se.store_id = p_store_id
        AND se.auth_user_id = p_user_id
        AND se.status IN ('active', 'invited')
        AND (
          lower(COALESCE(se.role, '')) IN ('owner', 'manager', 'admin')
          OR COALESCE(se.action_permissions, se.permissions, '{}'::jsonb) ->> 'store_settings' = 'true'
        )
    )
    INTO v_is_store_admin;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.owner_user_id = p_user_id
    )
    INTO v_is_store_owner;

    SELECT EXISTS (
      SELECT 1
      FROM public.store_employees se
      WHERE se.auth_user_id = p_user_id
        AND se.status IN ('active', 'invited')
        AND (
          lower(COALESCE(se.role, '')) IN ('owner', 'manager', 'admin')
          OR COALESCE(se.action_permissions, se.permissions, '{}'::jsonb) ->> 'store_settings' = 'true'
        )
    )
    INTO v_is_store_admin;
  END IF;

  IF v_is_store_owner THEN
    RETURN 'store_owner';
  END IF;

  IF v_is_store_admin THEN
    RETURN 'store_admin';
  END IF;

  RETURN 'none';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_store_admin(
  p_store_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_admin_class(p_user_id, p_store_id) IN ('store_owner', 'store_admin');
$$;

REVOKE ALL ON FUNCTION public.get_admin_class(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_store_admin(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_admin_class(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_admin(uuid, uuid) TO authenticated;
