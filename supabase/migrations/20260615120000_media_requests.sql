-- ============================================================
-- MEDIA REQUESTS — media/documentary partners request coverage
-- or press credentials for an event (PRD §5.5).
-- ============================================================
CREATE TABLE public.media_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID REFERENCES public.events(id) ON DELETE CASCADE,
  media_partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type     TEXT NOT NULL DEFAULT 'coverage'
                     CHECK (request_type IN ('coverage', 'press_credentials', 'content')),
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'declined')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, media_partner_id, request_type)
);

GRANT SELECT, INSERT, UPDATE ON public.media_requests TO authenticated;
GRANT ALL ON public.media_requests TO service_role;

ALTER TABLE public.media_requests ENABLE ROW LEVEL SECURITY;

-- Media partners manage their own requests.
CREATE POLICY "media manage own requests" ON public.media_requests
  FOR ALL TO authenticated
  USING (auth.uid() = media_partner_id)
  WITH CHECK (auth.uid() = media_partner_id);

-- Organisers can see requests for events they own.
CREATE POLICY "organiser view requests on own events" ON public.media_requests
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = media_requests.event_id AND e.organiser_id = auth.uid()));

-- Admins manage everything.
CREATE POLICY "admins manage media requests" ON public.media_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_media_requests_updated BEFORE UPDATE ON public.media_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_media_requests_partner ON public.media_requests (media_partner_id, created_at DESC);
CREATE INDEX idx_media_requests_event ON public.media_requests (event_id);
