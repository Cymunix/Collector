// Edge Function: find-images
//
// Provider integration for the Manage Images discovery pipeline. Called by the
// admin "Find Images" button. It:
//   1. Authenticates the caller from their JWT and verifies platform_admin
//      SERVER-SIDE (the UI gate is not the security boundary).
//   2. Runs a Google Programmable Search (Custom Search JSON API, image mode)
//      using the prioritised query built from the item's taxonomy.
//   3. Scores each result against the same weights the app uses and inserts
//      image_candidates rows (deduped on item_id+image_url so rejected/duplicate
//      candidates are never re-suggested).
//   4. Updates the image_search_jobs row it was handed.
//
// Secrets required (set with `supabase secrets set ...`):
//   GOOGLE_API_KEY   – Google Cloud API key with "Custom Search API" enabled
//   GOOGLE_CSE_ID    – Programmable Search Engine ID (cx), Image search ON
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected by
// the platform automatically — do not set them manually.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Mirror of the app's IMAGE_MATCH_SCORING. This is the source of truth for the
// scores that get STORED; keep the two in sync if you change the weights.
const SCORING: Record<string, number> = {
  barcode: 100,
  manufacturer_id: 100,
  item_name: 40,
  product_line: 25,
  series: 15,
  manufacturer: 15,
  franchise: 10,
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Term = { key: string; value: string; weightKey: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID");

    // 1. Who is calling? (JWT from the invoking client.)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Not authenticated" }, 401);

    // 2. Server-side admin check.
    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: prof } = await admin.from("profiles").select("subscription_tier").eq("id", user.id).single();
    if ((prof?.subscription_tier as string) !== "platform_admin") return json({ error: "Admin only" }, 403);

    const { item_id, job_id, metadata } = await req.json().catch(() => ({}));
    if (!item_id) return json({ error: "item_id is required" }, 400);

    const finishJob = async (patch: Record<string, unknown>) => {
      if (job_id) await admin.from("image_search_jobs").update({ completed_at: new Date().toISOString(), ...patch }).eq("id", job_id);
    };

    if (job_id) await admin.from("image_search_jobs").update({ status: "searching", started_at: new Date().toISOString() }).eq("id", job_id);

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      await finishJob({ status: "error", error_message: "GOOGLE_API_KEY / GOOGLE_CSE_ID not configured on the function." });
      return json({ error: "Image provider is not configured. Set GOOGLE_API_KEY and GOOGLE_CSE_ID." }, 200);
    }

    const terms: Term[] = Array.isArray(metadata?.terms) ? metadata.terms : [];
    const query = String(metadata?.query ?? "").trim();
    if (!query) {
      await finishJob({ status: "no_candidates", candidates_found: 0, error_message: "No query could be built from the item." });
      return json({ candidates_found: 0, note: "No query built from item taxonomy." });
    }

    // 3. Google Programmable Search (image mode). num max is 10.
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", GOOGLE_API_KEY);
    url.searchParams.set("cx", GOOGLE_CSE_ID);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", "8");
    url.searchParams.set("safe", "active");

    const resp = await fetch(url.toString());
    const body = await resp.json();
    if (!resp.ok) {
      const msg = body?.error?.message || `Google API error ${resp.status}`;
      await finishJob({ status: "error", error_message: msg });
      return json({ error: msg }, 200);
    }

    const results: any[] = Array.isArray(body.items) ? body.items : [];

    // 4. Score each result. We can only infer a "match" from the result's text,
    //    so a term counts if its value appears in the title/snippet/context.
    const rows = results.map((it) => {
      const hay = `${it.title ?? ""} ${it.snippet ?? ""} ${it.image?.contextLink ?? ""} ${it.displayLink ?? ""}`.toLowerCase();
      const reasons = terms
        .filter((t) => t.value && hay.includes(String(t.value).toLowerCase()))
        .map((t) => ({ field: t.key, value: t.value, points: SCORING[t.weightKey] ?? 0 }));
      const score = reasons.reduce((s, r) => s + r.points, 0);
      return {
        item_id,
        search_job_id: job_id ?? null,
        image_url: it.link,
        thumb_url: it.image?.thumbnailLink ?? null,
        source_url: it.image?.contextLink ?? it.link,
        source_name: it.displayLink ?? "Google",
        external_product_id: null,
        match_score: score,
        match_reasons: reasons,
        status: "pending",
      };
    }).filter((r) => r.image_url);

    let inserted = 0;
    if (rows.length) {
      // ignoreDuplicates keeps rejected/known candidates from being re-suggested
      // (unique on item_id, image_url).
      const { data, error } = await admin
        .from("image_candidates")
        .upsert(rows, { onConflict: "item_id,image_url", ignoreDuplicates: true })
        .select("id");
      if (error) {
        await finishJob({ status: "error", error_message: error.message });
        return json({ error: error.message }, 200);
      }
      inserted = data?.length ?? 0;
    }

    await finishJob({ status: inserted ? "candidates_found" : "no_candidates", candidates_found: inserted });
    return json({ candidates_found: inserted, results_returned: results.length });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
