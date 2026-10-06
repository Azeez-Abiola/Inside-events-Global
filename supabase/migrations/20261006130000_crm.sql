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
