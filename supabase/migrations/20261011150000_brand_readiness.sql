-- =====================================================================
-- Brand-Readiness Score + AI Coaching Feed (TAB 4 §4.2 Module 3) — Section C
--
-- "A running score tied to the Brand-Readiness Framework, with AI-generated
--  daily fixes, free for every organiser … outputs are suggestions, never a
--  vetting decision."
--
-- readiness_scores keeps history so the weekly delta ("up 6 points this
-- week") and the 14/30-day dormancy rules can be worked out.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  composite_score  SMALLINT NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
  dimension_scores JSONB NOT NULL,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_event ON public.readiness_scores(event_id, computed_at DESC);

CREATE TABLE IF NOT EXISTS public.coaching_nudges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dimension    TEXT NOT NULL,
  message      TEXT NOT NULL,
  -- 'ai' when Claude wrote it, 'rules' for the built-in checklist.
  source       TEXT NOT NULL DEFAULT 'rules' CHECK (source IN ('ai', 'rules')),
  surfaced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coaching_nudges_event ON public.coaching_nudges(event_id, surfaced_at DESC);

-- Admin is told once when a score has sat still for 30+ days.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS readiness_dormancy_flagged_at TIMESTAMPTZ;

ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner or admin reads scores" ON public.readiness_scores;
CREATE POLICY "owner or admin reads scores" ON public.readiness_scores
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organiser_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner or admin reads nudges" ON public.coaching_nudges;
CREATE POLICY "owner or admin reads nudges" ON public.coaching_nudges
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organiser_id = auth.uid())
  );

GRANT SELECT ON public.readiness_scores, public.coaching_nudges TO authenticated;
GRANT ALL ON public.readiness_scores, public.coaching_nudges TO service_role;
