-- Extend waitlist_signups for full intake forms
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_audience ON public.waitlist_signups(audience);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_status ON public.waitlist_signups(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON public.waitlist_signups(created_at DESC);