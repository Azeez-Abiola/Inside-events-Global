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
