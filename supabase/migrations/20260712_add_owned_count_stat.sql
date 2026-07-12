-- Add total owned count to the catalog market-stats RPC.
--   available_count — copies listed for sale/trade on CollectorsHub
--   wanted_count    — users who have the item in a wishlist
--   owned_count     — total copies owned across all users (any sale_status)
--
-- Adding a column to RETURNS TABLE changes the function signature, so the old
-- definition must be dropped first (CREATE OR REPLACE can't alter return type).

DROP FUNCTION IF EXISTS public.get_item_market_stats(uuid[]);

CREATE FUNCTION public.get_item_market_stats(item_ids uuid[])
RETURNS TABLE(catalog_item_id uuid, available_count bigint, wanted_count bigint, owned_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ids.id                                                                      AS catalog_item_id,
    COUNT(DISTINCT oc.id) FILTER (WHERE oc.sale_status IN ('listed', 'trade')) AS available_count,
    COUNT(DISTINCT wi.user_id)                                                  AS wanted_count,
    COUNT(DISTINCT oc.id)                                                        AS owned_count
  FROM unnest(item_ids) AS ids(id)
  LEFT JOIN public.owned_copies   oc ON oc.catalog_item_id = ids.id
  LEFT JOIN public.wishlist_items wi ON wi.catalog_item_id = ids.id
  GROUP BY ids.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_item_market_stats(uuid[]) TO authenticated;
