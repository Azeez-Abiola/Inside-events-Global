-- =====================================================================
-- Automated Matchmaking Engine (TAB 19) — Version 1.2 / engine work
--
-- "Automated scoring, human release": candidates are scored and ranked
-- automatically, but nothing reaches a user until Admin approves it in the
-- Match Approval Queue (§19.3A). Users never see each other's profiles or
-- contact details; an approved match arrives as a notification and a
-- facilitated meeting (§19.5A).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.match_queue_status AS ENUM ('pending', 'approved', 'rejected', 'deferred');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Scores (one row per candidate pair) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.match_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_type      TEXT NOT NULL,
  -- The listing or profile being matched: an event, or an account.
  subject_kind      TEXT NOT NULL CHECK (subject_kind IN ('event', 'account')),
  subject_id        UUID NOT NULL,
  subject_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_role      TEXT NOT NULL,
  candidate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_role    TEXT NOT NULL,
  base_score        SMALLINT NOT NULL,
  secondary_score   SMALLINT NOT NULL,
  composite_score   SMALLINT NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
  queue_status      public.match_queue_status NOT NULL DEFAULT 'pending',
  -- Set when Admin hand-made the match rather than the algorithm (§19.7).
  created_manually_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  -- What each side is told once approved: never a name, figure or contact.
  user_summary_for_subject   TEXT,
  user_summary_for_candidate TEXT,
  why_user_text     TEXT,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent_at TIMESTAMPTZ,
  UNIQUE (pairing_type, subject_id, candidate_user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_queue ON public.match_scores(queue_status, composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_subject_user ON public.match_scores(subject_user_id, queue_status);
CREATE INDEX IF NOT EXISTS idx_match_scores_candidate_user ON public.match_scores(candidate_user_id, queue_status);

-- ─── Explanations (the "Why" behind every score, §19.3 step 5) ───────────────

CREATE TABLE IF NOT EXISTS public.match_explanations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id            UUID NOT NULL REFERENCES public.match_scores(id) ON DELETE CASCADE,
  field_name          TEXT NOT NULL,
  is_primary          BOOLEAN NOT NULL,
  field_value_subject TEXT,
  field_value_candidate TEXT,
  contribution_weight NUMERIC(6,2) NOT NULL,
  internal_display_text TEXT NOT NULL,
  user_facing_display_text TEXT,
  -- Admin's Adjust action can drop a field from the user-facing Why line.
  shown_to_users      BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_match_explanations_match ON public.match_explanations(match_id);

-- ─── Facilitated meetings (§19.5A) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meeting_bookings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id             UUID NOT NULL UNIQUE REFERENCES public.match_scores(id) ON DELETE CASCADE,
  -- Times IGE offers; each side picks one and the first agreed slot wins.
  proposed_slots       TIMESTAMPTZ[] NOT NULL DEFAULT '{}',
  subject_choice       TIMESTAMPTZ,
  candidate_choice     TIMESTAMPTZ,
  scheduled_at         TIMESTAMPTZ,
  -- A call link IGE controls, so neither side exposes a personal calendar.
  video_call_url       TEXT,
  booked_by_subject_at   TIMESTAMPTZ,
  booked_by_candidate_at TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'awaiting_booking'
                         CHECK (status IN ('awaiting_booking', 'booked', 'held', 'no_show', 'cancelled')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Weights (configuration, not code — §19.4) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.match_weight_config (
  pairing_type     TEXT PRIMARY KEY,
  primary_weight   SMALLINT NOT NULL CHECK (primary_weight BETWEEN 0 AND 100),
  secondary_weight SMALLINT NOT NULL CHECK (secondary_weight BETWEEN 0 AND 100),
  threshold        SMALLINT NOT NULL DEFAULT 55 CHECK (threshold BETWEEN 0 AND 100),
  last_updated_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (primary_weight + secondary_weight = 100)
);

INSERT INTO public.match_weight_config (pairing_type, primary_weight, secondary_weight) VALUES
  ('organiser_sponsor', 65, 35),
  ('referral_event', 55, 45),
  ('pro_event', 55, 45),
  ('media_event', 60, 40),
  ('creative_sponsor', 60, 40),
  ('service_booking', 70, 30)
ON CONFLICT (pairing_type) DO NOTHING;

-- "A user can ask Admin to pause their profile from future matching" (§19.10).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS matching_paused BOOLEAN NOT NULL DEFAULT false;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Users never read these tables directly: approved matches reach them through
-- a server function that returns only the non-sensitive summary (§19.5).

ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_weight_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['match_scores','match_explanations','meeting_bookings','match_weight_config'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admin only %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "admin only %1$s" ON public.%1$I
        FOR ALL TO authenticated
        USING (public.is_admin(auth.uid()))
        WITH CHECK (public.is_admin(auth.uid()))
    $f$, t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
