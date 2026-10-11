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
