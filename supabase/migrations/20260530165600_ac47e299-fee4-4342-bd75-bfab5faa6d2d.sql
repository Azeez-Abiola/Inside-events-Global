CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('organiser','sponsor','referral_partner')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  role_title TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins view waitlist"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE INDEX idx_waitlist_signups_audience ON public.waitlist_signups(audience);
CREATE UNIQUE INDEX idx_waitlist_signups_email_audience ON public.waitlist_signups(lower(email), audience);