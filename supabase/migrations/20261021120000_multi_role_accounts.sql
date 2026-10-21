-- =====================================================================
-- Multi-role accounts.
--
-- One account can hold several roles (say Sponsor + Organiser + Creative
-- Hub). user_roles already allowed that (UNIQUE (user_id, role)); what
-- assumed one role was onboarding and the dashboard. This migration:
--   1. lets onboarding_applications hold one application per role,
--   2. records which role's dashboard the account last used, and
--   3. teaches the signup trigger every role, and several at once.
-- Safe to run more than once.
-- =====================================================================

-- ── 1. One onboarding application per (account, role) ────────────────
DO $$
DECLARE c RECORD;
BEGIN
  -- The v1 table had UNIQUE (user_id). Drop whatever enforces "user_id alone",
  -- whether it was created as a constraint or as a bare unique index.
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.onboarding_applications'::regclass
      AND con.contype = 'u'
      AND con.conkey = ARRAY[(SELECT attnum FROM pg_attribute
                              WHERE attrelid = con.conrelid AND attname = 'user_id')]
  LOOP
    EXECUTE format('ALTER TABLE public.onboarding_applications DROP CONSTRAINT %I', c.conname);
  END LOOP;

  FOR c IN
    SELECT i.relname AS idx
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    WHERE x.indrelid = 'public.onboarding_applications'::regclass
      AND x.indisunique AND NOT x.indisprimary
      AND x.indkey::int2[] = ARRAY[(SELECT attnum FROM pg_attribute
                                   WHERE attrelid = x.indrelid AND attname = 'user_id')]::int2[]
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', c.idx);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_applications_user_role_key
  ON public.onboarding_applications (user_id, role);

-- ── 2. The role whose dashboard the account is using ─────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_role public.app_role;

-- ── 3. Signup trigger: all six roles, one or several ─────────────────
-- Reads `role` (the primary pick) and `roles` (every pick) from the signup
-- metadata. Before this, creative_hub and partnerships_pro fell through to
-- 'sponsor'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_picks TEXT[] := ARRAY[]::TEXT[];
  v_pick TEXT;
  v_first public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, email_domain)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 2));

  IF NEW.raw_user_meta_data ? 'role' THEN
    v_picks := array_append(v_picks, NEW.raw_user_meta_data->>'role');
  END IF;
  IF jsonb_typeof(NEW.raw_user_meta_data->'roles') = 'array' THEN
    v_picks := v_picks || ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles'));
  END IF;

  FOREACH v_pick IN ARRAY v_picks LOOP
    IF v_pick IN ('organiser','sponsor','referral_partner','media_partner',
                  'partnerships_pro','creative_hub') THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, v_pick::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
      v_first := COALESCE(v_first, v_pick::public.app_role);
    END IF;
  END LOOP;

  IF v_first IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sponsor')
    ON CONFLICT (user_id, role) DO NOTHING;
    v_first := 'sponsor';
  END IF;

  UPDATE public.profiles SET active_role = v_first WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ── 4. Repair: roles the old trigger dropped ─────────────────────────
-- The old trigger stored Creative Hub and Partnerships Pro signups as
-- 'sponsor'. Their onboarding application still records the role they
-- picked, so give them that role back. The stray 'sponsor' row is left in
-- place (they may have used it); remove it by hand if it is wrong.
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT a.user_id, a.role::public.app_role
FROM public.onboarding_applications a
WHERE a.role IN ('organiser','sponsor','referral_partner','media_partner',
                 'partnerships_pro','creative_hub')
ON CONFLICT (user_id, role) DO NOTHING;

-- Who was affected (run on its own to review):
--   SELECT p.email, a.role AS picked
--   FROM public.onboarding_applications a
--   JOIN public.profiles p ON p.id = a.user_id
--   WHERE a.role IN ('partnerships_pro','creative_hub')
--   AND EXISTS (SELECT 1 FROM public.user_roles r
--               WHERE r.user_id = a.user_id AND r.role = 'sponsor');
