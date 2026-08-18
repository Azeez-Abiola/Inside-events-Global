-- =====================================================================
-- Onboarding Applications
-- Full PRD §3 wizard submissions with per-section JSONB storage,
-- status lifecycle, admin review notes, and NDPA/GDPR consent capture.
-- =====================================================================

-- Status enum
DO $$ BEGIN
  CREATE TYPE public.onboarding_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'changes_requested'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Main applications table
CREATE TABLE IF NOT EXISTS public.onboarding_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('organiser','sponsor','referral_partner','media_partner','partnerships_pro','creative_hub','ige_admin')),
  status              public.onboarding_status NOT NULL DEFAULT 'draft',

  -- Sections stored as a single JSONB blob keyed by section letter (a, b, c…)
  -- This allows the wizard to save incrementally without schema changes per role.
  sections            JSONB NOT NULL DEFAULT '{}',

  -- Current section the user was last on (0-indexed section letter index)
  current_section     SMALLINT NOT NULL DEFAULT 0,

  -- Admin review
  reviewer_id         UUID REFERENCES auth.users(id),
  reviewer_notes      JSONB NOT NULL DEFAULT '{}',  -- { "sectionKey": "note text" }
  reviewed_at         TIMESTAMPTZ,

  -- NDPA/GDPR data-processing consent (separate from general Terms)
  data_consent_at     TIMESTAMPTZ,
  data_consent_ip     TEXT,
  data_consent_version TEXT NOT NULL DEFAULT '1.0',

  -- General Terms & Privacy consent (final section)
  terms_consent_at    TIMESTAMPTZ,
  terms_consent_ip    TEXT,

  -- Submission tracking
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id)  -- one application per user (v1)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_onboarding_applications_updated ON public.onboarding_applications;
CREATE TRIGGER trg_onboarding_applications_updated
  BEFORE UPDATE ON public.onboarding_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.onboarding_applications (status);
CREATE INDEX IF NOT EXISTS idx_onboarding_user   ON public.onboarding_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_role   ON public.onboarding_applications (role);

-- RLS
ALTER TABLE public.onboarding_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own application" ON public.onboarding_applications;
CREATE POLICY "users manage own application" ON public.onboarding_applications
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins view all applications" ON public.onboarding_applications;
CREATE POLICY "admins view all applications" ON public.onboarding_applications
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins update application status" ON public.onboarding_applications;
CREATE POLICY "admins update application status" ON public.onboarding_applications
  FOR UPDATE TO authenticated
  USING  (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.onboarding_applications TO authenticated;
GRANT ALL ON public.onboarding_applications TO service_role;

-- Comments
COMMENT ON TABLE  public.onboarding_applications IS 'Full onboarding wizard submissions per user (PRD §3.3)';
COMMENT ON COLUMN public.onboarding_applications.sections IS 'Keyed by section letter (a–i); each value is the raw field map for that section';
COMMENT ON COLUMN public.onboarding_applications.reviewer_notes IS 'Per-section review notes keyed by section letter, set by admin during changes_requested';
COMMENT ON COLUMN public.onboarding_applications.data_consent_at IS 'NDPA/GDPR data-processing consent timestamp (§3.11.4)';
COMMENT ON COLUMN public.onboarding_applications.terms_consent_at IS 'General Terms & Privacy consent timestamp';
