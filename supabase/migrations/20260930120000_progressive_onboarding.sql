-- =====================================================================
-- Progressive onboarding (TAB 3 §3.2A, §3.3)
--
-- Onboarding stops being a submit-and-wait application. Compulsory sections
-- get someone to their dashboard; Verification & trust can be completed later,
-- with specific features locked until it is.
--
-- §3.2A: "The compulsory and deferrable split is configuration, not code, so
-- ABW can move a section between the two without a new release." Hence a table
-- rather than a constant. Code keeps a default map as a fallback, so an empty
-- or unreachable table degrades to today's behaviour instead of locking people
-- out of their own onboarding.
-- =====================================================================

-- Per-section progress: not_started / complete / skipped, keyed by section id
-- (the section letter). Distinct from `sections`, which holds the answers.
ALTER TABLE public.onboarding_applications
  ADD COLUMN IF NOT EXISTS section_status JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.onboarding_applications.section_status IS
  'Per-section progress keyed by section id: not_started | complete | skipped. A skipped section is deferrable and still outstanding.';

-- Verification is now its own lifecycle, separate from the listing review.
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM (
    'not_submitted',
    'submitted',
    'verified',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.onboarding_applications
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'not_submitted';

-- Account-level onboarding state (TAB 3 §3.3). Sits on the profile because it
-- gates dashboard access and feature locks, which are account concerns, not
-- application concerns.
DO $$ BEGIN
  CREATE TYPE public.onboarding_progress AS ENUM (
    'compulsory_incomplete',
    'compulsory_complete',
    'fully_complete'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_status public.onboarding_progress NOT NULL DEFAULT 'compulsory_incomplete';

COMMENT ON COLUMN public.profiles.onboarding_status IS
  'compulsory_incomplete -> compulsory_complete (dashboard unlocked) -> fully_complete (deferred sections done too).';

-- ─── Section configuration ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.onboarding_section_config (
  role         TEXT NOT NULL CHECK (role IN ('organiser','sponsor','referral_partner','media_partner','partnerships_pro','creative_hub')),
  section_key  TEXT NOT NULL,
  compulsory   BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID REFERENCES auth.users(id),
  PRIMARY KEY (role, section_key)
);

COMMENT ON TABLE public.onboarding_section_config IS
  'Which onboarding sections are compulsory per role. Editable by Super Admin so the split can change without a release (TAB 3 §3.2A).';

ALTER TABLE public.onboarding_section_config ENABLE ROW LEVEL SECURITY;

-- Everyone signed in needs to read it to render their own wizard.
DROP POLICY IF EXISTS "authenticated read section config" ON public.onboarding_section_config;
CREATE POLICY "authenticated read section config" ON public.onboarding_section_config
  FOR SELECT TO authenticated USING (true);

-- Only admins change it; writes go through the service role in practice.
DROP POLICY IF EXISTS "admins manage section config" ON public.onboarding_section_config;
CREATE POLICY "admins manage section config" ON public.onboarding_section_config
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed the v6.2 split: everything compulsory except Verification & trust.
-- Section letters differ by role, which is exactly why §3.2A says to key the
-- flag to the section id rather than its letter.
INSERT INTO public.onboarding_section_config (role, section_key, compulsory) VALUES
  ('organiser','a',true),('organiser','b',true),('organiser','c',true),
  ('organiser','d',true),('organiser','e',true),('organiser','f',true),
  ('organiser','g',true),('organiser','h',false),('organiser','i',true),

  ('sponsor','a',true),('sponsor','b',true),('sponsor','c',true),
  ('sponsor','d',true),('sponsor','e',true),('sponsor','f',true),
  ('sponsor','g',false),('sponsor','h',true),

  ('referral_partner','a',true),('referral_partner','b',true),('referral_partner','c',true),
  ('referral_partner','d',true),('referral_partner','e',true),('referral_partner','f',true),
  ('referral_partner','g',false),('referral_partner','h',true),

  ('media_partner','a',true),('media_partner','b',true),('media_partner','c',true),
  ('media_partner','d',true),('media_partner','e',true),('media_partner','f',true),
  ('media_partner','g',false),('media_partner','h',true),

  ('partnerships_pro','a',true),('partnerships_pro','b',true),('partnerships_pro','c',true),
  ('partnerships_pro','d',true),('partnerships_pro','e',true),('partnerships_pro','f',true),
  ('partnerships_pro','g',false),('partnerships_pro','h',true),

  ('creative_hub','a',true),('creative_hub','b',true),('creative_hub','c',true),
  ('creative_hub','d',true),('creative_hub','e',true),('creative_hub','f',true),
  ('creative_hub','g',false),('creative_hub','h',true)
ON CONFLICT (role, section_key) DO NOTHING;
