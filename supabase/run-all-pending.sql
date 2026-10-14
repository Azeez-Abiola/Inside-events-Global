-- =====================================================================
-- All pending IGE migrations, combined (generated 2026-10-14).
-- APPLIED to production on 2026-10-14 via the Supabase SQL Editor. Kept as
-- a record; rerunning is harmless (it skips anything that already exists).
-- Paste into Supabase → SQL Editor and Run. Runs as one transaction: if
-- anything fails, nothing is applied. Safe to run more than once.
-- First removes 14 empty draft tables left by an earlier attempt (see below).
-- =====================================================================

BEGIN;

-- ───────────────────────── Remove earlier drafts ─────────────────────────
-- An earlier draft of this work left 14 tables in the database with a
-- different design. Nothing on the live site uses them. They are removed
-- here so the current design can be created, but ONLY if every one of them
-- is empty: if any holds data, this stops and nothing at all is changed.
DO $$
DECLARE
  t TEXT;
  n BIGINT;
  drafts TEXT[] := ARRAY[
    'approval_requests', 'exclusivity_flags', 'deliverable_items',
    'match_explanations', 'meeting_bookings', 'match_scores', 'match_weight_config',
    'admin_inbox_messages', 'admin_inbox_threads', 'event_share_links',
    'productions', 'vendor_assignments', 'vendor_documents', 'vendors'];
BEGIN
  FOREACH t IN ARRAY drafts LOOP
    -- match_weight_config only holds the draft's six default weights, which
    -- are seeded again below; it is settings, not user data.
    IF t = 'match_weight_config' THEN CONTINUE; END IF;
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      IF n > 0 THEN
        RAISE EXCEPTION 'Stopped: draft table public.% has % row(s). Nothing was changed.', t, n;
      END IF;
    END IF;
  END LOOP;
  -- The draft's share-link view counter; nothing calls it (the current code
  -- uses record_share_link_view). Remove every version of it.
  FOR t IN
    SELECT p.oid::regprocedure::text FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = 'record_share_link_open'
  LOOP
    EXECUTE 'DROP FUNCTION ' || t;
  END LOOP;

  -- A database function from the draft that writes to these tables would
  -- break once they change shape. Stop and name it rather than guess.
  SELECT string_agg(p.proname, ', ') INTO t
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.proname <> 'record_share_link_view'
    AND p.prosrc ~ ('\m(' || array_to_string(drafts, '|') || ')\M');
  IF t IS NOT NULL THEN
    RAISE EXCEPTION 'Stopped: these database functions use the draft tables: %. Nothing was changed.', t;
  END IF;
  FOREACH t IN ARRAY drafts LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', t);
  END LOOP;
END $$;

-- Draft enum types may carry different values; recreate them below. One
-- still used by another table is left alone.
DO $$
DECLARE ty TEXT;
BEGIN
  FOREACH ty IN ARRAY ARRAY['inbox_status', 'match_queue_status', 'payment_direction',
                            'payment_status', 'vendor_category'] LOOP
    BEGIN
      EXECUTE format('DROP TYPE IF EXISTS public.%I', ty);
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Kept type public.% (still in use)', ty;
    END;
  END LOOP;
END $$;

-- A draft of this function may return a different type, which CREATE OR
-- REPLACE cannot change.
DROP FUNCTION IF EXISTS public.record_share_link_view(TEXT);

-- ───────────────────────── 20261006120000_workspace_account_type.sql ─────────────────────────
-- =====================================================================
-- Honour the account type chosen at signup (TAB 2 §2.3, TAB 4 §4.3)
--
-- Signup asks Individual or Organisation and writes the answer to
-- auth.users.raw_user_meta_data. It stopped there: ensure_personal_workspace
-- created every workspace as 'individual' regardless, so anyone who said
-- Organisation got an Individual workspace and had to upgrade again from
-- Account Settings to get the thing they had already asked for.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.ensure_personal_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_id  UUID;
  new_id       UUID;
  label        TEXT;
  meta         JSONB;
  chosen_type  public.workspace_account_type;
  company      TEXT;
