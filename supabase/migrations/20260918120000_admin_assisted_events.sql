-- =====================================================================
-- Admin-assisted event listings
--
-- During launch an organiser may reach out before they ever sign up. An
-- admin builds the listing for them, but the event is still owned by the
-- organiser's own account from the moment it is created: organiser_id is
-- the thread that getMyEvents, the edit guards, deals and deal
-- notifications all hang off, so parking a listing under the admin (or
-- under no one) would misroute every downstream inquiry and payout.
--
-- created_by_admin records provenance only. It never replaces ownership.
-- =====================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.created_by_admin IS
  'The admin who created this listing on an organiser''s behalf. organiser_id still points at the organiser who owns it. NULL for self-serve listings.';

CREATE INDEX IF NOT EXISTS idx_events_created_by_admin
  ON public.events (created_by_admin)
  WHERE created_by_admin IS NOT NULL;

-- When the claim invite was last emailed to an admin-created account.
-- profiles.last_login_at stays NULL until they actually claim it, so the
-- pair distinguishes "not invited yet" from "invited, not claimed".
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.invite_sent_at IS
  'When an admin last emailed this account its claim invite. NULL for self-serve signups.';

-- Admins already hold "admins view all events" (SELECT) and
-- "admins update any event" (UPDATE) on public.events, plus
-- "admins manage all tiers" on public.event_sponsorship_tiers, so editing
-- an assisted listing needs no new policy. INSERT stays organiser-only —
-- admin creation goes through the service role, which records
-- created_by_admin and audits the action.
