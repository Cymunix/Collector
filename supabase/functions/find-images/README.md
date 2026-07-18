# find-images edge function

Powers the "Find Images" button in the admin **Manage Images** tab using Google
Programmable Search (Custom Search JSON API, image mode). Verifies the caller is a
`platform_admin` server-side, scores results against the app's image-match weights,
and inserts `image_candidates` rows for review.

## Prerequisites

1. **Apply the image migrations first** (in the Supabase SQL editor) — the function
   writes to `image_candidates` / `image_search_jobs`:
   - `supabase/migrations/20260718_images_step1_extend_item_images.sql`
   - `supabase/migrations/20260718_images_step2_candidates_and_jobs.sql`
   - `supabase/migrations/20260718_images_step3_storage_policies.sql`

2. **Create Google credentials**
   - Google Cloud console → enable **Custom Search API** → create an **API key** → `GOOGLE_API_KEY`.
   - Create a **Programmable Search Engine** at https://programmablesearchengine.google.com/ :
     - "Search the entire web" **ON**
     - **Image search** **ON**
     - Copy the **Search engine ID (cx)** → `GOOGLE_CSE_ID`.
   - Free tier is 100 queries/day; billing raises the cap.

## Deploy (from the repo root, with the Supabase CLI logged in)

```bash
# 1. set the provider secrets (SUPABASE_* are injected automatically — do NOT set them)
supabase secrets set GOOGLE_API_KEY=your_key GOOGLE_CSE_ID=your_cx

# 2. deploy the function
supabase functions deploy find-images
```

That's it — the in-app **Find Images** button (Manage Images tab) will now return
scored candidates. Without the secrets set, the function responds with
"Image provider is not configured" and the job is marked `error`.

## Notes / follow-ups

- Approved candidates currently store the remote Google image URL directly (same as
  "Add by URL"). Some hosts block hotlinking; a future improvement is to fetch the
  image and re-upload it into the `item-images` bucket on approval.
- Scoring weights are mirrored in `index.ts` (`SCORING`) and in the app
  (`IMAGE_MATCH_SCORING`). Keep them in sync if you change them.
- The eligibility rule (only auto-search zero-image items) is enforced by the app's
  queue; this manual button is a deliberate override and does not re-check.
