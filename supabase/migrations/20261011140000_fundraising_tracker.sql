-- =====================================================================
-- Fundraising Tracker (TAB 4 §4.2 Module 1) — Section C
--
-- "At event submission, the organiser sets a sponsorship target (the portion
--  of the event budget covered via sponsorship, distinct from ticket revenue
--  or self-funding). The Fundraising Tracker then shows, at all times, target
--  minus committed minus paid, with a visual countdown tied to the event date."
--
-- Tier fill reads the existing event_sponsorship_tiers (slots_total,
-- slots_remaining), so only the target is new. Organisers and every other
-- non-sponsor role can use it; Brand / Sponsor accounts use the Marketing
-- Budget instead (v6.3).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.event_funding_targets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount >= 0),
  currency       TEXT NOT NULL DEFAULT 'NGN',
  -- Aggregate fill may be shown to prospective sponsors, by organiser opt-in
  -- only (TAB 4 §4.3 Cross-Role Visibility Rules).
  show_fill_to_sponsors BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_funding_targets_owner ON public.event_funding_targets(owner_id);

ALTER TABLE public.event_funding_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner manages funding target" ON public.event_funding_targets;
CREATE POLICY "owner manages funding target" ON public.event_funding_targets
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_funding_targets TO authenticated;
GRANT ALL ON public.event_funding_targets TO service_role;
