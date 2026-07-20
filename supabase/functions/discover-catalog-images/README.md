# discover-catalog-images edge function

Brave Search image-discovery provider for the admin **Manage Images** system. The
"Find Images" button invokes this function; it verifies the caller is a
`platform_admin` **server-side**, builds a product query from the catalogue item's
taxonomy, calls the **Brave Image Search API**, scores + saves candidates into
`image_candidates`, and records the run in `image_search_jobs`.

## Prerequisites

1. **Migrations applied** (image_candidates / image_search_jobs / item_images
   columns + the discovery fields):
   - `20260718_images_step1_extend_item_images.sql`
   - `20260718_images_step2_candidates_and_jobs.sql`
   - `20260718_images_step3_storage_policies.sql`
   - `20260718_images_step4_discovery_fields.sql`
2. **Brave Search API** subscription with the **Image Search** endpoint available
   on your plan (https://api-dashboard.search.brave.com/).

## Secret

```
BRAVE_SEARCH_API_KEY    # Brave Search API subscription token
```

Set it in Supabase → **Edge Functions → Secrets**. `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically. The
token is only read via `Deno.env.get(...)` and sent to Brave in the
`X-Subscription-Token` header — never returned to the browser.

## Deploy

```bash
supabase functions deploy discover-catalog-images
```
After changing the secret, **redeploy** (or restart) so the function picks up the
new value.

## Request / response

Request body: `{ "item_id": "<uuid>", "override": true }`
- `override: true` (the Find Images button) searches even if the item has images.
- `override` omitted/false = automatic pipeline: only searches items with ZERO
  images, else returns `{ status: "already_has_images" }`.

Response `status`: `ok` | `no_candidates` | `already_has_images` | `error`.

## Provider details

- Endpoint: `GET https://api.search.brave.com/res/v1/images/search`
- Auth header: `X-Subscription-Token: <BRAVE_SEARCH_API_KEY>`
- Params: `q` (built query), `count=10`, `safesearch=strict`.
- Result mapping: image → `properties.url`, thumb → `thumbnail.src`, source page →
  `url`, source name/domain → `source` / `meta_url.hostname`.

## How the query is built

Priority fields, blanks + placeholder tokens (`baseline`, `sets`, `minifigs`, …)
dropped, duplicate parts removed, joined in this order:

`subcategory(manufacturer) · franchise · subfranchise · product line · series · manufacturer id · item name · description · subjects`

Example: `LEGO Atlantis 7985 City of Atlantis`.

## Scoring

Raw points (not a normalised %). A signal counts when its value appears in the
result title/source-page/domain; name/description use token-majority matching.
Weights (`SCORING` in index.ts): barcode +100, manufacturer_id +100, item_name +40,
product_line +25, description +20, series +15, manufacturer +15, franchise +10.
`match_reasons` is an array of matched `{field, value, points}` (what the UI renders);
extra fields (width/height/title/domain) go in `image_candidates.metadata`.

## Notes

- Candidates are external URLs only — nothing is downloaded/hosted yet.
- Rejected candidates are never recreated (`ignoreDuplicates` on `item_id,image_url`).
- Never logs the Brave token.
- Swapping providers touches only the fetch + normalisation block in `index.ts`;
  the auth, eligibility, query builder, scoring and persistence are provider-agnostic.
