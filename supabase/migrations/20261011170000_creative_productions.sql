-- =====================================================================
-- Creative Hub productions and brand placement (TAB 5 §5.6, TAB 12 §12.1)
-- — Section C
--
-- "Production (owner_account_id, title, format, stage, release_window,
--  platforms, placement_opportunities[], amount_sought, currency,
--  listing_status)." Publishing a production for sponsorship sends it to the
-- Admin Vetting Queue like an event (TAB 3 §3.1 step 8); a private production
-- is the creator's own planning record.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.productions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  format             TEXT,
  stage              TEXT,
  logline            TEXT,
  release_window     TEXT,
  platforms          TEXT[] NOT NULL DEFAULT '{}',
  target_markets     TEXT[] NOT NULL DEFAULT '{}',
  amount_sought      NUMERIC(14,2),
  currency           TEXT NOT NULL DEFAULT 'NGN',
  cover_image_url    TEXT,
  -- Private: visible to Admin only until a match is approved (TAB 3 §3.6.6 D).
  pitch_deck_url     TEXT,
  visibility         TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'published')),
  looking_to_connect_with TEXT[] NOT NULL DEFAULT '{sponsor}',
  listing_status     TEXT NOT NULL DEFAULT 'draft'
                       CHECK (listing_status IN ('draft','submitted','under_review','approved_live','rejected','changes_requested','past')),
  reviewer_notes     TEXT,
  reviewed_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  submitted_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productions_owner ON public.productions(owner_id);
CREATE INDEX IF NOT EXISTS idx_productions_live ON public.productions(listing_status, visibility);

-- One row per placement opportunity inside a production.
CREATE TABLE IF NOT EXISTS public.production_placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id   UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(14,2),
  currency        TEXT NOT NULL DEFAULT 'NGN',
  slots_total     SMALLINT NOT NULL DEFAULT 1 CHECK (slots_total >= 0),
  slots_filled    SMALLINT NOT NULL DEFAULT 0 CHECK (slots_filled >= 0),
  -- What has been promised to the brand and the proof it was delivered.
  brand_label     TEXT,
  deliverable_due DATE,
  proof_url       TEXT,
  delivered_at    TIMESTAMPTZ,
  position        SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_placements ON public.production_placements(production_id, position);

ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner or admin manages productions" ON public.productions;
CREATE POLICY "owner or admin manages productions" ON public.productions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "owner or admin manages placements" ON public.production_placements;
CREATE POLICY "owner or admin manages placements" ON public.production_placements
  FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.productions p WHERE p.id = production_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.productions p WHERE p.id = production_id AND p.owner_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.productions, public.production_placements TO authenticated;
GRANT ALL ON public.productions, public.production_placements TO service_role;