BEGIN
  SELECT active_workspace_id INTO existing_id FROM public.profiles WHERE id = _user_id;
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  -- Someone invited into a workspace before ever owning one lands there
  -- rather than getting a second, empty personal workspace.
  SELECT workspace_id INTO existing_id
  FROM public.workspace_members
  WHERE user_id = _user_id AND status = 'active'
  ORDER BY accepted_at NULLS LAST, invited_at
  LIMIT 1;

  IF existing_id IS NULL THEN
    SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = _user_id;

    -- Anything other than an explicit 'organisation' stays Individual, which
    -- is the default the spec asks for and the safer of the two: upgrading
    -- is one click, while downgrading would have to strip seats.
    chosen_type := CASE
      WHEN COALESCE(meta ->> 'account_type', '') = 'organisation' THEN 'organisation'
      ELSE 'individual'
    END::public.workspace_account_type;

    company := NULLIF(trim(COALESCE(meta ->> 'company_name', '')), '');

    SELECT COALESCE(NULLIF(trim(display_name), ''), split_part(COALESCE(email, 'My'), '@', 1))
    INTO label
    FROM public.profiles WHERE id = _user_id;

    INSERT INTO public.workspaces (name, account_type, owner_user_id, upgraded_from_individual_at)
    VALUES (
      -- An Organisation is named after the company; an Individual workspace
      -- after the person.
      CASE
        WHEN chosen_type = 'organisation' AND company IS NOT NULL THEN company
        WHEN chosen_type = 'organisation' THEN COALESCE(label, 'My') || '''s organisation'
        ELSE COALESCE(label, 'My') || '''s workspace'
      END,
      chosen_type,
      _user_id,
      -- Chosen at signup rather than upgraded into, so this stays null: it
      -- records a conversion that never happened.
      NULL
    )
    RETURNING id INTO new_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, status, accepted_at)
    VALUES (new_id, _user_id, 'owner', 'active', now());

    existing_id := new_id;
  END IF;

  UPDATE public.profiles SET active_workspace_id = existing_id WHERE id = _user_id;
  RETURN existing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_personal_workspace(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_personal_workspace(UUID) TO service_role;

-- Backfill: accounts created before this said Organisation at signup and were
-- given an Individual workspace anyway. Only touch workspaces still untouched
-- — one owner, never renamed — so a workspace somebody has since set up by
-- hand is left exactly as they left it.
UPDATE public.workspaces w
SET account_type = 'organisation',
    name = COALESCE(
      NULLIF(trim(u.raw_user_meta_data ->> 'company_name'), ''),
      w.name
    ),
    updated_at = now()
FROM auth.users u
WHERE w.owner_user_id = u.id
  AND w.account_type = 'individual'
  AND COALESCE(u.raw_user_meta_data ->> 'account_type', '') = 'organisation'
  AND (SELECT count(*) FROM public.workspace_members m WHERE m.workspace_id = w.id) = 1;


-- ───────────────────────── 20261006130000_crm.sql ─────────────────────────
-- =====================================================================
-- Contacts and CRM (TAB 4 §4.4.2) — Version 1.1 Section B
--
-- "Every user can add and manage their own external contacts: people they
--  reach during outreach, people who contact them directly, and existing
--  clients. These are the user's own contacts, not other IGE users, so this
--  does not break the rule that users do not communicate with each other on
--  the platform (TAB 19 §19.1A)."
--
-- Everything here belongs to a workspace, not a user, so an Organisation team
-- shares one pipeline and the Manager role can see all of it. The seat model
-- decides who may write: owner and editor yes, manager and viewer no.
-- =====================================================================

-- ─── Who may change CRM data ─────────────────────────────────────────────────
-- Manager is read-only oversight by design (TAB 4 §4.3), so it is deliberately
-- absent here even though it can see everything.
CREATE OR REPLACE FUNCTION public.can_edit_workspace(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.workspace_role(_workspace_id, _user_id) IN ('owner', 'editor')
$$;

REVOKE EXECUTE ON FUNCTION public.can_edit_workspace(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_workspace(UUID, UUID) TO authenticated, service_role;

-- ─── Companies and clients ───────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.crm_client_type AS ENUM
    ('brand', 'organiser', 'agency', 'institution', 'creator');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.crm_companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  is_client    BOOLEAN NOT NULL DEFAULT false,
  client_type  public.crm_client_type,
  sector       TEXT,
  country      TEXT,
  website      TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_workspace ON public.crm_companies(workspace_id, name);

-- ─── Contacts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  job_title    TEXT,
  contact_type TEXT,
  sector       TEXT,
  country      TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  notes        TEXT,
  source       TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace ON public.crm_contacts(workspace_id, full_name);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON public.crm_contacts(company_id);

-- Duplicate detection on import is "by email and phone" (§4.4.2). Partial
-- unique indexes make the database the thing that enforces it, so a racing
-- double-import cannot slip a second copy past an application-level check.
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_email
  ON public.crm_contacts(workspace_id, lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_contacts_phone
  ON public.crm_contacts(workspace_id, phone) WHERE phone IS NOT NULL AND phone <> '';

-- ─── Pipeline ────────────────────────────────────────────────────────────────
-- Stages are rows, not an enum: §3.6.5 says they are editable per workspace.

CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  position     SMALLINT NOT NULL DEFAULT 0,
  -- Terminal stages: what counts as closed, for reporting.
  is_won       BOOLEAN NOT NULL DEFAULT false,
  is_lost      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_stage_name
  ON public.crm_pipeline_stages(workspace_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_crm_stages_workspace
  ON public.crm_pipeline_stages(workspace_id, position);

CREATE TABLE IF NOT EXISTS public.crm_deals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  stage_id       UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  contact_id     UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  company_id     UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  -- Links a CRM deal to an IGE event where there is one. Optional: most
  -- partnership work in this CRM has nothing to do with a listing.
  event_id       UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  -- Every value field carries its own currency (§4.4.2, multi-currency).
  value_amount   NUMERIC(14,2),
  value_currency TEXT NOT NULL DEFAULT 'NGN',
  probability    SMALLINT CHECK (probability IS NULL OR probability BETWEEN 0 AND 100),
  expected_close DATE,
  assignee_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_workspace ON public.crm_deals(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage_id);

-- ─── Outreach, meetings, commission ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_outreach (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id        UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  channel        TEXT NOT NULL CHECK (channel IN ('email','call','whatsapp','meeting','event','other')),
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome        TEXT,
  notes          TEXT,
  -- Feeds the Event Calendar and the task engine (§4.4.1, §4.3).
  next_follow_up DATE,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_outreach_workspace ON public.crm_outreach(workspace_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_outreach_followup
  ON public.crm_outreach(workspace_id, next_follow_up) WHERE next_follow_up IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.crm_meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id   UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id      UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  held_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  attendees    TEXT,
  notes        TEXT,
  decisions    TEXT,
  next_steps   TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_meetings_workspace ON public.crm_meetings(workspace_id, held_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  deal_id         UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  expected_amount NUMERIC(14,2),
  earned_amount   NUMERIC(14,2),
  currency        TEXT NOT NULL DEFAULT 'NGN',
  status          TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_commissions_workspace ON public.crm_commissions(workspace_id, status);

-- ─── RLS: read if you are in the workspace, write if your seat allows ─────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_companies','crm_contacts','crm_pipeline_stages',
    'crm_deals','crm_outreach','crm_meetings','crm_commissions'
  ] LOOP
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

-- ─── Seed the default pipeline for a workspace ───────────────────────────────
-- §3.6.5 ships a default ladder and says it is editable later, so this seeds
-- rather than constrains.

CREATE OR REPLACE FUNCTION public.ensure_default_pipeline_stages(_workspace_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  names TEXT[] := ARRAY['Lead','Contacted','Meeting held','Proposal sent',
                        'Negotiating','Won','Paid','Delivered','Lost'];
  i INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.crm_pipeline_stages WHERE workspace_id = _workspace_id) THEN
    RETURN;
  END IF;
  FOR i IN 1 .. array_length(names, 1) LOOP
    INSERT INTO public.crm_pipeline_stages (workspace_id, name, position, is_won, is_lost)
    VALUES (
      _workspace_id,
      names[i],
      i,
      names[i] IN ('Won','Paid','Delivered'),
      names[i] = 'Lost'
    );
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_default_pipeline_stages(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_pipeline_stages(UUID) TO authenticated, service_role;


-- ───────────────────────── 20261007100000_event_calendar.sql ─────────────────────────
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


-- ───────────────────────── 20261007110000_activation_tracker.sql ─────────────────────────
-- =====================================================================
-- Activation Task Tracker (TAB 4, Module 4A) — Section B
--
-- Raised at the 26 September review with a food brand running an activation
-- at an event it sponsored: "brand teams need a proper project-management
-- tracker for activations, not only a per-deal checklist."
--
-- An activation can hang off an event, off a CRM deal, or stand alone — which
-- is why both links are nullable. Agency or vendor is "free text or a contact
-- from the CRM", so it is both columns rather than a forced choice.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.activation_status AS ENUM
    ('not_started', 'in_progress', 'blocked', 'done');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.activation_type AS ENUM (
    'sampling', 'booth', 'stage_moment', 'hosted_session',
    'content_shoot', 'pop_up', 'community_outreach', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.activations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  activation_type public.activation_type NOT NULL DEFAULT 'other',
  status          public.activation_status NOT NULL DEFAULT 'not_started',

  -- Optional on purpose: an activation may stand alone.
  event_id        UUID REFERENCES public.events(id) ON DELETE SET NULL,
  deal_id         UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,

  venue           TEXT,
  city            TEXT,
  country         TEXT,
  map_pin         TEXT,

  starts_on       DATE,
  ends_on         DATE,
  event_date      DATE,

  -- "Named owner from the workspace Team" — so the assignee must be a person
  -- with a seat, which is what made the workspace layer a prerequisite.
  owner_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_note       TEXT,

  -- "Free text or a contact from the CRM."
  vendor_name     TEXT,
  vendor_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,

  budget_amount   NUMERIC(14,2),
  budget_currency TEXT NOT NULL DEFAULT 'NGN',

  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT activation_date_order CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_activations_workspace ON public.activations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_activations_dates ON public.activations(workspace_id, starts_on);
CREATE INDEX IF NOT EXISTS idx_activations_event ON public.activations(event_id);

-- ─── Milestones ──────────────────────────────────────────────────────────────
-- "Timeline: start and end dates, milestones, and the event date."

CREATE TABLE IF NOT EXISTS public.activation_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES public.activations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  due_on        DATE,
  assignee_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at  TIMESTAMPTZ,
  position      SMALLINT NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activation_milestones
  ON public.activation_milestones(activation_id, position);

-- ─── Evidence ────────────────────────────────────────────────────────────────
-- "Photos, videos, attendance counts and notes, feeding the Investment
--  Report." TAB 8 is not built yet, so this table is where that evidence will
--  be read from when it is — capturing it now means no backfill later.

CREATE TABLE IF NOT EXISTS public.activation_evidence (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES public.activations(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL DEFAULT 'note'
                  CHECK (kind IN ('photo','video','attendance','note','document')),
  file_url      TEXT,
  attendance_count INTEGER,
  caption       TEXT,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activation_evidence
  ON public.activation_evidence(activation_id, captured_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['activations','activation_milestones','activation_evidence'] LOOP
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


-- ───────────────────────── 20261011100000_vendors_payments.sql ─────────────────────────
-- =====================================================================
-- Vendors and Payments (TAB 4 §4.4.6, new in v6.3) — Section B
--
-- "The workspace layer also lets every user manage the vendors they work with
--  and track the money moving in and out of each event or project. IGE
--  records and tracks these payments; it does not move money for them."
--
-- Media Partner and Referral Partner accounts get Payments only — that split
-- is enforced in the server functions, not here, because it is a product rule
-- about roles rather than a data-access rule about workspaces.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.vendor_category AS ENUM (
    'venue', 'decor', 'sound', 'lighting', 'catering', 'printing',
    'logistics', 'security', 'media', 'talent', 'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_direction AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Due and Overdue are also derived on read from due_on, so a payment nobody
-- touched still turns Overdue on the right day.
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('scheduled', 'due', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Vendor directory ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          public.vendor_category NOT NULL DEFAULT 'other',
  contact_person    TEXT,
  phone             TEXT,
  email             TEXT,
  -- A reference to where the bank or payment details live, never the account
  -- number itself (TAB 12 §12.5: no bank account numbers stored by IGE).
  payment_reference TEXT,
  rating            SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_workspace ON public.vendors(workspace_id, category);

-- ─── Quotes, invoices and contracts ──────────────────────────────────────────
-- "Upload quotes, invoices and contracts per vendor and per event; compare
--  quotes; mark the chosen vendor."

CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vendor_id    UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL DEFAULT 'quote' CHECK (kind IN ('quote', 'invoice', 'contract')),
  title        TEXT NOT NULL,
  file_url     TEXT,
  amount       NUMERIC(14,2),
  currency     TEXT NOT NULL DEFAULT 'NGN (₦)',
  -- Only meaningful on quotes: the one picked out of the comparison.
  is_chosen    BOOLEAN NOT NULL DEFAULT false,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor ON public.vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_event ON public.vendor_documents(event_id);

-- ─── Assignments ─────────────────────────────────────────────────────────────
-- "Link vendors to events, activations and tasks, with delivery dates on the
--  Event Calendar."

CREATE TABLE IF NOT EXISTS public.vendor_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES public.events(id) ON DELETE CASCADE,
  activation_id UUID REFERENCES public.activations(id) ON DELETE CASCADE,
  deliverable   TEXT NOT NULL,
  delivery_on   DATE,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_assignments_vendor ON public.vendor_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_delivery
  ON public.vendor_assignments(workspace_id, delivery_on);

-- ─── Payments in and out ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  direction    public.payment_direction NOT NULL,
  event_id     UUID REFERENCES public.events(id) ON DELETE SET NULL,
  vendor_id    UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  -- Who paid or is paid when it is not a vendor: a sponsor, a partner, a client.
  counterparty TEXT,
  description  TEXT,
  amount       NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency     TEXT NOT NULL DEFAULT 'NGN (₦)',
  is_partial   BOOLEAN NOT NULL DEFAULT false,
  due_on       DATE,
  paid_on      DATE,
  status       public.payment_status NOT NULL DEFAULT 'scheduled',
  method       TEXT,
  receipt_url  TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_payments_workspace
  ON public.workspace_payments(workspace_id, direction, status);
CREATE INDEX IF NOT EXISTS idx_workspace_payments_due
  ON public.workspace_payments(workspace_id, due_on);
CREATE INDEX IF NOT EXISTS idx_workspace_payments_event ON public.workspace_payments(event_id);

-- ─── Planned budget per event ────────────────────────────────────────────────
-- The "planned budget" half of budget versus actual. One row per event per
-- workspace; committed, paid out and received in are summed from payments.

CREATE TABLE IF NOT EXISTS public.event_budgets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  planned_amount NUMERIC(14,2) NOT NULL CHECK (planned_amount >= 0),
  currency       TEXT NOT NULL DEFAULT 'NGN (₦)',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, event_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vendors','vendor_documents','vendor_assignments','workspace_payments','event_budgets'] LOOP
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


-- ───────────────────────── 20261011110000_admin_inbox.sql ─────────────────────────
-- =====================================================================
-- Message IGE and the Admin Inbox (TAB 4 §4.4.4, TAB 6 §6.10) — Section B
--
-- "Users can send IGE Admin a message, a request or a question. Only Admin
--  receives it; users cannot see or message other users." (§4.4.4)
--
-- "Admin Inbox: one threaded inbox for every Message IGE conversation, Email
--  Admin form, Live Chat hand-off, co-creation interest, IGE Services meeting
--  request, ABW Consulting lead, PartnerUp Tribe join request and password
--  reset notification, assignable to an admin with a status and an SLA
--  timer." (§6.10)
--
-- So a thread is between one person (a user, or a visitor known only by name
-- and email) and the IGE team as a whole — never between two users. That is
-- what replaces the old user-to-user `messages` table (TAB 19 §19.1A).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.inbox_status AS ENUM ('new', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.admin_inbox_threads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for visitors who are not signed in (Email Admin form, IGE Services
  -- request, Tribe join form). contact_name/contact_email carry who they are.
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name      TEXT,
  contact_email     TEXT,
  -- message | request | question | email_admin | co_creation | ige_services |
  -- abw_consulting | tribe_join | password_reset | complaint | admin_access |
  -- system. Free text so a new source never needs a migration.
  source            TEXT NOT NULL DEFAULT 'message',
  subject           TEXT NOT NULL,
  status            public.inbox_status NOT NULL DEFAULT 'new',
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sla_due_at        TIMESTAMPTZ,
  -- Structured fields from forms (services ticked, engagement type, …).
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unread markers on each side, so the badge counts are cheap.
  unread_for_admin  BOOLEAN NOT NULL DEFAULT true,
  unread_for_user   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_user ON public.admin_inbox_threads(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_status ON public.admin_inbox_threads(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_source ON public.admin_inbox_threads(source);

CREATE TABLE IF NOT EXISTS public.admin_inbox_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES public.admin_inbox_threads(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_admin BOOLEAN NOT NULL DEFAULT false,
  -- Admin-only notes on a thread; never shown to the user.
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread ON public.admin_inbox_messages(thread_id, created_at);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Server functions use the service role; these policies are the backstop for
-- any direct client read.

ALTER TABLE public.admin_inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own or admin read threads" ON public.admin_inbox_threads;
CREATE POLICY "own or admin read threads" ON public.admin_inbox_threads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admin write threads" ON public.admin_inbox_threads;
CREATE POLICY "admin write threads" ON public.admin_inbox_threads
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "own or admin read messages" ON public.admin_inbox_messages;
CREATE POLICY "own or admin read messages" ON public.admin_inbox_messages
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR (
      NOT is_internal_note
      AND EXISTS (
        SELECT 1 FROM public.admin_inbox_threads t
        WHERE t.id = thread_id AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "admin write messages" ON public.admin_inbox_messages;
CREATE POLICY "admin write messages" ON public.admin_inbox_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.admin_inbox_threads, public.admin_inbox_messages TO authenticated;
GRANT ALL ON public.admin_inbox_threads, public.admin_inbox_messages TO service_role;


-- ───────────────────────── 20261011120000_event_share_links.sql ─────────────────────────
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


-- ───────────────────────── 20261011130000_budget_tags.sql ─────────────────────────
-- =====================================================================
-- Marketing Budget sector tagging (TAB 4 §4.1 Module 1) — Section B
--
-- "Sector Tagging: budget tagged to sectors and event types the brand wants
--  to sponsor. Drives the daily feed (Module 3)."
-- =====================================================================

ALTER TABLE public.market_budgets
  ADD COLUMN IF NOT EXISTS sector_tags     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_type_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_market_budgets_sector_tags
  ON public.market_budgets USING GIN (sector_tags);


-- ───────────────────────── 20261011140000_fundraising_tracker.sql ─────────────────────────
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


-- ───────────────────────── 20261011150000_brand_readiness.sql ─────────────────────────
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


-- ───────────────────────── 20261011160000_matchmaking_engine.sql ─────────────────────────
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


-- ───────────────────────── 20261011170000_creative_productions.sql ─────────────────────────
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


-- ───────────────────────── 20261011180000_public_site.sql ─────────────────────────
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


-- ───────────────────────── 20261011190000_deliverable_matrix.sql ─────────────────────────
-- =====================================================================
-- Deliverable Matrix & Contract Compliance (TAB 4 §4.1 Module 5)
--
-- "Sponsoring organisations at every scale lose renewal revenue when there is
--  no systematic record of what was promised against what was delivered."
-- Per deal: an itemised matrix with proof of delivery, a category-exclusivity
-- check across the event's other deals, and an approval workflow for creative
-- with a turnaround window that escalates when missed.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.deliverable_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  asset_type        TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  placement_channel TEXT,
  due_date          DATE,
  -- Which side is responsible for fulfilment.
  owner_side        TEXT NOT NULL DEFAULT 'organiser' CHECK (owner_side IN ('organiser', 'sponsor')),
  owner_name        TEXT,
  status            TEXT NOT NULL DEFAULT 'promised'
                      CHECK (status IN ('promised', 'in_progress', 'delivered', 'changed', 'missed')),
  -- Required before a line can be marked Delivered.
  proof_url         TEXT,
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delivered_needs_proof CHECK (status <> 'delivered' OR (proof_url IS NOT NULL AND proof_url <> ''))
);

CREATE INDEX IF NOT EXISTS idx_deliverable_items_deal ON public.deliverable_items(deal_id, due_date);

CREATE TABLE IF NOT EXISTS public.exclusivity_flags (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  deal_id             UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  declared_category   TEXT NOT NULL,
  conflicting_deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  flagged_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolution_status   TEXT NOT NULL DEFAULT 'open' CHECK (resolution_status IN ('open', 'resolved', 'dismissed')),
  resolution_note     TEXT,
  resolved_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (deal_id, conflicting_deal_id)
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  item_id           UUID REFERENCES public.deliverable_items(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  content_url       TEXT NOT NULL,
  requested_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- The approver is the other side of the deal.
  approver_side     TEXT NOT NULL CHECK (approver_side IN ('organiser', 'sponsor')),
  -- Default 5 business days (§Module 5).
  turnaround_due_at TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'changes_requested', 'escalated')),
  response_note     TEXT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_deal ON public.approval_requests(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_due ON public.approval_requests(status, turnaround_due_at);

-- Server functions check deal membership; RLS is the backstop.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['deliverable_items','exclusivity_flags','approval_requests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "parties read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "parties read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (
          public.is_admin(auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.deals d
            WHERE d.id = deal_id AND (d.organiser_id = auth.uid() OR d.sponsor_user_id = auth.uid())
          )
        )
    $f$, t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;


-- ───────────────────────── 20261011200000_roo_engine.sql ─────────────────────────
-- =====================================================================
-- Return on Objective engine, Business Case and Investment Report
-- (TAB 4 §4.1 Sponsorship Setup Flow, TAB 8 §8.2–8.6)
--
-- Every sponsorship is measured against the objectives the brand set for it,
-- weighted by spend (IEG's Return on Sponsorship approach, credited in TAB 8
-- §8.1). Weights lock once confirmed so the scorecard cannot be quietly
-- rewritten afterwards; only an admin override, logged, can change them.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.sector_packs (
  id                  TEXT PRIMARY KEY,
  pack_name           TEXT NOT NULL,
  default_objectives  TEXT[] NOT NULL,
  default_weights     SMALLINT[] NOT NULL,
  default_kpis        TEXT[] NOT NULL,
  pillar_emphasis     TEXT NOT NULL,
  -- Indicative benchmark range, always labelled "Industry reference" until
  -- IGE has enough of its own closed deals (TAB 8 §8.6).
  benchmark_note      TEXT,
  position            SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO public.sector_packs (id, pack_name, default_objectives, default_weights, default_kpis, pillar_emphasis, benchmark_note, position) VALUES
  ('fmcg', 'FMCG / consumer goods', ARRAY['Product trial','Awareness','Sales lift'], ARRAY[40,35,25]::SMALLINT[], ARRAY['Sampling units','Outlet reach','Brand recall','Sales lift','Share of voice'], 'Brand + business', 'Industry reference', 1),
  ('b2b_tech', 'B2B / tech / SaaS', ARRAY['Lead generation','Product trial','Awareness'], ARRAY[50,30,20]::SMALLINT[], ARRAY['MQLs / SQLs','Pipeline value','Cost per qualified lead','Demo requests'], 'Business', 'Industry reference', 2),
  ('financial', 'Financial services / insurance', ARRAY['Awareness','Relationship-building','Community / ESG positioning'], ARRAY[40,35,25]::SMALLINT[], ARRAY['Trust sentiment','Consideration shift','Share of voice'], 'Brand', 'Industry reference', 3),
  ('retail', 'Retail / e-commerce', ARRAY['Sales lift','Product trial','Awareness'], ARRAY[50,25,25]::SMALLINT[], ARRAY['Footfall','Redemption rate','Conversion rate','Basket size lift'], 'Business', 'Industry reference', 4),
  ('telecoms', 'Telecoms / consumer tech hardware', ARRAY['Sales lift','Lead generation','Awareness'], ARRAY[40,30,30]::SMALLINT[], ARRAY['New activations','App downloads','NPS shift','Qualified leads'], 'Business + brand', 'Industry reference', 5),
  ('agency', 'Agency-managed portfolio', ARRAY['Awareness','Lead generation','Relationship-building'], ARRAY[34,33,33]::SMALLINT[], ARRAY['Portfolio ROO roll-up','Comparative ROI Score','Category share of voice'], 'Money (portfolio efficiency)', 'Industry reference', 6)
ON CONFLICT (id) DO NOTHING;

-- One row per objective per deal.
CREATE TABLE IF NOT EXISTS public.objective_weights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  objective_name    TEXT NOT NULL,
  spend_weight_pct  SMALLINT NOT NULL CHECK (spend_weight_pct BETWEEN 0 AND 100),
  pillar            TEXT NOT NULL CHECK (pillar IN ('money', 'brand', 'business')),
  kpi               TEXT,
  target_value      NUMERIC(16,2),
  achieved_value    NUMERIC(16,2),
  -- Marked rather than omitted when not automatically captured (TAB 8 §8.5).
  is_self_reported  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (deal_id, objective_name)
);

CREATE TABLE IF NOT EXISTS public.sponsorship_setups (
  deal_id       UUID PRIMARY KEY REFERENCES public.deals(id) ON DELETE CASCADE,
  sector_pack_id TEXT REFERENCES public.sector_packs(id) ON DELETE SET NULL,
  locked_at     TIMESTAMPTZ,
  locked_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Admin override history, so a changed scorecard is always explainable.
  override_log  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.investment_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  -- Value for money / brand / business inputs (TAB 8 §8.2).
  rights_fee      NUMERIC(16,2),
  fair_market_value NUMERIC(16,2),
  attendees_reached INTEGER,
  leads_captured  INTEGER,
  pipeline_value  NUMERIC(16,2),
  awareness_lift_pct NUMERIC(6,2),
  sentiment_note  TEXT,
  competitors_present TEXT,
  outlook_90_day  TEXT,
  renewal_recommended BOOLEAN,
  roi_score       SMALLINT CHECK (roi_score IS NULL OR roi_score BETWEEN 1 AND 100),
  generated_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['objective_weights','sponsorship_setups','investment_reports'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "parties read %1$s" ON public.%1$I', t);
    EXECUTE format($f$
      CREATE POLICY "parties read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (
          public.is_admin(auth.uid())
          OR EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (d.organiser_id = auth.uid() OR d.sponsor_user_id = auth.uid()))
        )
    $f$, t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

ALTER TABLE public.sector_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone signed in reads packs" ON public.sector_packs;
CREATE POLICY "anyone signed in reads packs" ON public.sector_packs FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.sector_packs TO authenticated;
GRANT ALL ON public.sector_packs TO service_role;


-- ───────────────────────── 20261011210000_admin_governance.sql ─────────────────────────
-- =====================================================================
-- Admin governance (TAB 6 §6.2.2, §6.2.4, §6.9, TAB 12 §12.4)
--
--  * events.revetting_*: an Admin edit to vetting-relevant data after an
--    event was approved flags it for a re-vetting check by Vetting Ops.
--  * dual_control_requests: high-impact actions (Act as User, suspending an
--    account, approving a match involving a Managed Service client, erasing
--    a user's personal data) only take effect once a second Super Admin
--    signs off. The requester can never approve their own request.
--  * profiles.managed_service_client: set by Admin for AlexBoyo World
--    Managed Service clients (TAB 20).
--  * sign_in_failures: failed password sign-ins, so five within 15 minutes
--    trigger a short lock and a CAPTCHA. Keyed by a hash of the email, never
--    the address itself.
-- =====================================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS revetting_flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revetting_reason     TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS managed_service_client BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.dual_control_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL CHECK (action IN ('act_as_user', 'suspend_user', 'approve_match', 'erase_user')),
  target_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  -- What to carry out on approval (e.g. the match's slots and call link).
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'denied', 'used', 'expired')),
  decided_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at      TIMESTAMPTZ,
  decision_note   TEXT,
  -- An approval is usable for a short window only.
  expires_at      TIMESTAMPTZ,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dual_control_second_person CHECK (decided_by IS NULL OR decided_by <> requested_by)
);
CREATE INDEX IF NOT EXISTS dual_control_requests_status_idx ON public.dual_control_requests (status, created_at DESC);

ALTER TABLE public.dual_control_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read dual control" ON public.dual_control_requests;
CREATE POLICY "admins read dual control" ON public.dual_control_requests
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
GRANT SELECT ON public.dual_control_requests TO authenticated;
GRANT ALL ON public.dual_control_requests TO service_role;

CREATE TABLE IF NOT EXISTS public.sign_in_failures (
  id          BIGSERIAL PRIMARY KEY,
  email_hash  TEXT NOT NULL,
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sign_in_failures_lookup_idx ON public.sign_in_failures (email_hash, created_at DESC);

-- Server-only: no policies, so only the service role can read or write.
ALTER TABLE public.sign_in_failures ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.sign_in_failures TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sign_in_failures_id_seq TO service_role;


-- ───────────────────────── 20261011220000_account_settings.sql ─────────────────────────
-- =====================================================================
-- Account Settings: Payment Details and digest emails
-- (TAB 4 Screen Spec - Account Settings; TAB 18 §18.4)
--
--  * workspace_payment_details: what a sponsor needs to pay a closed deal
--    through the platform, and where an organiser receives net proceeds.
--    Owner role only; IGE admins can read it to process payouts.
--  * profiles.digest_frequency: daily brief, weekly recap only, or off.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.workspace_payment_details (
  workspace_id          UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Paying a closed deal (sponsor side).
  pay_method            TEXT CHECK (pay_method IN ('bank_transfer', 'card', 'invoice', 'other')),
  billing_contact_name  TEXT,
  billing_contact_email TEXT,
  billing_address       TEXT,
  tax_id                TEXT,
  -- Receiving net proceeds (organiser side).
  payout_method         TEXT CHECK (payout_method IN ('bank_transfer', 'paystack', 'stripe', 'other')),
  payout_currency       TEXT,
  bank_country          TEXT,
  bank_name             TEXT,
  account_name          TEXT,
  account_number        TEXT,
  sort_or_routing_code  TEXT,
  swift_bic             TEXT,
  iban                  TEXT,
  processor_account_ref TEXT,
  notes                 TEXT,
  updated_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_payment_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners and admins read payment details" ON public.workspace_payment_details;
CREATE POLICY "owners and admins read payment details" ON public.workspace_payment_details
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.workspace_id = workspace_payment_details.workspace_id
        AND m.user_id = auth.uid() AND m.status = 'active' AND m.role = 'owner'
    )
  );
GRANT SELECT ON public.workspace_payment_details TO authenticated;
GRANT ALL ON public.workspace_payment_details TO service_role;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS digest_frequency   TEXT NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS digest_last_sent_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_digest_frequency_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_digest_frequency_check CHECK (digest_frequency IN ('daily', 'weekly', 'off'));
  END IF;
END $$;


-- ───────────────────────── 20261011230000_prefs_help_lifecycle.sql ─────────────────────────
-- =====================================================================
-- Notification preferences, Help Center feedback, account lifecycle
-- (TAB 4 Account Settings "Notifications"; TAB 17 §17.2–17.3;
--  TAB 6 §6.2.2 Admin Actions)
-- =====================================================================

-- ── Notification preferences ─────────────────────────────────────────
-- One row per person per alert category. No row means "on". Account,
-- security and admin-change notices are not categorised and always send.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('matches', 'deals', 'events', 'deliverables', 'messages')),
  in_app      BOOLEAN NOT NULL DEFAULT true,
  email       BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notification preferences" ON public.notification_preferences;
CREATE POLICY "own notification preferences" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

-- Which category an in-app notification type belongs to (NULL = always on).
CREATE OR REPLACE FUNCTION public.notification_category(_type TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _type IN ('match', 'match_reminder', 'media_event') THEN 'matches'
    WHEN _type IN ('deal_status_change', 'new_inquiry', 'contract_ready', 'payment_link',
                   'custom_package_request', 'commission_paid', 'referral_conversion') THEN 'deals'
    WHEN _type IN ('vetting_status', 'event_removed', 'production_review', 'onboarding_changes_requested') THEN 'events'
    WHEN _type IN ('approval_escalated', 'exclusivity_conflict') THEN 'deliverables'
    WHEN _type IN ('complaint_reply', 'ige_reply') THEN 'messages'
    ELSE NULL
  END
$$;

-- Drops an in-app notification the person has switched off, so every
-- place that creates notifications obeys the setting without changes.
CREATE OR REPLACE FUNCTION public.respect_notification_preferences()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cat TEXT := public.notification_category(NEW.type);
BEGIN
  IF cat IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.notification_preferences p
    WHERE p.user_id = NEW.user_id AND p.category = cat AND p.in_app = false
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notifications_respect_preferences ON public.notifications;
CREATE TRIGGER notifications_respect_preferences
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.respect_notification_preferences();

-- ── Help Center feedback ("Was this helpful?") ───────────────────────
CREATE TABLE IF NOT EXISTS public.help_feedback (
  id          BIGSERIAL PRIMARY KEY,
  article_id  TEXT,
  helpful     BOOLEAN,
  -- An unanswered Live Chat question: a content gap with no article yet.
  question    TEXT,
  source      TEXT NOT NULL CHECK (source IN ('faq', 'chat')),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (article_id IS NOT NULL OR question IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS help_feedback_created_idx ON public.help_feedback (created_at DESC);
ALTER TABLE public.help_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read help feedback" ON public.help_feedback;
CREATE POLICY "admins read help feedback" ON public.help_feedback
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
GRANT SELECT ON public.help_feedback TO authenticated;
GRANT ALL ON public.help_feedback TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.help_feedback_id_seq TO service_role;

-- ── Account lifecycle ────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS erased_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Every public (table, column) that points at a person: single-column
-- foreign keys to auth.users or profiles, plus the ownership columns that
-- were created without a foreign key.
CREATE OR REPLACE FUNCTION public.user_reference_columns()
RETURNS TABLE (table_name TEXT, column_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT DISTINCT t, c FROM (
    SELECT cl.relname::text AS t, a.attname::text AS c
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace AND n.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND array_length(con.conkey, 1) = 1
      AND con.confrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
    UNION
    SELECT c.table_name::text, c.column_name::text
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type = 'uuid'
      AND c.column_name IN ('user_id', 'organiser_id', 'sponsor_user_id', 'subject_user_id',
                            'candidate_user_id', 'owner_id', 'created_by')
  ) x(t, c)
  -- The person's own profile row and the governance records are never moved.
  WHERE NOT (t = 'profiles' AND c = 'id')
    AND t NOT IN ('admin_audit_log', 'dual_control_requests', 'sign_in_failures')
$$;

-- GDPR / NDPR data export: every row that points at the person.
CREATE OR REPLACE FUNCTION public.admin_export_user(_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  chunk JSONB;
  result JSONB := jsonb_build_object(
    'profiles', (SELECT jsonb_agg(to_jsonb(p)) FROM public.profiles p WHERE p.id = _user_id)
  );
BEGIN
  FOR r IN SELECT * FROM public.user_reference_columns() ORDER BY 1, 2 LOOP
    EXECUTE format('SELECT jsonb_agg(to_jsonb(t)) FROM public.%I t WHERE t.%I = $1', r.table_name, r.column_name)
      INTO chunk USING _user_id;
    IF chunk IS NOT NULL THEN
      result := result || jsonb_build_object(r.table_name || '.' || r.column_name, chunk);
    END IF;
  END LOOP;
  RETURN result;
END $$;

-- Merge a duplicate account into the primary one. Rows that would break a
-- uniqueness rule (e.g. the same workspace seat twice) stay on the
-- duplicate and are counted, so nothing is silently lost.
CREATE OR REPLACE FUNCTION public.admin_merge_users(_from UUID, _into UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  row_ref RECORD;
  n INTEGER;
  skipped INTEGER;
  result JSONB := '{}'::jsonb;
BEGIN
  IF _from = _into THEN RAISE EXCEPTION 'Cannot merge an account into itself'; END IF;
  FOR r IN SELECT * FROM public.user_reference_columns() ORDER BY 1, 2 LOOP
    n := 0;
    skipped := 0;
    BEGIN
      EXECUTE format('UPDATE public.%I SET %I = $1 WHERE %I = $2', r.table_name, r.column_name, r.column_name)
        USING _into, _from;
      GET DIAGNOSTICS n = ROW_COUNT;
    EXCEPTION WHEN unique_violation OR exclusion_violation THEN
      FOR row_ref IN EXECUTE format('SELECT ctid FROM public.%I WHERE %I = $1', r.table_name, r.column_name) USING _from LOOP
        BEGIN
          EXECUTE format('UPDATE public.%I SET %I = $1 WHERE ctid = $2', r.table_name, r.column_name)
            USING _into, row_ref.ctid;
          n := n + 1;
        EXCEPTION WHEN unique_violation OR exclusion_violation THEN
          skipped := skipped + 1;
        END;
      END LOOP;
    END;
    IF n > 0 OR skipped > 0 THEN
      result := result || jsonb_build_object(r.table_name || '.' || r.column_name, jsonb_build_object('moved', n, 'kept', skipped));
    END IF;
  END LOOP;
  UPDATE public.profiles
     SET merged_into_id = _into, is_suspended = true,
         suspension_reason = 'Merged into another IGE account'
   WHERE id = _from;
  RETURN result;
END $$;

-- Force sign-out of every session (refresh tokens die with the session;
-- an access token already issued lapses within the hour).
CREATE OR REPLACE FUNCTION public.admin_revoke_sessions(_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public AS $$
DECLARE n INTEGER;
BEGIN
  DELETE FROM auth.refresh_tokens WHERE user_id = _user_id::text;
  DELETE FROM auth.sessions WHERE user_id = _user_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION public.user_reference_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_export_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_merge_users(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_sessions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_reference_columns() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_export_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_merge_users(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_sessions(UUID) TO service_role;


COMMIT;

-- Tell the API about the new tables and columns.
NOTIFY pgrst, 'reload schema';
