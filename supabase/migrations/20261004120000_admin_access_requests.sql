-- =====================================================================
-- Admin access requests (TAB 3 §3.6.7)
--
-- "Admin accounts are invite-only and do NOT go through the public onboarding
--  wizard or matching engine. Selecting 'IGE Admin' on the role-select screen
--  routes the user to a short access-request form instead. An existing
--  super-admin reviews and grants access manually... kept in a separate
--  'Admin access requests' list, not the public Vetting Queue."
--
-- Requests are only accepted from ABW or IGE domains. That is enforced in the
-- server function as well, so the rule holds whichever door a request
-- arrives through.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.admin_access_request_status AS ENUM ('pending', 'granted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.admin_access_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable: someone can request access before they hold an IGE account.
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     TEXT NOT NULL,
  work_email    TEXT NOT NULL,
  role_at_org   TEXT NOT NULL,
  reason        TEXT NOT NULL,
  status        public.admin_access_request_status NOT NULL DEFAULT 'pending',
  terms_consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  review_note   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_access_requests IS
  'TAB 3 §3.6.7. Deliberately separate from the Vetting Queue — accounts are not vetted, events are.';

-- One outstanding request per address; a rejected one can be re-submitted.
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_access_requests_pending
  ON public.admin_access_requests(lower(work_email)) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status
  ON public.admin_access_requests(status, created_at DESC);

ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;

-- Writes go through the service role so the domain allow-list cannot be
-- bypassed by posting straight at PostgREST, and so an anonymous request is
-- still possible. No client-side INSERT policy is granted on purpose.
DROP POLICY IF EXISTS "requester views own request" ON public.admin_access_requests;
CREATE POLICY "requester views own request" ON public.admin_access_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "super admins manage access requests" ON public.admin_access_requests;
CREATE POLICY "super admins manage access requests" ON public.admin_access_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

GRANT SELECT ON public.admin_access_requests TO authenticated;
GRANT ALL ON public.admin_access_requests TO service_role;
