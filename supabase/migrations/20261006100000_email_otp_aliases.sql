-- =====================================================================
-- Short verification codes delivered through Resend
--
-- Supabase's own email OTP length is fixed at 6 to 10 digits; the product
-- wants 4. Auth emails already route through our send-email hook and out via
-- Resend, so we control what the person actually receives.
--
-- This table maps a short code we generate onto the `token_hash` Supabase
-- issued for the same action. The person types our 4 digits; the server
-- exchanges them for Supabase's token_hash and hands that to verifyOtp. So
-- Supabase remains the only thing that confirms an email or mints a session —
-- we have changed what is printed in the email, not who decides.
--
-- SECURITY. Four digits is 10,000 combinations, a hundred times weaker than
-- the six Supabase would otherwise insist on. Online guessing is the real
-- risk, so the controls here are not optional:
--   * at most MAX_ATTEMPTS guesses before the code is burned
--   * short expiry
--   * single use
--   * only the service role can read or write this table, ever
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.email_otp_aliases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL,
  -- Supabase's own token for this action. Redeeming our code returns it.
  token_hash        TEXT NOT NULL,
  email_action_type TEXT NOT NULL,
  -- SHA-256 of the short code. With a 10,000-value space a hash is weak
  -- protection on its own, but it keeps plaintext codes out of backups and
  -- logs, and the attempt limit is what actually stops guessing.
  code_hash         TEXT NOT NULL,
  attempts          SMALLINT NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ NOT NULL,
  consumed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_otp_aliases IS
  'Short email verification codes mapped to the Supabase token_hash for the same action. Service role only.';

-- Redemption looks up the newest live code for an address.
CREATE INDEX IF NOT EXISTS idx_email_otp_aliases_lookup
  ON public.email_otp_aliases (lower(email), created_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_otp_aliases_expiry
  ON public.email_otp_aliases (expires_at);

ALTER TABLE public.email_otp_aliases ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies. RLS with no policy denies everyone; the service
-- role bypasses RLS. A client that could read this table could read the codes.
REVOKE ALL ON public.email_otp_aliases FROM anon, authenticated;
GRANT ALL ON public.email_otp_aliases TO service_role;

-- Housekeeping: expired and consumed rows have no further use. Called from
-- the hook so it needs no scheduler.
CREATE OR REPLACE FUNCTION public.purge_expired_email_otp_aliases()
RETURNS void
LANGUAGE SQL SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM public.email_otp_aliases
  WHERE expires_at < now() - INTERVAL '1 day'
     OR (consumed_at IS NOT NULL AND consumed_at < now() - INTERVAL '1 day')
$$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_email_otp_aliases() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_email_otp_aliases() TO service_role;
