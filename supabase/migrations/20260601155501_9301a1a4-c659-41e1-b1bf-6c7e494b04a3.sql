-- waitlist_signups: replace WITH CHECK (true) with explicit validation
DROP POLICY IF EXISTS "anyone can join waitlist" ON public.waitlist_signups;
CREATE POLICY "anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(full_name) BETWEEN 1 AND 200
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
  AND audience IS NOT NULL AND length(audience) BETWEEN 1 AND 80
  AND consent_given = true
);

-- sponsorship_interests: same treatment
DROP POLICY IF EXISTS "anyone can express sponsor interest" ON public.sponsorship_interests;
CREATE POLICY "anyone can express sponsor interest"
ON public.sponsorship_interests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL AND length(full_name) BETWEEN 1 AND 200
  AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
);