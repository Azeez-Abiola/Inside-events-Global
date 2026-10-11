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
