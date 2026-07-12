-- Theme (franchise) context panel: metadata + community analytics.
-- Powers the catalog right-hand Context panel when a single theme is selected.

-- Optional hand-curated logo/hero image for a theme. When null the app falls
-- back to a representative item image returned by get_theme_stats().
ALTER TABLE public.franchises ADD COLUMN IF NOT EXISTS logo_url text;

-- Aggregate community stats for one theme. SECURITY DEFINER so it can read
-- across all users' collections; only aggregate/representative data is exposed.
CREATE OR REPLACE FUNCTION public.get_theme_stats(p_franchise_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH theme_items AS (
  -- items has no name column; derive a display name from the linked subject.
  SELECT i.item_id,
         COALESCE(s.subject_name, i.description, i.lego_set_number, 'Item') AS name,
         i.release_year, i.market_price, i.image_path,
         b.name AS brand_name
  FROM public.items i
  LEFT JOIN public.brands   b ON b.brand_id   = i.brand_id
  LEFT JOIN public.subjects s ON s.subject_id = i.subject_id
  WHERE i.franchise_id = p_franchise_id
),
owners AS (
  SELECT oc.catalog_item_id, oc.user_id
  FROM public.owned_copies oc
  JOIN theme_items ti ON ti.item_id = oc.catalog_item_id
),
item_owner_counts AS (
  SELECT ti.item_id, ti.name, ti.brand_name,
         COUNT(DISTINCT o.user_id) AS owners
  FROM theme_items ti
  LEFT JOIN owners o ON o.catalog_item_id = ti.item_id
  GROUP BY ti.item_id, ti.name, ti.brand_name
),
wish_counts AS (
  SELECT ti.item_id, ti.name, COUNT(DISTINCT wi.user_id) AS wishers
  FROM theme_items ti
  LEFT JOIN public.wishlist_items wi ON wi.catalog_item_id = ti.item_id
  GROUP BY ti.item_id, ti.name
),
user_completion AS (
  SELECT o.user_id,
         COUNT(DISTINCT o.catalog_item_id)::numeric
           / NULLIF((SELECT COUNT(*) FROM theme_items), 0) AS pct
  FROM owners o
  GROUP BY o.user_id
),
total_users AS (SELECT COUNT(*) AS n FROM public.profiles)
SELECT jsonb_build_object(
  'total_items',   (SELECT COUNT(*) FROM theme_items),
  'release_year',  (SELECT MIN(release_year) FROM theme_items),
  'total_value',   (SELECT COALESCE(SUM(market_price), 0) FROM theme_items),
  'image_path',    (SELECT image_path FROM theme_items
                      WHERE image_path IS NOT NULL
                      ORDER BY market_price DESC NULLS LAST LIMIT 1),
  'owner_pct',     (SELECT CASE WHEN (SELECT n FROM total_users) = 0 THEN 0
                      ELSE ROUND(100.0 * COUNT(DISTINCT user_id)
                        / (SELECT n FROM total_users)) END
                      FROM owners),
  'avg_completion',(SELECT ROUND(100.0 * COALESCE(AVG(pct), 0)) FROM user_completion),
  'most_collected',(SELECT jsonb_build_object('name', name, 'count', owners)
                      FROM item_owner_counts
                      WHERE owners > 0 AND brand_name = 'Sets'
                      ORDER BY owners DESC, name LIMIT 1),
  'rarest',        (SELECT jsonb_build_object('name', name, 'count', owners)
                      FROM item_owner_counts
                      WHERE owners > 0
                      ORDER BY owners ASC, name LIMIT 1),
  'most_wishlisted',(SELECT jsonb_build_object('name', name, 'count', wishers)
                      FROM wish_counts
                      WHERE wishers > 0
                      ORDER BY wishers DESC, name LIMIT 1),
  'most_valuable', (SELECT jsonb_build_object('name', name, 'value', market_price)
                      FROM theme_items
                      WHERE market_price IS NOT NULL
                      ORDER BY market_price DESC, name LIMIT 1)
);
$$;

GRANT EXECUTE ON FUNCTION public.get_theme_stats(uuid) TO anon, authenticated;
