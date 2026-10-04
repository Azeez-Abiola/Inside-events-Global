-- =====================================================================
-- The workspace layer (TAB 4 §4.3, v6.2)
--
-- Every workspace on IGE — brand, agency or organiser — is one of two
-- account types. Individual is the default for every new sign-up;
-- Organisation is an upgrade path, not a separate product, "so a solo
-- organiser or single in-house brand marketer is never asked to make an
-- organisational decision before they have a reason to."
--
-- This is foundational: the Manager role, the Team Activity view, the Weekly
-- Team Activity Report and the assignee_id on every task in the Activation
-- Task Tracker all sit on top of it. Nothing in Version 1.1 Section B can be
-- built without it, which is why it lands first.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.workspace_account_type AS ENUM ('individual', 'organisation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_member_role AS ENUM ('owner', 'manager', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_member_status AS ENUM ('invited', 'active', 'removed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Workspace ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspaces (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  account_type                public.workspace_account_type NOT NULL DEFAULT 'individual',
  owner_user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url                    TEXT,
  -- Free until at least May 2027 (TAB 11), so this is a placeholder that keeps
  -- the column from needing a backfill when premium features arrive.
  billing_tier                TEXT NOT NULL DEFAULT 'free',
  upgraded_from_individual_at TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.workspaces IS
  'TAB 4 §4.3. One per account by default; an Organisation workspace adds named seats. Upgrading never creates a second workspace — the existing one changes account_type, so no data has to migrate.';

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_user_id);

-- ─── Membership (the spec's TeamMember entity) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Null until an invited person signs up and claims the seat.
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT,
  role          public.workspace_member_role NOT NULL DEFAULT 'viewer',
  status        public.workspace_member_status NOT NULL DEFAULT 'invited',
  invited_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  removed_at    TIMESTAMPTZ,
  CONSTRAINT workspace_members_identified CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

COMMENT ON TABLE public.workspace_members IS
  'Who can act in a workspace and at what level. Populates the assignee_id used throughout the Task Manager and Activation Task Tracker — a person must appear here before a task can be assigned to them.';

COMMENT ON COLUMN public.workspace_members.role IS
  'owner = everything incl. upgrade and payout details · manager = read-only oversight plus Team Activity (v6.2) · editor = works in the workspace and manages seats · viewer = read only.';

-- One seat per person per workspace. Partial, because a workspace can hold
-- several pending invites that have no user_id yet.
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_members_user
  ON public.workspace_members(workspace_id, user_id) WHERE user_id IS NOT NULL;

-- Likewise one outstanding invite per email address.
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_members_invite
  ON public.workspace_members(workspace_id, lower(invited_email))
  WHERE invited_email IS NOT NULL AND status = 'invited';

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- Which workspace the person is currently acting in (the switcher's state).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- ─── Helpers ──────────────────────────────────────────────────────────────────
-- SECURITY DEFINER so the policies below can ask "is this person a member?"
-- without re-entering workspace_members' own RLS and recursing.

CREATE OR REPLACE FUNCTION public.workspace_role(_workspace_id UUID, _user_id UUID)
RETURNS public.workspace_member_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = _workspace_id
    AND user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.workspace_role(_workspace_id, _user_id) IS NOT NULL
$$;

/** Owner and Editor manage seats; Manager is deliberately read-only (v6.2). */
CREATE OR REPLACE FUNCTION public.can_manage_workspace_team(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.workspace_role(_workspace_id, _user_id) IN ('owner', 'editor')
$$;

-- Locked to signed-in callers. The grants are explicit rather than relying on
-- a blanket GRANT ... ON ALL FUNCTIONS, which only covers functions that
-- existed when it ran — the RLS policies below call these, so losing EXECUTE
-- would lock every member out of their own workspace.
REVOKE EXECUTE ON FUNCTION public.workspace_role(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_workspace_team(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.workspace_role(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace_team(UUID, UUID) TO authenticated, service_role;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members view their workspace" ON public.workspaces;
CREATE POLICY "members view their workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()) OR public.is_admin(auth.uid()));

-- Only the owner renames a workspace, swaps its logo or upgrades it.
DROP POLICY IF EXISTS "owner updates workspace" ON public.workspaces;
CREATE POLICY "owner updates workspace" ON public.workspaces
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (owner_user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "users create own workspace" ON public.workspaces;
CREATE POLICY "users create own workspace" ON public.workspaces
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());

-- Everyone in a workspace can see who else is in it; that list is what the
-- Team Activity view and every assignee picker are built from.
DROP POLICY IF EXISTS "members view the team" ON public.workspace_members;
CREATE POLICY "members view the team" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_workspace_member(workspace_id, auth.uid())
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "team managers change seats" ON public.workspace_members;
CREATE POLICY "team managers change seats" ON public.workspace_members
  FOR ALL TO authenticated
  USING (public.can_manage_workspace_team(workspace_id, auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.can_manage_workspace_team(workspace_id, auth.uid()) OR public.is_admin(auth.uid()));

GRANT SELECT ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
GRANT ALL ON public.workspace_members TO service_role;

-- ─── Every account gets a workspace ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_personal_workspace(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_id      UUID;
  label       TEXT;
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
    SELECT COALESCE(NULLIF(trim(display_name), ''), split_part(COALESCE(email, 'My'), '@', 1))
    INTO label
    FROM public.profiles WHERE id = _user_id;

    INSERT INTO public.workspaces (name, account_type, owner_user_id)
    VALUES (COALESCE(label, 'My') || '''s workspace', 'individual', _user_id)
    RETURNING id INTO new_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role, status, accepted_at)
    VALUES (new_id, _user_id, 'owner', 'active', now());

    existing_id := new_id;
  END IF;

  UPDATE public.profiles SET active_workspace_id = existing_id WHERE id = _user_id;
  RETURN existing_id;
END;
$$;

-- getMyWorkspaces calls this through the service role to self-heal an account
-- that predates the workspace layer, so service_role needs it; nobody else does.
REVOKE EXECUTE ON FUNCTION public.ensure_personal_workspace(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_personal_workspace(UUID) TO service_role;

-- New sign-ups. Separate from handle_new_user so a failure here can never
-- block account creation itself.
CREATE OR REPLACE FUNCTION public.handle_new_profile_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_personal_workspace(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_workspace ON public.profiles;
CREATE TRIGGER on_profile_created_workspace
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_workspace();

-- Backfill. Admin accounts get one too: an admin is still a person with an
-- account menu, and excluding them would make active_workspace_id nullable in
-- practice everywhere downstream.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT id FROM public.profiles WHERE active_workspace_id IS NULL LOOP
    PERFORM public.ensure_personal_workspace(p.id);
  END LOOP;
END $$;
