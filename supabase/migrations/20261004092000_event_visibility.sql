-- =====================================================================
-- Event visibility and Looking to connect with (TAB 3 §3.6.1 Section B,
-- v6.3/v6.4; Version 1.1 Section A)
--
-- "Private - workspace only (not on the marketplace, not vetted) · Published
--  to the marketplace. Publishing goes to Admin vetting. A private event can
--  be published later from My Events."
--
-- Existing rows default to 'published' because every event on the platform
-- today was created to be listed. Defaulting to 'private' would silently pull
-- live listings off the marketplace.
-- =====================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'published'
    CHECK (visibility IN ('private', 'published'));

COMMENT ON COLUMN public.events.visibility IS
  'private = workspace only, never vetted, never on the marketplace. published = goes to Admin vetting, then live.';

-- Which IGE user types the owner wants this event to reach. Required when
-- published; a private owner chooses them at the point of publishing.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS looking_to_connect_with TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.looking_to_connect_with IS
  'Subset of organiser | sponsor | media_partner | referral_partner | partnerships_pro | creative_hub. Shown as labels on the event card (TAB 1 §1.5).';

-- Free text per selected user type, e.g. "Media partner to deliver a
-- 60-second highlight video". Kept as JSON keyed by user type.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS connection_notes JSONB NOT NULL DEFAULT '{}';

-- Forward Events Calendar opt-in (TAB 4 §4.4.1). The calendar itself ships in
-- Version 1.1 Section B; capturing the answer now means no backfill later.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS open_to_cocreation BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_connect_with ON public.events USING GIN (looking_to_connect_with);

-- ─── Keep private events off every public surface ─────────────────────────────
-- The existing policy grants SELECT to anon on any approved/listed row. A
-- private event must never satisfy it, whatever its status says.
DROP POLICY IF EXISTS "public view live events" ON public.events;
CREATE POLICY "public view live events" ON public.events
  FOR SELECT USING (status IN ('approved','listed') AND visibility = 'published');

-- A private event is a workspace tool, not a submission, so its owner can edit
-- it at any status. Published events keep the pre-vetting-only rule.
DROP POLICY IF EXISTS "organiser update own drafts" ON public.events;
CREATE POLICY "organiser update own drafts" ON public.events
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = organiser_id
    AND (visibility = 'private' OR status IN ('draft','submitted','revision_requested'))
  )
  WITH CHECK (auth.uid() = organiser_id);

-- Owners can delete a private event outright; published ones still only as drafts.
DROP POLICY IF EXISTS "organiser delete own drafts" ON public.events;
CREATE POLICY "organiser delete own drafts" ON public.events
  FOR DELETE TO authenticated
  USING (auth.uid() = organiser_id AND (visibility = 'private' OR status = 'draft'));
