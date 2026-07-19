// Edge Function: discover-catalog-images
//
// Brave Search image-discovery provider for the admin Manage Images system. Flow:
//   admin clicks Find Images → frontend invokes this function with { item_id }
//   → verify authenticated user is platform_admin (server-side)
//   → load the catalogue item + taxonomy names
//   → eligibility: only auto-search items with ZERO images (manual = override)
//   → build ONE strong product query from the item's data
//   → call the Brave Image Search API
//   → normalise + score results, dedupe, skip previously-rejected
//   → insert image_candidates, record the image_search_jobs row
//   → return the candidates for review
//
// Secrets (Deno.env.get — never sent to the browser):
//   BRAVE_SEARCH_API_KEY  (Brave Search API subscription token)
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROVIDER = "brave_image_search";

// Configurable scoring weights (raw points; NOT a normalised percentage). Change
// here without touching call sites. Mirrors the concept documented in the app.
const SCORING: Record<string, number> = {
  barcode: 100,          // exact UPC/EAN appears in the result
  manufacturer_id: 100,  // exact set number / minifig code / bricklink id
  item_name: 40,         // item name tokens present
  description: 20,       // description / variant tokens present
  product_line: 25,
  series: 15,
  franchise: 10,
  manufacturer: 15,      // subcategory (LEGO/Funko/Topps…) present
};

