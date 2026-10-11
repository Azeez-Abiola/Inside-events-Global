-- =====================================================================
-- Private event share links (TAB 4 §4.4.5, confirmed v6.4) — Section B
--
-- "The owner of a private event can generate a view-only link and send it to
--  sponsors or partners. The link opens a summary page. To see the full
--  details or to express interest, the viewer signs in or signs up as a
--  Brand / Sponsor, and the interest goes to Admin like any other match. The
--  owner can switch a link off at any time, set an expiry date, and see how
--  many times it has been opened."
--
-- One link per event. Regenerating swaps the token, which kills every copy of
-- the old one already in someone's inbox.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.event_share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  -- Unguessable: 32 random bytes, URL-safe.
  token       TEXT NOT NULL UNIQUE,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  expires_at  TIMESTAMPTZ,
  view_count  INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_share_links_token ON public.event_share_links(token);

-- Counting a view must not need a read-modify-write from the app.
CREATE OR REPLACE FUNCTION public.record_share_link_view(_token TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.event_share_links
     SET view_count = view_count + 1, last_viewed_at = now()
   WHERE token = _token;
$$;

REVOKE ALL ON FUNCTION public.record_share_link_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_share_link_view(TEXT) TO service_role;

ALTER TABLE public.event_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner reads share link" ON public.event_share_links;
CREATE POLICY "owner reads share link" ON public.event_share_links
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organiser_id = auth.uid())
  );

GRANT SELECT ON public.event_share_links TO authenticated;
GRANT ALL ON public.event_share_links TO service_role;
