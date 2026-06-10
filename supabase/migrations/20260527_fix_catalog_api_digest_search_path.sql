-- Fix: create_catalog_item_via_api used digest() while search_path was pinned to public,
-- which can hide pgcrypto in Supabase (extensions schema).
-- Ensure extensions is included in function search_path.

ALTER FUNCTION public.create_catalog_item_via_api(
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  jsonb,
  text,
  jsonb,
  jsonb,
  jsonb
)
SET search_path = public, extensions;