// Generic placeholder tokens that are data artefacts, not descriptive search
// terms. Dropped from the query so "series: Baseline" / "brand: Sets" don't
// pollute it. Tunable.
const SKIP_TERMS = new Set([
  "baseline", "sets", "set", "minifigs", "minifig", "minifigures",
  "miscellaneous", "misc", "non lego", "no label (self release)",
  "unknown", "n/a", "na", "other", "various", "general",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const clean = (v: unknown) => (v == null ? "" : String(v)).trim();

// ── Query builder ────────────────────────────────────────────────────────────
// Assembles a natural product query from the strongest available fields, in a
// fixed order, dropping blanks / placeholders / duplicate parts.
//   e.g. LEGO Atlantis 7985 City of Atlantis
function buildQuery(input: {
  subcategory?: string; franchise?: string; subfranchise?: string;
  productLine?: string; series?: string; manufacturerId?: string;
  name?: string; description?: string; subjects?: string[];
}) {
  const orderedParts: Array<[string, string]> = [
    ["manufacturer", clean(input.subcategory)],
    ["franchise", clean(input.franchise)],
    ["subfranchise", clean(input.subfranchise)],
    ["product_line", clean(input.productLine)],
    ["series", clean(input.series)],
    ["manufacturer_id", clean(input.manufacturerId)],
    ["item_name", clean(input.name)],
    ["description", clean(input.description)],
    ["subjects", (input.subjects || []).map(clean).filter(Boolean).join(" ")],
  ];
  const used: string[] = [];
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const [field, value] of orderedParts) {
    if (!value) continue;
    const lc = value.toLowerCase();
    if (SKIP_TERMS.has(lc)) continue;      // drop placeholder tokens
    if (seen.has(lc)) continue;             // drop duplicate parts
    seen.add(lc);
    parts.push(value);
    used.push(field);
  }
  const query = parts.join(" ").replace(/\s+/g, " ").trim();
  return { query, usedFields: used };
}

// ── Scoring ──────────────────────────────────────────────────────────────────
// A term counts if its value appears in the result's title/snippet/context/domain.
// Returns { score, reasons } — reasons is an array (what the app UI renders).
function scoreResult(haystack: string, signals: Array<{ field: string; value: string; weightKey: string }>) {
  const hay = haystack.toLowerCase();
  const reasons: Array<{ field: string; value: string; points: number; matched: boolean }> = [];
  let score = 0;
  for (const s of signals) {
    const v = clean(s.value).toLowerCase();
    if (!v) continue;
    let matched = false;
    if (s.weightKey === "item_name" || s.weightKey === "description") {
      // token-based: majority of significant words present
      const tokens = v.split(/\s+/).filter((t) => t.length > 2);
      if (tokens.length) {
        const hits = tokens.filter((t) => hay.includes(t)).length;
        matched = hits >= Math.ceil(tokens.length / 2);
      }
    } else {
      matched = hay.includes(v);
    }
    if (matched) {
      const pts = SCORING[s.weightKey] || 0;
      score += pts;
      reasons.push({ field: s.field, value: s.value, points: pts, matched: true });
    }
  }
  return { score, reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const BRAVE_KEY = Deno.env.get("BRAVE_SEARCH_API_KEY");

  const admin = createClient(SUPABASE_URL, SERVICE);
  let jobId: string | null = null;

  try {
    // 1. Authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ status: "error", error: "Not authenticated" }, 401);

    // 2. Admin check (existing platform_admin role on profiles)
    const { data: prof } = await admin.from("profiles").select("subscription_tier").eq("id", user.id).single();
    if ((prof?.subscription_tier as string) !== "platform_admin") {
      return json({ status: "error", error: "Admin only" }, 403);
    }

    // 3. Input
    const { item_id, override } = await req.json().catch(() => ({}));
    if (!item_id) return json({ status: "error", error: "item_id is required" }, 400);

    // 4. Load item + taxonomy names
    const { data: item, error: itemErr } = await admin
      .from("items")
      .select("item_id, name, description, upc, lego_set_number, minifig_code, bricklink_id, rebrickable_fig_id, release_year, category_id, subcategory_id, franchise_id, subset_id, series_id, brand_id, subject_id")
      .eq("item_id", item_id).single();
    if (itemErr || !item) return json({ status: "error", error: "Catalogue item not found" }, 404);

    const nameOf = async (table: string, pk: string, id: string | null, col = "name") => {
      if (!id) return "";
      const { data } = await admin.from(table).select(col).eq(pk, id).maybeSingle();
      return clean((data as Record<string, unknown> | null)?.[col]);
    };
    const [subcategory, franchise, subfranchise, series, subjectPrimary] = await Promise.all([
      nameOf("subcategories", "subcategory_id", item.subcategory_id),
      nameOf("franchises", "franchise_id", item.franchise_id),
      nameOf("subsets", "subset_id", item.subset_id),
      nameOf("series", "series_id", item.series_id),
      nameOf("subjects", "subject_id", item.subject_id, "subject_name"),
    ]);
    // product line(s) via join
    let productLine = "";
    const { data: iplRows } = await admin.from("item_product_lines").select("product_line_id").eq("item_id", item_id);
    if (iplRows?.length) {
      const { data: plRows } = await admin.from("product_lines").select("name").in("product_line_id", iplRows.map((r) => r.product_line_id));
      productLine = (plRows || []).map((r) => clean(r.name)).filter(Boolean).join(" ");
    }
    // additional subjects (e.g. minifig characters) beyond the primary
    const { data: isRows } = await admin.from("item_subjects").select("subjects(subject_name)").eq("item_id", item_id);
    const subjectNames = Array.from(new Set(
      [subjectPrimary, ...((isRows || []).map((r: any) => clean(r.subjects?.subject_name)))].filter(Boolean),
    ));

    // 5. Eligibility — only auto-search zero-image items; manual = override
    const { count: imageCount } = await admin.from("item_images").select("item_image_id", { count: "exact", head: true }).eq("item_id", item_id);
    if ((imageCount ?? 0) > 0 && !override) {
      return json({ status: "already_has_images", images: imageCount, message: "Item already has images; automatic discovery not required." });
    }

    // 6. Build query
    const manufacturerId = clean(item.lego_set_number) || clean(item.minifig_code) || clean(item.bricklink_id) || clean(item.rebrickable_fig_id);
    const { query, usedFields } = buildQuery({
      subcategory, franchise, subfranchise, productLine, series,
      manufacturerId, name: item.name, description: item.description, subjects: subjectNames,
    });
    if (!query) return json({ status: "error", error: "Not enough catalogue data to build a search query." }, 200);

    // Record the job (provider + query stored for debugging)
    const searchMetadata = { provider: PROVIDER, query, used_fields: usedFields, franchise, subcategory, series, product_line: productLine };
    const { data: job } = await admin.from("image_search_jobs").insert({
      item_id, status: "searching", trigger: override ? "manual" : "missing_items_action",
      provider: PROVIDER, query, search_metadata: searchMetadata, started_at: new Date().toISOString(), created_by: user.id,
    }).select("id").single();
    jobId = job?.id ?? null;

    // 7. Missing-secret guard (distinct, actionable)
    if (!BRAVE_KEY) {
      if (jobId) await admin.from("image_search_jobs").update({ status: "error", error_message: "Missing secret: BRAVE_SEARCH_API_KEY", completed_at: new Date().toISOString() }).eq("id", jobId);
      return json({ status: "error", error: "Image provider not configured — missing secret: BRAVE_SEARCH_API_KEY" }, 200);
    }

    // 8. Brave Image Search API. Query is URL-encoded by URLSearchParams; the
    //    subscription token goes in the X-Subscription-Token header (never a param).
    const bUrl = new URL("https://api.search.brave.com/res/v1/images/search");
    bUrl.search = new URLSearchParams({ q: query, count: "10", safesearch: "strict" }).toString();

    const resp = await fetch(bUrl.toString(), {
      headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_KEY },
    });
    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      // Distinguish common Brave failures (never log the token). Brave error body:
      // { type:"ErrorResponse", error:{ code, detail, status, meta } }
      const be = body?.error || {};
      const detail = clean(be.detail) || clean(be.code) || `Brave API error ${resp.status}`;
      let hint = "";
      if (resp.status === 401 || resp.status === 403 || /subscription|token|unauthor/i.test(`${be.code} ${detail}`)) {
        hint = "Invalid or missing BRAVE_SEARCH_API_KEY (check the token and that your Brave plan includes Image Search). ";
      } else if (resp.status === 429 || /rate|quota|limit/i.test(`${be.code} ${detail}`)) {
        hint = "Brave Search rate limit / quota exceeded — try again shortly. ";
      } else if (resp.status === 422) {
        hint = "Brave rejected the query parameters. ";
      }
      const msg = `${hint}${detail}`.trim();
      if (jobId) await admin.from("image_search_jobs").update({ status: "error", error_message: msg, completed_at: new Date().toISOString() }).eq("id", jobId);
      return json({ status: "error", error: msg, provider_status: resp.status }, 200);
    }

    const results: any[] = Array.isArray(body.results) ? body.results : [];

    // 9. Existing candidates for this item — dedupe + never recreate rejected
    const { data: existing } = await admin.from("image_candidates").select("image_url, source_url, status").eq("item_id", item_id);
    const seenImage = new Set((existing || []).map((c) => clean(c.image_url).toLowerCase()));
    const seenSource = new Set((existing || []).map((c) => clean(c.source_url).toLowerCase()).filter(Boolean));

    const signals = [
      { field: "barcode", value: clean(item.upc), weightKey: "barcode" },
      { field: "manufacturer_id", value: manufacturerId, weightKey: "manufacturer_id" },
      { field: "item_name", value: clean(item.name), weightKey: "item_name" },
      { field: "description", value: clean(item.description), weightKey: "description" },
      { field: "product_line", value: productLine, weightKey: "product_line" },
      { field: "series", value: SKIP_TERMS.has(series.toLowerCase()) ? "" : series, weightKey: "series" },
      { field: "franchise", value: franchise, weightKey: "franchise" },
      { field: "manufacturer", value: subcategory, weightKey: "manufacturer" },
    ];

    // 10. Normalise + score + dedupe. Brave image result shape:
    //   { title, url (source page), source, thumbnail:{src}, properties:{url,width,height},
    //     meta_url:{hostname,netloc} }
    const rows: any[] = [];
    for (const it of results) {
      const imageUrl = clean(it.properties?.url) || clean(it.thumbnail?.src);
      if (!imageUrl) continue;
      const sourceUrl = clean(it.url) || imageUrl;
      const domain = clean(it.source) || clean(it.meta_url?.hostname) || clean(it.meta_url?.netloc);
      const key = imageUrl.toLowerCase();
      if (seenImage.has(key)) continue;                       // already a candidate (incl. rejected)
      if (sourceUrl && seenSource.has(sourceUrl.toLowerCase())) continue;
      seenImage.add(key);
      if (sourceUrl) seenSource.add(sourceUrl.toLowerCase());

      const haystack = `${it.title ?? ""} ${sourceUrl} ${domain}`;
      const { score, reasons } = scoreResult(haystack, signals);

      rows.push({
        item_id, search_job_id: jobId, image_url: imageUrl,
        thumb_url: clean(it.thumbnail?.src) || null,
        source_url: sourceUrl || null,
        source_name: domain || "Brave",
        external_product_id: null,
        match_score: score,
        match_reasons: reasons,
        status: "pending",
        metadata: {
          width: it.properties?.width ?? null, height: it.properties?.height ?? null,
          mime: null,
          title: clean(it.title) || null, snippet: null,
          source_domain: domain || null,
        },
      });
    }

    let inserted: any[] = [];
    if (rows.length) {
      const { data, error } = await admin
        .from("image_candidates")
        .upsert(rows, { onConflict: "item_id,image_url", ignoreDuplicates: true })
        .select("id, image_url, thumb_url, source_url, source_name, match_score, match_reasons, status");
      if (error) {
        if (jobId) await admin.from("image_search_jobs").update({ status: "error", error_message: error.message, completed_at: new Date().toISOString() }).eq("id", jobId);
        return json({ status: "error", error: `Database error saving candidates: ${error.message}` }, 200);
      }
      inserted = data || [];
    }

    // 11. Finish job + return
    const finalStatus = inserted.length ? "candidates_found" : "no_candidates";
    if (jobId) await admin.from("image_search_jobs").update({ status: finalStatus, candidates_found: inserted.length, completed_at: new Date().toISOString() }).eq("id", jobId);

    return json({
      status: inserted.length ? "ok" : "no_candidates",
      query, candidates_found: inserted.length, results_returned: results.length,
      candidates: inserted,
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (jobId) await admin.from("image_search_jobs").update({ status: "error", error_message: msg, completed_at: new Date().toISOString() }).eq("id", jobId);
    return json({ status: "error", error: msg }, 500);
  }
});
