-- Allow media_partner on waitlist_signups (aligns with app_role public roles)
ALTER TABLE public.waitlist_signups
  DROP CONSTRAINT IF EXISTS waitlist_signups_audience_check;

ALTER TABLE public.waitlist_signups
  ADD CONSTRAINT waitlist_signups_audience_check
  CHECK (audience IN ('organiser', 'sponsor', 'referral_partner', 'media_partner'));
