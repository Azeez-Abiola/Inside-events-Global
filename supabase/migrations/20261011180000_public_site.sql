-- =====================================================================
-- Public site: featured windows, Past Events, Upcoming IGE Featured Events,
-- Instagram feed cache (TAB 1 §1.5A–1.5D, TAB 6 §6.1A/6.1C, TAB 12 §12.1A)
-- =====================================================================

-- ─── Featured Events (§6.1A) ────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS featured_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feature_expires_at   TIMESTAMPTZ;

-- ─── Past Events (§1.5C) ────────────────────────────────────────────────────
-- "An event moves here automatically the moment its event date passes."
-- approved_live → past is one directional and date driven (TAB 3 §3.3).
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check CHECK (status IN (
  'draft','submitted','under_review','revision_requested','approved','listed',
  'closed','archived','rejected','past'
));

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS moved_to_past_at TIMESTAMPTZ,
  -- "This event has concluded, view the next edition" (§1.5C).
  ADD COLUMN IF NOT EXISTS next_edition_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_past ON public.events (status, end_date DESC) WHERE status = 'past';

-- The archive is public: anyone may read past, published events.
DROP POLICY IF EXISTS "public view past events" ON public.events;
CREATE POLICY "public view past events" ON public.events
  FOR SELECT USING (status = 'past' AND visibility = 'published');

-- ─── Upcoming IGE Featured Events for the home page (§1.5D, §6.1C) ──────────
CREATE TABLE IF NOT EXISTS public.upcoming_home_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  starts_at        TIMESTAMPTZ NOT NULL,
  city             TEXT,             -- null or 'Virtual'
  cover_image_url  TEXT NOT NULL,
  description      TEXT NOT NULL,
  luma_url         TEXT NOT NULL,
  -- Drives the card label. Client events must be labelled as such so a
  -- visitor never reads the placement as IGE vetting (TAB 21 §21.5.6).
  source           TEXT NOT NULL CHECK (source IN ('ige_abw', 'retainer_client')),
  client_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  marketplace_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  display_order    SMALLINT NOT NULL DEFAULT 0,
  publish_from     TIMESTAMPTZ,
  publish_to       TIMESTAMPTZ,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upcoming_home_events ON public.upcoming_home_events (display_order, starts_at);

ALTER TABLE public.upcoming_home_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone reads upcoming home events" ON public.upcoming_home_events;
CREATE POLICY "anyone reads upcoming home events" ON public.upcoming_home_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manages upcoming home events" ON public.upcoming_home_events;
CREATE POLICY "admin manages upcoming home events" ON public.upcoming_home_events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.upcoming_home_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.upcoming_home_events TO authenticated;
GRANT ALL ON public.upcoming_home_events TO service_role;

-- ─── Instagram feed cache (§1.5B, §12.1A) ───────────────────────────────────
-- Refreshed by the scheduled job so the home page never calls Instagram on a
-- visitor's page load.
CREATE TABLE IF NOT EXISTS public.instagram_feed_cache (
  id          TEXT PRIMARY KEY,          -- Instagram media id
  permalink   TEXT NOT NULL,
  media_url   TEXT NOT NULL,
  caption     TEXT,
  posted_at   TIMESTAMPTZ,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_feed_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone reads instagram cache" ON public.instagram_feed_cache;
CREATE POLICY "anyone reads instagram cache" ON public.instagram_feed_cache FOR SELECT USING (true);
GRANT SELECT ON public.instagram_feed_cache TO anon, authenticated;
GRANT ALL ON public.instagram_feed_cache TO service_role;
