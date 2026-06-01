-- 1) Hide organiser contact PII and internal fields from anon (and from authenticated where appropriate).
-- Column-level REVOKE blocks direct REST/PostgREST access to these columns;
-- our public marketplace server functions use the service role and remain unaffected.
REVOKE SELECT (
  organiser_contact_email,
  organiser_contact_phone,
  organiser_contact_name,
  organiser_contact_role,
  vetting_notes,
  rejection_reason,
  form_data_draft
) ON public.events FROM anon;

-- Also hide vetting/rejection/draft notes from arbitrary authenticated users
-- (organisers still see them because RLS row matches and grants apply at table level).
REVOKE SELECT (vetting_notes, rejection_reason) ON public.events FROM authenticated;
GRANT SELECT (vetting_notes, rejection_reason) ON public.events TO authenticated;
-- Re-grant to authenticated so organisers (matched by RLS) can read them; anon stays revoked.

-- 2) organiser_profiles: hide internal fields from anonymous visitors.
REVOKE SELECT (event_history, track_record, past_sponsor_logos) ON public.organiser_profiles FROM anon;

-- 3) Storage: remove broad public listing of event-assets.
-- Public download URLs (/storage/v1/object/public/...) bypass RLS, so this does not
-- break the deck download flow. It only stops anon from enumerating bucket contents.
DROP POLICY IF EXISTS "event-assets public read" ON storage.objects;

-- Authenticated users can still list/read assets (needed for organiser dashboards & sponsors).
CREATE POLICY "event-assets authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-assets');

-- 4) Lock down email-queue SECURITY DEFINER helpers; only the service role
-- (used by the process-email-queue server route) should invoke them.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 5) Pin an explicit search_path on the email helpers so schema resolution
-- can't be hijacked by a malicious search_path on the caller's session.
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;