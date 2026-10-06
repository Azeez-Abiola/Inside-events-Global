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
