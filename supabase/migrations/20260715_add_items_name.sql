-- Give items a real name/title, decoupled from Subjects.
--
-- WHY: the catalogue's "Item" (e.g. "City of Atlantis", a LEGO set) is the item's
-- own name — not a Subject. Historically item display names were faked by creating
-- a Subject row from the set/item name. The taxonomy now treats Item as the
-- name/title, and Subjects as an independent, optional dimension. This column is
-- the home for the Item column on import and in Single Item creation.
--
-- Additive + reversible; no existing data is changed.

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS name text;

-- ── Down migration ────────────────────────────────────────────────────────────
-- ALTER TABLE public.items DROP COLUMN IF EXISTS name;
