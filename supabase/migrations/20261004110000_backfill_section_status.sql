-- =====================================================================
-- Backfill section_status from the answers already on file
--
-- section_status arrived with the progressive onboarding migration and
-- defaults to '{}'. Applications started before it therefore look entirely
-- unstarted, even where every section is filled in — so the new dashboard
-- gate would send those people back through a wizard they had finished, to
-- re-confirm answers it already holds.
--
-- `sections` is keyed by section id and only ever holds a key once that
-- section has been saved, so its keys are exactly the completed sections.
-- The '__role' key is the role picker, not a section, and is excluded.
-- =====================================================================

UPDATE public.onboarding_applications
SET section_status = (
  SELECT COALESCE(jsonb_object_agg(key, 'complete'), '{}'::jsonb)
  FROM jsonb_object_keys(sections) AS key
  WHERE key <> '__role'
)
WHERE section_status = '{}'::jsonb
  AND sections IS NOT NULL
  AND sections <> '{}'::jsonb;

-- Now that per-section progress is known, derive the account-level state the
-- gate reads. Anything already submitted or approved is treated as complete
-- regardless: those accounts were through the old flow and must not be sent
-- backwards. The rest are computed in the application layer on next save —
-- this only has to stop people being locked out in the meantime.
UPDATE public.profiles p
SET onboarding_status = 'compulsory_complete'
FROM public.onboarding_applications a
WHERE a.user_id = p.id
  AND a.status IN ('submitted', 'under_review', 'approved')
  AND p.onboarding_status = 'compulsory_incomplete';

-- v6.2 §3.2A removed Admin approval from accounts. Anyone deactivated purely
-- by the old "submit onboarding -> is_active = false" path is reactivated;
-- suspensions, which are a separate deliberate admin action, are left alone.
UPDATE public.profiles p
SET is_active = true
FROM public.onboarding_applications a
WHERE a.user_id = p.id
  AND p.is_active = false
  AND p.is_suspended = false
  AND a.status IN ('submitted', 'under_review', 'approved');
