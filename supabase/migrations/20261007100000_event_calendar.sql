-- =====================================================================
-- Event Calendar and early co-creation (TAB 4 §4.4.1) — Section B
--
-- "Every user has an Event Calendar for planning ahead: their own events
--  (private and published), milestones, activations, follow-ups and meetings,
--  in month, quarter and 12-month views. It syncs one way to Google Calendar
--  and Outlook."
--
-- The calendar is a union, not a table: events, hand-added entries, CRM
-- follow-ups and meeting records all surface on it. Only the entries that have
-- nowhere else to live get a table of their own.
-- =====================================================================

-- ─── Planning status on events ───────────────────────────────────────────────
-- Distinct from `status`, which is the vetting lifecycle. An event can be
-- Confirmed in the owner's planning while still sitting in the vetting queue,
-- and collapsing the two would make one of them lie.

DO $$ BEGIN
  CREATE TYPE public.event_planning_status AS ENUM ('idea', 'planning', 'confirmed', 'live');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS planning_status public.event_planning_status NOT NULL DEFAULT 'planning';

COMMENT ON COLUMN public.events.planning_status IS
  'TAB 4 §4.4.1. Idea -> Planning -> Confirmed -> Live. The owner''s own planning state, independent of the Admin vetting status.';

-- Planned events are added far ahead, so a date is no longer required to exist.
ALTER TABLE public.events ALTER COLUMN start_date DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_planning ON public.events(planning_status, start_date);

-- ─── Calendar entries ────────────────────────────────────────────────────────
-- Milestones, activations and anything else the owner adds by hand. Follow-ups
-- and meetings are NOT duplicated here — they are read from the CRM, so a
-- follow-up date changed in one place cannot disagree with the other.

DO $$ BEGIN
  CREATE TYPE public.calendar_entry_type AS ENUM
    ('milestone', 'activation', 'task', 'meeting', 'reminder', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  entry_type   public.calendar_entry_type NOT NULL DEFAULT 'milestone',
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  all_day      BOOLEAN NOT NULL DEFAULT true,
  event_id     UUID REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id      UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  assignee_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes        TEXT,
  completed_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_range
  ON public.calendar_entries(workspace_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_event
  ON public.calendar_entries(event_id);

-- ─── Budget windows ──────────────────────────────────────────────────────────
-- "Brands can mark their own planning windows (for example annual budget
--  approval) on their calendar, and the Daily Deal-Flow Feed prioritises
--  forward events that fall inside those windows."

CREATE TABLE IF NOT EXISTS public.budget_windows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  starts_on    DATE NOT NULL,
  ends_on      DATE NOT NULL,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budget_window_order CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_budget_windows_range
  ON public.budget_windows(workspace_id, starts_on, ends_on);

-- ─── Co-creation interest ────────────────────────────────────────────────────
-- "A brand that wants to collaborate clicks 'Co-create this event'. This goes
--  to Admin as a co-creation interest, handled exactly like a sponsorship
--  interest: Admin reviews it and, if approved, notifies both sides with
--  meeting booking details. Users never contact each other directly."
--
-- Hence no column anywhere for the two parties to talk to each other. The
-- brand writes a note; Admin reads it; Admin decides.

DO $$ BEGIN
  CREATE TYPE public.cocreation_status AS ENUM ('pending', 'approved', 'declined');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.cocreation_interests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- The interested party's workspace and the person who clicked.
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message       TEXT,
  status        public.cocreation_status NOT NULL DEFAULT 'pending',
  admin_note    TEXT,
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One open interest per person per event; a declined one can be raised again.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cocreation_pending
  ON public.cocreation_interests(event_id, user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cocreation_status
  ON public.cocreation_interests(status, created_at DESC);

-- ─── Calendar feed token ─────────────────────────────────────────────────────
-- One-way sync to Google Calendar and Outlook means an ICS URL they can
-- subscribe to. The token is the credential, so it is per workspace and
-- rotatable.

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS calendar_feed_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspaces_feed_token
  ON public.workspaces(calendar_feed_token);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['calendar_entries', 'budget_windows'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "members read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "members read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (public.is_workspace_member(workspace_id, auth.uid()) OR public.is_admin(auth.uid()))
    $f$, t);

    EXECUTE format('DROP POLICY IF EXISTS "editors write %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "editors write %1$s" ON public.%1$I
        FOR ALL TO authenticated
        USING (public.can_edit_workspace(workspace_id, auth.uid()))
        WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()))
    $f$, t);

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

ALTER TABLE public.cocreation_interests ENABLE ROW LEVEL SECURITY;

-- The person who raised it can see their own. The event owner deliberately
-- cannot: §4.4.1 routes this through Admin, and showing the owner a queue of
-- interested brands would be the direct channel the spec forbids.
DROP POLICY IF EXISTS "requester reads own interest" ON public.cocreation_interests;
CREATE POLICY "requester reads own interest" ON public.cocreation_interests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins manage interests" ON public.cocreation_interests;
CREATE POLICY "admins manage interests" ON public.cocreation_interests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.cocreation_interests TO authenticated;
GRANT ALL ON public.cocreation_interests TO service_role;
