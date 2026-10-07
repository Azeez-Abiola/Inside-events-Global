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
