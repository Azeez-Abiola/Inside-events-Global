-- Admin approve/reject workflow for waitlist signups
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS rejection_reason text;
